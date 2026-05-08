import re
from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import (
    OrdenVenta,
    TransaccionPago,
    HistorialEstadosOrden,
    SeguimientoPago,
    NotificacionCliente,
    DocumentoOrden,
    Reserva,
    PlanPago,
    CuotaPlan,
)
from apps.clientes.models import Cliente
from apps.vehiculos.models import VehiculoNuevo
from apps.catalogos.models import CtEstadoOrden, CtEstadoPago
from . import services

# ─── Máquina de estados (mismo mapa que el frontend) ─────────────────────────
TRANSICIONES_VALIDAS: dict[int, list[int]] = {
    1: [2, 6],    # PENDIENTE → EN_PROCESO, CANCELADA
    2: [3, 4, 6], # EN_PROCESO → APROBADA, RECHAZADA, CANCELADA
    3: [5, 6],    # APROBADA → COMPLETADA, CANCELADA
    4: [1],       # RECHAZADA → PENDIENTE
    5: [],        # COMPLETADA (estado terminal)
    6: [1],       # CANCELADA → PENDIENTE
}

# ─── Regex de validación ──────────────────────────────────────────────────────
_PHONE_RE = re.compile(r'^\d{7,15}$')
_IDENT_RE = re.compile(r'^\d{4,20}$')


# ─────────────────────────────────────────────────────────────────────────────
# RESERVAS
# ─────────────────────────────────────────────────────────────────────────────

class ReservaSerializer(serializers.ModelSerializer):
    vehiculo_vin = serializers.CharField(source='vehiculo.vin', read_only=True)
    vehiculo_modelo = serializers.SerializerMethodField()
    cliente_nombre = serializers.SerializerMethodField()
    vendedor_nombre = serializers.SerializerMethodField()
    dias_restantes = serializers.IntegerField(read_only=True)
    orden_codigo = serializers.CharField(source='orden.codigo_orden', read_only=True, default=None)

    class Meta:
        model = Reserva
        fields = [
            'id', 'vehiculo', 'vehiculo_vin', 'vehiculo_modelo',
            'cliente', 'cliente_nombre', 'vendedor', 'vendedor_nombre',
            'fecha_inicio', 'fecha_vencimiento', 'monto_separacion',
            'estado', 'notas', 'dias_restantes', 'orden', 'orden_codigo',
        ]
        read_only_fields = ['id', 'fecha_inicio', 'estado', 'orden']

    def get_vehiculo_modelo(self, obj):
        v = obj.vehiculo
        if v and v.version:
            ver = v.version
            return f"{ver.modelo.marca.nombre} {ver.modelo.nombre} {ver.nombre_version}".strip()
        return ''

    def get_cliente_nombre(self, obj):
        return obj.cliente.nombre_completo if obj.cliente else None

    def get_vendedor_nombre(self, obj):
        if obj.vendedor and obj.vendedor.user:
            return f"{obj.vendedor.user.first_name} {obj.vendedor.user.last_name}".strip()
        return ''


class CreateReservaSerializer(serializers.Serializer):
    vehiculo_id = serializers.IntegerField()
    cliente_id = serializers.IntegerField(required=False, allow_null=True)
    dias = serializers.IntegerField(default=7, min_value=1, max_value=90)
    monto_separacion = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )
    notas = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_vehiculo_id(self, value):
        if not VehiculoNuevo.objects.filter(id=value).exists():
            raise serializers.ValidationError('Vehículo no encontrado.')
        return value

    def validate_cliente_id(self, value):
        if value and not Cliente.objects.filter(id=value).exists():
            raise serializers.ValidationError('Cliente no encontrado.')
        return value


# ─────────────────────────────────────────────────────────────────────────────
# PLAN DE PAGOS
# ─────────────────────────────────────────────────────────────────────────────

class CuotaPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuotaPlan
        fields = [
            'id', 'numero_cuota', 'monto_esperado', 'fecha_vencimiento',
            'fecha_pago_real', 'estado',
        ]


class PlanPagoSerializer(serializers.ModelSerializer):
    cuotas = CuotaPlanSerializer(many=True, read_only=True)
    monto_por_cuota = serializers.SerializerMethodField()

    class Meta:
        model = PlanPago
        fields = [
            'id', 'tipo', 'total_acordado', 'cuotas_totales',
            'periodicidad', 'fecha_inicio', 'estado', 'cuotas', 'monto_por_cuota',
        ]

    def get_monto_por_cuota(self, obj):
        return round(obj.monto_por_cuota, 2)


