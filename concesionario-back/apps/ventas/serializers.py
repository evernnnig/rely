# apps/ventas/serializers.py
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
)
from apps.clientes.models import Cliente
from apps.vehiculos.models import VehiculoNuevo
from apps.catalogos.models import *


# ============================================================
# SERIALIZER PARA CREAR ORDEN (FORMULARIO DE VENTA)
# ============================================================
class OrdenVentaCreateSerializer(serializers.Serializer):
    """Serializer para crear una orden de venta completa"""
    
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
    vehicleModel = serializers.CharField(max_length=200)
    vehicleYear = serializers.IntegerField(required=False, allow_null=True)
    vehicleColor = serializers.CharField(max_length=100)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    # Datos de pago
    moneda = serializers.CharField(max_length=10)
    monto_inicial = serializers.DecimalField(max_digits=12, decimal_places=2)
    tasa_cambio = serializers.DecimalField(max_digits=10, decimal_places=4, required=False, allow_null=True)
    paymentMethod = serializers.CharField(max_length=50)
    entidad_financiera = serializers.CharField(max_length=100, required=False, allow_blank=True)
    reference_number = serializers.CharField(max_length=100)
    fecha_pago = serializers.DateField()
    numero_cuotas = serializers.IntegerField(required=False, allow_null=True)
    numero_cuenta = serializers.CharField(max_length=50, required=False, allow_blank=True)
    ultimos_digitos_tarjeta = serializers.CharField(max_length=4, required=False, allow_blank=True)
    url_comprobante = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')
    
    # Notas adicionales
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_reference_number(self, value):
        if TransaccionPago.objects.filter(referencia=value).exists():
            raise serializers.ValidationError('Ya existe una transacción con este número de referencia')
        return value
    
    def validate_vehiculo_id(self, value):
        try:
            vehiculo = VehiculoNuevo.objects.get(id=value)
            if vehiculo.estado_id != 1:
                raise serializers.ValidationError('El vehículo seleccionado no está disponible')
        except VehiculoNuevo.DoesNotExist:
            raise serializers.ValidationError('El vehículo seleccionado no existe')
        return value

    @transaction.atomic
    def create(self, validated_data):
        # 1. Crear o actualizar el cliente
        cliente, created = Cliente.objects.get_or_create(
            identificacion=validated_data['identificacion'],
            defaults={
                'nombre_completo': f"{validated_data['first_name']} {validated_data['last_name']}",
                'correo': validated_data['email'],
                'telefono_1': validated_data['phone1'],
                'telefono_2': validated_data.get('phone2', ''),
                'nacionalidad_id': validated_data.get('nacionalidad'),
                'direccion': validated_data['direccion'],
                'estado_id': validated_data.get('estado'),
            }
        )
        
        if not created:
            cliente.nombre_completo = f"{validated_data['first_name']} {validated_data['last_name']}"
            cliente.correo = validated_data['email']
            cliente.telefono_1 = validated_data['phone1']
            cliente.telefono_2 = validated_data.get('phone2', '')
            cliente.nacionalidad_id = validated_data.get('nacionalidad')
            cliente.direccion = validated_data['direccion']
            cliente.estado_id = validated_data.get('estado')
            cliente.save()
        
        # 2. Obtener el vehículo
        vehiculo = VehiculoNuevo.objects.get(id=validated_data['vehiculo_id'])
        
        # 3. Obtener el vendedor del request
        try:
            vendedor = self.context['request'].user.vendedor
        except Exception:
            vendedor = None
        
        # 4. Crear la orden de venta
        orden = OrdenVenta.objects.create(
            codigo_orden=validated_data['reference_number'],
            vehiculo=vehiculo,
            cliente=cliente,
            vendedor=vendedor,
            precio_final_venta=validated_data['price'],
            estado_orden_id=1,
            fecha_creacion=timezone.now()
        )
        
        # 5. Crear la transacción de pago
        monto_total = validated_data['price']
        monto_inicial = validated_data['monto_inicial']
        monto_restante = monto_total - monto_inicial
        
        transaccion = TransaccionPago.objects.create(
            orden_venta=orden,
            monto=monto_total,
            monto_inicial=monto_inicial,
            monto_restante=monto_restante,
            moneda=validated_data['moneda'],
            tasa_cambio=validated_data.get('tasa_cambio'),
            metodo_pago=int(validated_data['paymentMethod']),
            referencia=validated_data['reference_number'],
            fecha_pago=validated_data['fecha_pago'],
            estado_pago=CtEstadoPago.objects.get(id=1),
            entidad_financiera_id=validated_data.get('entidad_financiera'),
        )
        
        # 6. Registrar en el historial de estados
        HistorialEstadosOrden.objects.create(
            orden=orden,
            estado_anterior=None,
            estado_nuevo_id=1,
            fecha_cambio=timezone.now(),
            responsable=vendedor,
        )
        
        # 7. Actualizar estado del vehículo
        vehiculo.estado_id = 2
        vehiculo.save()
        
        return orden


