from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings as django_settings

from apps.catalogos.models import CtEstadoOrden
from apps.clientes.models import Cliente
from apps.vehiculos.models import VehiculoNuevo
from apps.users.permissions import IsAdminOrVendedor, IsAdminOrGerente
from .models import OrdenVenta, NotificacionCliente, SeguimientoPago, DocumentoOrden, Reserva
from .serializers import (
    OrdenVentaCreateSerializer,
    OrdenVentaSerializer,
    OrdenVentaUpdateSerializer,
    OrdenVentaDetalleSerializer,
    NotificacionSerializer,
    SeguimientoPagoSerializer,
    DocumentoOrdenSerializer,
    ReservaSerializer,
    CreateReservaSerializer,
)
from . import services


# ─────────────────────────────────────────────────────────────────────────────
# ÓRDENES DE VENTA
# ─────────────────────────────────────────────────────────────────────────────

class OrdenVentaListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsAdminOrGerente()]
        return [IsAuthenticated(), IsAdminOrVendedor()]

    def get(self, request):
        ordenes = OrdenVenta.objects.select_related(
            'cliente', 'vendedor', 'vehiculo__version__modelo__marca'
        ).prefetch_related('transacciones_pago').all()
        serializer = OrdenVentaSerializer(ordenes, many=True)
        return Response({'success': True, 'data': serializer.data, 'total': ordenes.count()})

    @transaction.atomic
    def post(self, request):
        serializer = OrdenVentaCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(
                {'success': False, 'errors': serializer.errors,
                 'detail': 'Error de validación en los datos enviados'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            orden = serializer.save()
            return Response(
                {'success': True, 'data': OrdenVentaSerializer(orden).data,
                 'message': f'Orden #{orden.codigo_orden} creada exitosamente'},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {'success': False, 'detail': f'Error al crear la orden: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrdenVentaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_orden(self, pk):
        try:
            return OrdenVenta.objects.select_related(
                'cliente', 'vendedor__user', 'vehiculo__version__modelo__marca'
            ).prefetch_related('transacciones_pago').get(pk=pk)
        except OrdenVenta.DoesNotExist:
            return None

    def get(self, request, pk):
        orden = self._get_orden(pk)
        if not orden:
            return Response({'success': False, 'detail': 'Orden no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': OrdenVentaSerializer(orden).data})

    @transaction.atomic
    def patch(self, request, pk):
        orden = self._get_orden(pk)
        if not orden:
            return Response({'success': False, 'detail': 'Orden no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        serializer = OrdenVentaUpdateSerializer(orden, data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        orden_actualizada = serializer.save()
        return Response({
            'success': True,
            'data': OrdenVentaSerializer(orden_actualizada).data,
            'message': f'Orden #{orden_actualizada.codigo_orden} actualizada exitosamente',
        })


class OrdenVentaDetalleCompletoView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    def get(self, request, pk):
        try:
            orden = OrdenVenta.objects.select_related(
                'cliente', 'vendedor__user',
                'vehiculo__version__modelo__marca',
                'vehiculo__ubicacion_fisica',
                'vehiculo__lote',
            ).prefetch_related(
                'transacciones_pago__entidad_financiera',
                'transacciones_pago__estado_pago',
                'transacciones_pago__pagos_parciales__estado',
                'notificaciones__enviado_por__user',
                'documentos__subido_por__user',
                'historial_estados__estado_anterior',
                'historial_estados__estado_nuevo',
                'historial_estados__responsable__user',
            ).get(pk=pk)
        except OrdenVenta.DoesNotExist:
            return Response({'success': False, 'detail': 'Orden no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': OrdenVentaDetalleSerializer(orden).data})


# ─────────────────────────────────────────────────────────────────────────────
# RESERVAS
# ─────────────────────────────────────────────────────────────────────────────

class ReservaListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    def get(self, request):
        services.expirar_reservas_vencidas_publico()
        qs = Reserva.objects.select_related(
            'vehiculo__version__modelo__marca', 'cliente', 'vendedor__user', 'orden'
        ).all()
        estado = request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado)
        return Response({'success': True, 'data': ReservaSerializer(qs, many=True).data})

    def post(self, request):
        serializer = CreateReservaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            vendedor = request.user.vendedor
        except Exception:
            vendedor = None

        cliente = None
        cliente_id = serializer.validated_data.get('cliente_id')
        if cliente_id:
            cliente = Cliente.objects.get(id=cliente_id)
        else:
            nombre = serializer.validated_data.get('cliente_nombre', '').strip()
            apellido = serializer.validated_data.get('cliente_apellido', '').strip()
            identificacion = serializer.validated_data.get('cliente_identificacion', '').strip()
            telefono = serializer.validated_data.get('cliente_telefono', '').strip()
            nombre_completo = f"{nombre} {apellido}".strip()
            cliente, _ = Cliente.objects.update_or_create(
                identificacion=identificacion,
                defaults={
                    'nombre_completo': nombre_completo,
                    'telefono_1': telefono or None,
                }
            )

        try:
            reserva = services.crear_reserva(
                vehiculo_id=serializer.validated_data['vehiculo_id'],
                vendedor=vendedor,
                cliente=cliente,
                monto_separacion=serializer.validated_data.get('monto_separacion'),
                notas=serializer.validated_data.get('notas', ''),
                dias=serializer.validated_data.get('dias', 7),
            )
        except services.VehiculoNoDisponible as e:
            return Response({'success': False, 'detail': str(e)},
                            status=status.HTTP_409_CONFLICT)

        dias = serializer.validated_data.get('dias', 7)
        return Response(
            {'success': True, 'data': ReservaSerializer(reserva).data,
             'message': f'Vehículo reservado por {dias} día(s).'},
            status=status.HTTP_201_CREATED,
        )


class ReservaDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    def _get_reserva(self, pk):
        try:
            return Reserva.objects.select_related(
                'vehiculo__version__modelo__marca', 'cliente', 'vendedor__user', 'orden'
            ).get(pk=pk)
        except Reserva.DoesNotExist:
            return None

    def get(self, request, pk):
        reserva = self._get_reserva(pk)
        if not reserva:
            return Response({'success': False, 'detail': 'Reserva no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': ReservaSerializer(reserva).data})

    def delete(self, request, pk):
        if not self._get_reserva(pk):
            return Response({'success': False, 'detail': 'Reserva no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        try:
            services.cancelar_reserva(pk)
        except services.ReservaInvalida as e:
            return Response({'success': False, 'detail': str(e)},
                            status=status.HTTP_400_BAD_REQUEST)
        return Response({'success': True,
                         'message': 'Reserva cancelada. Vehículo disponible nuevamente.'})


class ConvertirReservaView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    def post(self, request, pk):
        try:
            Reserva.objects.get(pk=pk)
        except Reserva.DoesNotExist:
            return Response({'success': False, 'detail': 'Reserva no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)

        venta_serializer = OrdenVentaCreateSerializer(
            data=request.data, context={'request': request}
        )
        if not venta_serializer.is_valid():
            return Response({'success': False, 'errors': venta_serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            vendedor = request.user.vendedor
        except Exception:
            vendedor = None

        validated = venta_serializer.validated_data
        cliente_data = {k: validated.get(k, '') for k in [
            'first_name', 'last_name', 'email', 'phone1', 'phone2',
            'identificacion', 'nacionalidad', 'direccion', 'estado',
        ]}
        pago_data = {k: validated.get(k) for k in [
            'price', 'moneda', 'monto_inicial', 'tasa_cambio', 'paymentMethod',
            'entidad_financiera', 'reference_number', 'fecha_pago', 'numero_cuotas',
        ]}

        try:
            orden = services.convertir_reserva_a_venta(
                reserva_id=pk,
                cliente_data=cliente_data,
                pago_data=pago_data,
                vendedor=vendedor,
            )
        except (services.ReservaInvalida, services.VehiculoNoDisponible) as e:
            return Response({'success': False, 'detail': str(e)},
                            status=status.HTTP_409_CONFLICT)

        return Response(
            {'success': True, 'data': OrdenVentaSerializer(orden).data,
             'message': f'Reserva convertida. Orden #{orden.codigo_orden} creada.'},
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICACIONES, PAGOS, DOCUMENTOS
# ─────────────────────────────────────────────────────────────────────────────

class EnviarNotificacionClienteView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    @transaction.atomic
    def post(self, request, pk):
        try:
            orden = OrdenVenta.objects.select_related('cliente').get(pk=pk)
        except OrdenVenta.DoesNotExist:
            return Response({'success': False, 'detail': 'Orden no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        asunto = request.data.get('asunto', '')
        mensaje = request.data.get('mensaje', '')
        if not asunto or not mensaje:
            return Response({'success': False, 'detail': 'Asunto y mensaje son requeridos'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            vendedor = request.user.vendedor
        except Exception:
            vendedor = None
        estado_envio = 'enviado'
        if request.data.get('tipo', 'email') == 'email' and orden.cliente and orden.cliente.email:
            try:
                send_mail(
                    subject=asunto,
                    message=mensaje,
                    from_email=django_settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[orden.cliente.email],
                    fail_silently=False,
                )
            except Exception:
                estado_envio = 'fallido'
        notificacion = NotificacionCliente.objects.create(
            orden=orden, tipo=request.data.get('tipo', 'email'),
            asunto=asunto, mensaje=mensaje,
            enviado_por=vendedor, estado_envio=estado_envio,
        )
        return Response({'success': True, 'data': NotificacionSerializer(notificacion).data,
                         'message': 'Notificación enviada exitosamente'})


class RegistrarPagoParcialView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    @transaction.atomic
    def post(self, request, pk):
        try:
            orden = OrdenVenta.objects.get(pk=pk)
        except OrdenVenta.DoesNotExist:
            return Response({'success': False, 'detail': 'Orden no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        transaccion = orden.transacciones_pago.first()
        if not transaccion:
            return Response({'success': False, 'detail': 'No hay transacción asociada'},
                            status=status.HTTP_400_BAD_REQUEST)
        numero_cuota = request.data.get('numero_cuota')
        monto_pagado = request.data.get('monto_pagado')
        if not numero_cuota or not monto_pagado:
            return Response({'success': False,
                             'detail': 'Número de cuota y monto son requeridos'},
                            status=status.HTTP_400_BAD_REQUEST)
        pago = SeguimientoPago.objects.create(
            transaccion=transaccion, numero_cuota=numero_cuota, monto_pagado=monto_pagado,
            fecha_pago=request.data.get('fecha_pago', timezone.now().date()),
            fecha_vencimiento=request.data.get('fecha_vencimiento'),
            estado_id=2,
            comprobante_url=request.data.get('comprobante_url', ''),
            notas=request.data.get('notas', ''),
        )
        total_pagado = float(transaccion.monto_inicial or 0) + sum(
            float(p.monto_pagado or 0) for p in transaccion.pagos_parciales.filter(estado_id__in=[2, 3])
        )
        transaccion.monto_restante = max(0, float(transaccion.monto) - total_pagado)
        if transaccion.monto_restante <= 0:
            transaccion.monto_restante = 0
            transaccion.estado_pago_id = 2
        transaccion.save()
        return Response({'success': True, 'data': SeguimientoPagoSerializer(pago).data,
                         'message': f'Cuota #{numero_cuota} registrada exitosamente'})


class SubirDocumentoOrdenView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    @transaction.atomic
    def post(self, request, pk):
        try:
            orden = OrdenVenta.objects.get(pk=pk)
        except OrdenVenta.DoesNotExist:
            return Response({'success': False, 'detail': 'Orden no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        tipo = request.data.get('tipo_documento')
        nombre = request.data.get('nombre')
        url = request.data.get('url_archivo')
        if not tipo or not nombre or not url:
            return Response({'success': False,
                             'detail': 'Tipo, nombre y URL del documento son requeridos'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            vendedor = request.user.vendedor
        except Exception:
            vendedor = None
        documento = DocumentoOrden.objects.create(
            orden=orden, tipo_documento=tipo, nombre=nombre,
            url_archivo=url, subido_por=vendedor,
        )
        return Response({'success': True, 'data': DocumentoOrdenSerializer(documento).data,
                         'message': 'Documento subido exitosamente'})


class ActualizarEstadoPagoView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    @transaction.atomic
    def patch(self, request, orden_id):
        try:
            orden = OrdenVenta.objects.get(pk=orden_id)
        except OrdenVenta.DoesNotExist:
            return Response({'success': False, 'detail': 'Orden no encontrada'},
                            status=status.HTTP_404_NOT_FOUND)
        transaccion = orden.transacciones_pago.first()
        if not transaccion:
            return Response({'success': False, 'detail': 'No hay transacción asociada'},
                            status=status.HTTP_400_BAD_REQUEST)
        nuevo = request.data.get('estado_pago_id')
        if not nuevo:
            return Response({'success': False, 'detail': 'Estado de pago requerido'},
                            status=status.HTTP_400_BAD_REQUEST)
        transaccion.estado_pago_id = nuevo
        transaccion.save()
        return Response({'success': True, 'message': 'Estado de pago actualizado exitosamente'})


class ActualizarEstadoPagoIndividualView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]

    @transaction.atomic
    def patch(self, request, pago_id):
        try:
            pago = SeguimientoPago.objects.select_related('transaccion').get(pk=pago_id)
        except SeguimientoPago.DoesNotExist:
            return Response({'success': False, 'detail': 'Pago no encontrado'},
                            status=status.HTTP_404_NOT_FOUND)
        nuevo = request.data.get('estado_id')
        if not nuevo:
            return Response({'success': False, 'detail': 'Estado requerido'},
                            status=status.HTTP_400_BAD_REQUEST)
        pago.estado_id = nuevo
        pago.save()
        t = pago.transaccion
        total = float(t.monto_inicial or 0)
        for p in t.pagos_parciales.filter(estado_id__in=[2, 3]):
            total += float(p.monto_pagado or 0)
        t.monto_restante = float(t.monto) - total
        if t.monto_restante <= 0:
            t.monto_restante = 0
            t.estado_pago_id = 2
        t.save()
        return Response({'success': True, 'data': SeguimientoPagoSerializer(pago).data,
                         'message': 'Estado actualizado exitosamente'})


class EstadoOrdenListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        estados = CtEstadoOrden.objects.all()
        return Response({
            'success': True,
            'data': [{'id': e.id, 'nombre': e.estado_orden} for e in estados],
        })