# ─────────────────────────────────────────────────────────────────────────────
# CREAR ORDEN DE VENTA
# ─────────────────────────────────────────────────────────────────────────────

class OrdenVentaCreateSerializer(serializers.Serializer):
    # Datos del cliente
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone1 = serializers.CharField(max_length=20)
    phone2 = serializers.CharField(max_length=20, required=False, allow_blank=True)
    identificacion = serializers.CharField(max_length=50)
    nacionalidad = serializers.CharField(max_length=50)
    direccion = serializers.CharField(max_length=255)
    estado = serializers.CharField(max_length=100)

    # Datos del vehículo
    vehiculo_id = serializers.IntegerField(required=True)

    # Datos de pago
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    moneda = serializers.CharField(max_length=10)
    monto_inicial = serializers.DecimalField(max_digits=12, decimal_places=2)
    tasa_cambio = serializers.DecimalField(
        max_digits=10, decimal_places=4, required=False, allow_null=True
    )
    paymentMethod = serializers.CharField(max_length=50)
    entidad_financiera = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=''
    )
    reference_number = serializers.CharField(max_length=100)
    fecha_pago = serializers.DateField()
    numero_cuotas = serializers.IntegerField(required=False, allow_null=True)
    numero_cuenta = serializers.CharField(max_length=50, required=False, allow_blank=True)
    ultimos_digitos_tarjeta = serializers.CharField(max_length=4, required=False, allow_blank=True)
    url_comprobante = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=''
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    # ── Validadores numéricos ────────────────────────────────────────────────

    def validate_phone1(self, value):
        cleaned = re.sub(r'[\s\-().+]', '', value)
        if not cleaned.isdigit() or not (7 <= len(cleaned) <= 15):
            raise serializers.ValidationError(
                'El teléfono debe contener solo dígitos (7–15 caracteres).'
            )
        return value

    def validate_phone2(self, value):
        if not value:
            return value
        cleaned = re.sub(r'[\s\-().+]', '', value)
        if cleaned and (not cleaned.isdigit() or not (7 <= len(cleaned) <= 15)):
            raise serializers.ValidationError(
                'El teléfono 2 debe contener solo dígitos (7–15 caracteres).'
            )
        return value

    def validate_identificacion(self, value):
        cleaned = re.sub(r'[\s\-]', '', value)
        if not cleaned.isdigit() or not (4 <= len(cleaned) <= 20):
            raise serializers.ValidationError(
                'La identificación debe contener solo dígitos (4–20 caracteres).'
            )
        return value

    def validate_reference_number(self, value):
        if TransaccionPago.objects.filter(referencia=value).exists():
            raise serializers.ValidationError(
                'Ya existe una transacción con este número de referencia.'
            )
        return value

    def validate_vehiculo_id(self, value):
        try:
            vehiculo = VehiculoNuevo.objects.get(id=value)
        except VehiculoNuevo.DoesNotExist:
            raise serializers.ValidationError('El vehículo seleccionado no existe.')
        if vehiculo.estado_comercial not in [
            VehiculoNuevo.ESTADO_COMERCIAL_DISPONIBLE,
            VehiculoNuevo.ESTADO_COMERCIAL_RESERVADO,
        ]:
            raise serializers.ValidationError(
                f'El vehículo no está disponible para venta. '
                f'Estado actual: {vehiculo.get_estado_comercial_display()}.'
            )
        return value

    def validate(self, data):
        monto_total = data.get('price', 0)
        monto_inicial = data.get('monto_inicial', 0)
        if monto_inicial and monto_total and float(monto_inicial) > float(monto_total):
            raise serializers.ValidationError(
                {'monto_inicial': 'El monto inicial no puede superar el precio total.'}
            )
        return data

    def create(self, validated_data):
        try:
            vendedor = self.context['request'].user.vendedor
        except Exception:
            vendedor = None

        cliente_data = {
            k: validated_data.get(k, '')
            for k in ['first_name', 'last_name', 'email', 'phone1', 'phone2',
                      'identificacion', 'nacionalidad', 'direccion', 'estado']
        }
        pago_data = {
            k: validated_data.get(k)
            for k in ['price', 'moneda', 'monto_inicial', 'tasa_cambio', 'paymentMethod',
                      'entidad_financiera', 'reference_number', 'fecha_pago', 'numero_cuotas']
        }
        try:
            return services.crear_venta_directa(
                vehiculo_id=validated_data['vehiculo_id'],
                cliente_data=cliente_data,
                pago_data=pago_data,
                vendedor=vendedor,
            )
        except services.VehiculoNoDisponible as e:
            raise serializers.ValidationError({'vehiculo_id': str(e)})