# ============================================================
# SERIALIZER PARA ACTUALIZAR ESTADO DE ORDEN
# ============================================================
class OrdenVentaUpdateSerializer(serializers.Serializer):
    """Actualiza el estado de una orden y registra el cambio en el historial"""
    estado_orden = serializers.IntegerField()

    def validate_estado_orden(self, value):
        from apps.catalogos.models import CtEstadoOrden
        if not CtEstadoOrden.objects.filter(id=value).exists():
            raise serializers.ValidationError('Estado de orden inválido')
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        estado_anterior = instance.estado_orden
        instance.estado_orden_id = validated_data['estado_orden']
        instance.save()

        try:
            vendedor = self.context['request'].user.vendedor
        except Exception:
            vendedor = None

        HistorialEstadosOrden.objects.create(
            orden=instance,
            estado_anterior=estado_anterior,
            estado_nuevo_id=validated_data['estado_orden'],
            responsable=vendedor,
        )
        return instance


# ============================================================
# SERIALIZER PARA LISTA DE ÓRDENES
# ============================================================
class OrdenVentaSerializer(serializers.ModelSerializer):
    """Serializer para listar/detallar órdenes de venta"""
    
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
            'transaccion_info', 'estado_orden'
        ]
    
    def get_vendedor_nombre(self, obj):
        if obj.vendedor and obj.vendedor.user:
            return f"{obj.vendedor.user.first_name} {obj.vendedor.user.last_name}".strip()
        return ''
    
    def get_vehiculo_modelo(self, obj):
        if obj.vehiculo and obj.vehiculo.version:
            version = obj.vehiculo.version
            modelo = version.modelo
            marca = modelo.marca
            return f"{marca.nombre} {modelo.nombre} {version.nombre_version}"
        return ''
    
    def get_transaccion_info(self, obj):
        try:
            transaccion = obj.transacciones_pago.first()
            if transaccion:
                return {
                    'id': transaccion.id,
                    'monto': str(transaccion.monto),
                    'monto_inicial': str(transaccion.monto_inicial),
                    'monto_restante': str(transaccion.monto_restante),
                    'moneda': transaccion.moneda,
                    'metodo_pago': transaccion.metodo_pago,
                    'referencia': transaccion.referencia,
                    'fecha_pago': transaccion.fecha_pago,
                    'estado_pago': transaccion.estado_pago_id,
                }
        except:
            pass
        return None


# ============================================================
# SERIALIZERS PARA DETALLE COMPLETO
# ============================================================
class SeguimientoPagoSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source='estado.estado_pago', read_only=True)
    
    class Meta:
        model = SeguimientoPago
        fields = [
            'id', 'numero_cuota', 'monto_pagado', 'fecha_pago',
            'fecha_vencimiento', 'estado', 'estado_nombre',
            'comprobante_url', 'notas'
        ]


class NotificacionSerializer(serializers.ModelSerializer):
    enviado_por_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificacionCliente
        fields = [
            'id', 'tipo', 'asunto', 'mensaje', 'fecha_envio',
            'enviado_por_nombre', 'estado_envio'
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
            'fecha_subida', 'subido_por_nombre'
        ]
    
    def get_subido_por_nombre(self, obj):
        if obj.subido_por and obj.subido_por.user:
            return f"{obj.subido_por.user.first_name} {obj.subido_por.user.last_name}"
        return ''