# ─────────────────────────────────────────────────────────────────────────────
# ACTUALIZAR ESTADO DE ORDEN
# ─────────────────────────────────────────────────────────────────────────────

class OrdenVentaUpdateSerializer(serializers.Serializer):
    estado_orden = serializers.IntegerField()
    motivo_cambio = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_estado_orden(self, value):
        if not CtEstadoOrden.objects.filter(id=value).exists():
            raise serializers.ValidationError('Estado de orden inválido.')
        return value

    def validate(self, data):
        nuevo = data['estado_orden']
        estado_actual = self.instance.estado_orden_id if self.instance else None
        if estado_actual is not None:
            permitidos = TRANSICIONES_VALIDAS.get(estado_actual, [])
            if nuevo not in permitidos:
                nombres = {1: 'Pendiente', 2: 'En Proceso', 3: 'Aprobada',
                           4: 'Rechazada', 5: 'Completada', 6: 'Cancelada'}
                raise serializers.ValidationError({
                    'estado_orden': (
                        f'Transición inválida: "{nombres.get(estado_actual, estado_actual)}" '
                        f'→ "{nombres.get(nuevo, nuevo)}". '
                        f'Estados permitidos: {[nombres.get(p, p) for p in permitidos] or ["ninguno (estado final)"]}'
                    )
                })
        return data

    @transaction.atomic
    def update(self, instance, validated_data):
        estado_anterior = instance.estado_orden
        nuevo = validated_data['estado_orden']
        motivo = validated_data.get('motivo_cambio', '')

        instance.estado_orden_id = nuevo

        if instance.vehiculo:
            if nuevo == 5:  # Completada → Vendido
                instance.vehiculo.estado_comercial = VehiculoNuevo.ESTADO_COMERCIAL_VENDIDO
                instance.vehiculo.save(update_fields=['estado_comercial'])
            elif nuevo in [4, 6]:  # Rechazada / Cancelada → Disponible
                instance.vehiculo.estado_comercial = VehiculoNuevo.ESTADO_COMERCIAL_DISPONIBLE
                instance.vehiculo.save(update_fields=['estado_comercial'])

        instance.save()

        try:
            vendedor = self.context['request'].user.vendedor
        except Exception:
            vendedor = None

        HistorialEstadosOrden.objects.create(
            orden=instance,
            estado_anterior=estado_anterior,
            estado_nuevo_id=nuevo,
            responsable=vendedor,
            motivo_cambio=motivo or None,
        )
        return instance


# ─────────────────────────────────────────────────────────────────────────────
# LISTAR ÓRDENES
# ─────────────────────────────────────────────────────────────────────────────

class OrdenVentaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre_completo', read_only=True)
    cliente_email = serializers.CharField(source='cliente.correo', read_only=True)
    cliente_telefono = serializers.CharField(source='cliente.telefono_1', read_only=True)
    vendedor_nombre = serializers.SerializerMethodField()
    vehiculo_vin = serializers.CharField(source='vehiculo.vin', read_only=True)
    vehiculo_color = serializers.CharField(source='vehiculo.color_exterior', read_only=True)
    vehiculo_modelo = serializers.SerializerMethodField()
    transaccion_info = serializers.SerializerMethodField()

    class Meta:
        model = OrdenVenta
        fields = [
            'id', 'codigo_orden', 'precio_final_venta', 'fecha_creacion',
            'cliente_nombre', 'cliente_email', 'cliente_telefono',
            'vendedor_nombre', 'vehiculo_vin', 'vehiculo_color', 'vehiculo_modelo',
            'transaccion_info', 'estado_orden',
        ]

    def get_vendedor_nombre(self, obj):
        if obj.vendedor and obj.vendedor.user:
            return f"{obj.vendedor.user.first_name} {obj.vendedor.user.last_name}".strip()
        return ''

    def get_vehiculo_modelo(self, obj):
        if obj.vehiculo and obj.vehiculo.version:
            ver = obj.vehiculo.version
            return f"{ver.modelo.marca.nombre} {ver.modelo.nombre} {ver.nombre_version}"
        return ''

    def get_transaccion_info(self, obj):
        try:
            t = obj.transacciones_pago.first()
            if t:
                return {
                    'id': t.id,
                    'monto': str(t.monto),
                    'monto_inicial': str(t.monto_inicial),
                    'monto_restante': str(t.monto_restante),
                    'moneda': t.moneda,
                    'metodo_pago': t.metodo_pago,
                    'referencia': t.referencia,
                    'fecha_pago': t.fecha_pago,
                    'estado_pago': t.estado_pago_id,
                }
        except Exception:
            pass
        return None


# ─────────────────────────────────────────────────────────────────────────────
# DETALLE COMPLETO
# ─────────────────────────────────────────────────────────────────────────────

class SeguimientoPagoSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source='estado.estado_pago', read_only=True)

    class Meta:
        model = SeguimientoPago
        fields = [
            'id', 'numero_cuota', 'monto_pagado', 'fecha_pago',
            'fecha_vencimiento', 'estado', 'estado_nombre',
            'comprobante_url', 'notas',
        ]


class NotificacionSerializer(serializers.ModelSerializer):
    enviado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = NotificacionCliente
        fields = [
            'id', 'tipo', 'asunto', 'mensaje', 'fecha_envio',
            'enviado_por_nombre', 'estado_envio',
        ]

    def get_enviado_por_nombre(self, obj):
        if obj.enviado_por and obj.enviado_por.user:
            return f"{obj.enviado_por.user.first_name} {obj.enviado_por.user.last_name}"
        return ''


class DocumentoOrdenSerializer(serializers.ModelSerializer):
    subido_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoOrden
        fields = [
            'id', 'tipo_documento', 'nombre', 'url_archivo',
            'fecha_subida', 'subido_por_nombre',
        ]

    def get_subido_por_nombre(self, obj):
        if obj.subido_por and obj.subido_por.user:
            return f"{obj.subido_por.user.first_name} {obj.subido_por.user.last_name}"
        return ''