class OrdenVentaDetalleSerializer(serializers.ModelSerializer):
    """Serializer detallado con toda la información de la orden"""
    cliente_info = serializers.SerializerMethodField()
    vendedor_info = serializers.SerializerMethodField()
    vehiculo_info = serializers.SerializerMethodField()
    transaccion = serializers.SerializerMethodField()
    pagos_parciales = serializers.SerializerMethodField()
    notificaciones = serializers.SerializerMethodField()
    documentos = serializers.SerializerMethodField()
    historial_estados = serializers.SerializerMethodField()
    
    class Meta:
        model = OrdenVenta
        fields = [
            'id', 'codigo_orden', 'precio_final_venta', 'fecha_creacion',
            'cliente_info', 'vendedor_info', 'vehiculo_info',
            'transaccion', 'pagos_parciales', 'notificaciones',
            'documentos', 'historial_estados', 'estado_orden'
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
        version = obj.vehiculo.version
        info = {
            'id': obj.vehiculo.id,
            'vin': obj.vehiculo.vin,
            'color_exterior': obj.vehiculo.color_exterior,
            'color_interior': obj.vehiculo.color_interior,
            'numero_motor': obj.vehiculo.numero_motor,
            'numero_chasis': obj.vehiculo.numero_chasis,
            'precio_lista': str(obj.vehiculo.precio_lista_sugerido),
            'estado_id': obj.vehiculo.estado_id,
            'ubicacion': obj.vehiculo.ubicacion_fisica.nombre if obj.vehiculo.ubicacion_fisica else None,
        }
        if version:
            info['version'] = {
                'nombre': version.nombre_version or '',
                'motorizacion': version.motorizacion or '',
                'transmision': version.transmision or '',
                'año_modelo': str(version.año_modelo) if version.año_modelo else '',
            }
            if version.modelo:
                info['modelo'] = {
                    'nombre': version.modelo.nombre,
                    'marca': version.modelo.marca.nombre if version.modelo.marca else '',
                }
        return info
    
    def get_transaccion(self, obj):
        transaccion = obj.transacciones_pago.first()
        if not transaccion:
            return None
        return {
            'id': transaccion.id,
            'monto_total': str(transaccion.monto),
            'monto_inicial': str(transaccion.monto_inicial),
            'monto_restante': str(transaccion.monto_restante),
            'moneda': transaccion.moneda or 'USD',
            'tasa_cambio': str(transaccion.tasa_cambio) if transaccion.tasa_cambio else None,
            'metodo_pago_id': transaccion.metodo_pago,
            'metodo_pago_nombre': self._get_metodo_pago_nombre(transaccion.metodo_pago),
            'referencia': transaccion.referencia,
            'fecha_pago': transaccion.fecha_pago,
            'estado_pago_id': transaccion.estado_pago_id,
            'estado_pago_nombre': transaccion.estado_pago.estado_pago if transaccion.estado_pago else 'Pendiente',
            'entidad_financiera_id': transaccion.entidad_financiera_id,
            'entidad_financiera_nombre': transaccion.entidad_financiera.nombre if transaccion.entidad_financiera else None,
            'porcentaje_pagado': self._calcular_porcentaje_pagado(transaccion),
        }
    
    def get_pagos_parciales(self, obj):
        transaccion = obj.transacciones_pago.first()
        if not transaccion:
            return []
        pagos = transaccion.pagos_parciales.all().order_by('numero_cuota')
        return SeguimientoPagoSerializer(pagos, many=True).data
    
    def get_notificaciones(self, obj):
        notificaciones = obj.notificaciones.all().order_by('-fecha_envio')[:10]
        return NotificacionSerializer(notificaciones, many=True).data
    
    def get_documentos(self, obj):
        documentos = obj.documentos.all()
        return DocumentoOrdenSerializer(documentos, many=True).data
    
    def get_historial_estados(self, obj):
        historial = obj.historial_estados.all()
        return [{
            'id': h.id,
            'estado_anterior': h.estado_anterior.estado_orden if h.estado_anterior else 'Creación',
            'estado_nuevo': h.estado_nuevo.estado_orden if h.estado_nuevo else None,
            'fecha_cambio': h.fecha_cambio,
            'responsable': h.responsable.nombre_completo if h.responsable else None,
        } for h in historial]
    
    def _get_metodo_pago_nombre(self, metodo_id):
        metodos = {
            1: 'Efectivo', 2: 'Transferencia Bancaria', 3: 'Financiamiento',
            4: 'Tarjeta de Crédito', 5: 'Tarjeta de Débito',
            6: 'Cheque', 7: 'Criptomoneda', 8: 'Otro',
        }
        return metodos.get(metodo_id, f'Método {metodo_id}')
    
    def _calcular_porcentaje_pagado(self, transaccion):
        if not transaccion.monto or float(transaccion.monto) == 0:
            return 0
        return round((float(transaccion.monto_inicial or 0) / float(transaccion.monto)) * 100, 2)