class OrdenVentaDetalleSerializer(serializers.ModelSerializer):
    cliente_info = serializers.SerializerMethodField()
    vendedor_info = serializers.SerializerMethodField()
    vehiculo_info = serializers.SerializerMethodField()
    transaccion = serializers.SerializerMethodField()
    plan_pago = serializers.SerializerMethodField()
    pagos_parciales = serializers.SerializerMethodField()
    notificaciones = serializers.SerializerMethodField()
    documentos = serializers.SerializerMethodField()
    historial_estados = serializers.SerializerMethodField()
    estado_orden_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = OrdenVenta
        fields = [
            'id', 'codigo_orden', 'precio_final_venta', 'fecha_creacion',
            'cliente_info', 'vendedor_info', 'vehiculo_info',
            'transaccion', 'plan_pago', 'pagos_parciales', 'notificaciones',
            'documentos', 'historial_estados', 'estado_orden_id',
        ]

    def get_cliente_info(self, obj):
        if not obj.cliente:
            return None
        return {
            'id': obj.cliente.id,
            'nombre': obj.cliente.nombre_completo,
            'email': obj.cliente.correo,
            'telefono_1': obj.cliente.telefono_1,
            'telefono_2': obj.cliente.telefono_2,
            'identificacion': obj.cliente.identificacion,
            'direccion': obj.cliente.direccion,
            'nacionalidad_id': obj.cliente.nacionalidad_id,
            'estado_id': obj.cliente.estado_id,
        }

    def get_vendedor_info(self, obj):
        if not obj.vendedor:
            return None
        return {
            'id': obj.vendedor.id,
            'nombre': obj.vendedor.nombre_completo,
            'email': obj.vendedor.email,
            'telefono': obj.vendedor.telefono_1,
            'identificacion': obj.vendedor.identificacion,
        }

    def get_vehiculo_info(self, obj):
        if not obj.vehiculo:
            return None
        v = obj.vehiculo
        info = {
            'id': v.id,
            'vin': v.vin,
            'color_exterior': v.color_exterior,
            'color_interior': v.color_interior,
            'numero_motor': v.numero_motor,
            'numero_chasis': v.numero_chasis,
            'precio_lista': str(v.precio_lista_sugerido) if v.precio_lista_sugerido else None,
            'estado_id': v.estado_id,
            'estado_comercial': v.estado_comercial,
            'estado_comercial_label': v.get_estado_comercial_display(),
            'ubicacion': v.ubicacion_fisica.nombre if v.ubicacion_fisica else None,
            'lote_codigo': v.lote.codigo_lote if v.lote else None,
        }
        if v.version:
            info['version'] = {
                'nombre': v.version.nombre_version or '',
                'motorizacion': v.version.motorizacion or '',
                'transmision': v.version.transmision or '',
                'año_modelo': str(v.version.año_modelo) if v.version.año_modelo else '',
            }
            if v.version.modelo:
                info['modelo'] = {
                    'nombre': v.version.modelo.nombre,
                    'marca': v.version.modelo.marca.nombre if v.version.modelo.marca else '',
                }
        return info

    def get_transaccion(self, obj):
        t = obj.transacciones_pago.first()
        if not t:
            return None
        monto_total = float(t.monto) if t.monto else 0
        # Monto pagado = inicial + suma de parciales APROBADOS/VERIFICADOS
        total_pagado = float(t.monto_inicial or 0) + sum(
            float(p.monto_pagado or 0)
            for p in t.pagos_parciales.all()
            if p.estado_id in [2, 3]  # PAGADO o VERIFICADO
        )
        porcentaje = round(min((total_pagado / monto_total) * 100, 100), 2) if monto_total else 0
        return {
            'id': t.id,
            'monto_total': str(t.monto),
            'monto_inicial': str(t.monto_inicial),
            'monto_restante': str(t.monto_restante),
            'moneda': t.moneda or 'USD',
            'tasa_cambio': str(t.tasa_cambio) if t.tasa_cambio else None,
            'metodo_pago_id': t.metodo_pago,
            'metodo_pago_nombre': self._metodo_nombre(t.metodo_pago),
            'referencia': t.referencia,
            'fecha_pago': t.fecha_pago,
            'estado_pago_id': t.estado_pago_id,
            'estado_pago_nombre': t.estado_pago.estado_pago if t.estado_pago else 'Pendiente',
            'entidad_financiera_id': t.entidad_financiera_id,
            'entidad_financiera_nombre': t.entidad_financiera.nombre if t.entidad_financiera else None,
            'porcentaje_pagado': porcentaje,
        }

    def get_plan_pago(self, obj):
        try:
            return PlanPagoSerializer(obj.plan_pago).data
        except PlanPago.DoesNotExist:
            return None

    def get_pagos_parciales(self, obj):
        t = obj.transacciones_pago.first()
        if not t:
            return []
        return SeguimientoPagoSerializer(
            t.pagos_parciales.all().order_by('numero_cuota'), many=True
        ).data

    def get_notificaciones(self, obj):
        return NotificacionSerializer(
            obj.notificaciones.all().order_by('-fecha_envio')[:20], many=True
        ).data

    def get_documentos(self, obj):
        return DocumentoOrdenSerializer(obj.documentos.all(), many=True).data

    def get_historial_estados(self, obj):
        return [
            {
                'id': h.id,
                'estado_anterior': h.estado_anterior.estado_orden if h.estado_anterior else 'Creación',
                'estado_nuevo': h.estado_nuevo.estado_orden if h.estado_nuevo else None,
                'fecha_cambio': h.fecha_cambio,
                'responsable': h.responsable.nombre_completo if h.responsable else None,
                'motivo_cambio': h.motivo_cambio,
            }
            for h in obj.historial_estados.all()
        ]

    @staticmethod
    def _metodo_nombre(mid):
        return {
            1: 'Efectivo', 2: 'Transferencia Bancaria', 3: 'Financiamiento',
            4: 'Tarjeta de Crédito', 5: 'Tarjeta de Débito',
            6: 'Cheque', 7: 'Criptomoneda', 8: 'Otro',
        }.get(mid, f'Método {mid}')
