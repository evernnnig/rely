# apps/ventas/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone

from apps.catalogos.models import CtEstadoOrden
from apps.catalogos.models import CtEstadoOrden
from apps.users.permissions import IsAdminOrVendedor, IsAdminOrGerente
from .models import OrdenVenta, NotificacionCliente, SeguimientoPago, DocumentoOrden
from .serializers import (
    OrdenVentaCreateSerializer, 
    OrdenVentaSerializer, 
    OrdenVentaUpdateSerializer,
    OrdenVentaDetalleSerializer,
    NotificacionSerializer,
    SeguimientoPagoSerializer,
    DocumentoOrdenSerializer,
)


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
        return Response({
            'success': True,
            'data': serializer.data,
            'total': ordenes.count()
        })

    @transaction.atomic
    def post(self, request):
        print("=" * 50)
        print("Datos recibidos del frontend:")
        print(request.data)
        print("=" * 50)
        
        serializer = OrdenVentaCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            print("Errores de validación:")
            print(serializer.errors)
            return Response({
                'success': False,
                'errors': serializer.errors,
                'detail': 'Error de validación en los datos enviados'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            orden = serializer.save()
            orden_serializer = OrdenVentaSerializer(orden)
            
            return Response({
                'success': True,
                'data': orden_serializer.data,
                'message': f'Orden #{orden.codigo_orden} creada exitosamente'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error al crear la orden: {str(e)}")
            return Response({
                'success': False,
                'detail': f'Error al crear la orden: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            return Response({'success': False, 'detail': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': OrdenVentaSerializer(orden).data})

    @transaction.atomic
    def patch(self, request, pk):
        orden = self._get_orden(pk)
        if not orden:
            return Response({'success': False, 'detail': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Guarda el estado anterior antes de la validación
        estado_anterior = orden.estado_orden

        serializer = OrdenVentaUpdateSerializer(orden, data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Guarda la orden con el nuevo estado
        orden_actualizada = serializer.save()

        # 3. Registro de historial y cambio de estado de vehículo
        # La lógica principal está en el serializer, aquí solo es una confirmación.
        
        return Response({
            'success': True,
            'data': OrdenVentaSerializer(orden_actualizada).data,
            'message': f'Orden #{orden_actualizada.codigo_orden} actualizada exitosamente'
        })


class OrdenVentaDetalleCompletoView(APIView):
    """Vista detallada completa de una orden con toda la información"""
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]
    
    def get(self, request, pk):
        try:
            orden = OrdenVenta.objects.select_related(
                'cliente', 
                'vendedor__user', 
                'vehiculo__version__modelo__marca',
                'vehiculo__ubicacion_fisica'  # ← CORREGIDO: ubicacion_fisica
            ).prefetch_related(
                'transacciones_pago__entidad_financiera',
                'transacciones_pago__estado_pago',
                'transacciones_pago__pagos_parciales__estado',
                'notificaciones__enviado_por__user',
                'documentos__subido_por__user',
                'historial_estados__estado_anterior',
                'historial_estados__estado_nuevo',
                'historial_estados__responsable__user'
            ).get(pk=pk)
            
            serializer = OrdenVentaDetalleSerializer(orden)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except OrdenVenta.DoesNotExist:
            return Response({
                'success': False,
                'detail': 'Orden no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)


class EnviarNotificacionClienteView(APIView):
    """Envía una notificación al cliente de la orden"""
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]
    
    @transaction.atomic
    def post(self, request, pk):
        try:
            orden = OrdenVenta.objects.select_related('cliente').get(pk=pk)
        except OrdenVenta.DoesNotExist:
            return Response({'success': False, 'detail': 'Orden no encontrada'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        tipo = request.data.get('tipo', 'email')
        asunto = request.data.get('asunto', '')
        mensaje = request.data.get('mensaje', '')
        
        if not asunto or not mensaje:
            return Response({
                'success': False,
                'detail': 'Asunto y mensaje son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            vendedor = request.user.vendedor
        except:
            vendedor = None
        
        notificacion = NotificacionCliente.objects.create(
            orden=orden,
            tipo=tipo,
            asunto=asunto,
            mensaje=mensaje,
            enviado_por=vendedor,
            estado_envio='enviado'
        )
        
        return Response({
            'success': True,
            'data': NotificacionSerializer(notificacion).data,
            'message': 'Notificación enviada exitosamente'
        })


class RegistrarPagoParcialView(APIView):
    """Registra un pago parcial/cuota"""
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
        fecha_pago = request.data.get('fecha_pago', timezone.now().date())
        comprobante_url = request.data.get('comprobante_url', '')
        notas = request.data.get('notas', '')
        
        if not numero_cuota or not monto_pagado:
            return Response({
                'success': False,
                'detail': 'Número de cuota y monto son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar el estado "Pagado" (id=2) o "Pendiente" (id=1)
        # Ajusta según tu catálogo: 1=Pendiente, 2=Pagado, 3=Verificado, etc.
        estado_pagado_id = 2  # ID de "Pagado" en tu tabla ct_estado_pago
        
        pago = SeguimientoPago.objects.create(
            transaccion=transaccion,
            numero_cuota=numero_cuota,
            monto_pagado=monto_pagado,
            fecha_pago=fecha_pago,
            fecha_vencimiento=request.data.get('fecha_vencimiento'),
            estado_id=estado_pagado_id,  # ← Usar estado "Pagado"
            comprobante_url=comprobante_url,
            notas=notas
        )
        
        # Actualizar monto restante
        total_pagado = sum(
            float(p.monto_pagado) for p in transaccion.pagos_parciales.all()
        )
        transaccion.monto_restante = float(transaccion.monto) - total_pagado
        
        # Si ya no hay saldo restante, actualizar estado de pago a "Pagado"
        if transaccion.monto_restante <= 0:
            transaccion.monto_restante = 0
            transaccion.estado_pago_id = 2  # Estado "Pagado"
        
        transaccion.save()
        
        return Response({
            'success': True,
            'data': SeguimientoPagoSerializer(pago).data,
            'message': f'Cuota #{numero_cuota} registrada exitosamente'
        })

class SubirDocumentoOrdenView(APIView):
    """Sube un documento a la orden"""
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]
    
    @transaction.atomic
    def post(self, request, pk):
        try:
            orden = OrdenVenta.objects.get(pk=pk)
        except OrdenVenta.DoesNotExist:
            return Response({'success': False, 'detail': 'Orden no encontrada'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        tipo_documento = request.data.get('tipo_documento')
        nombre = request.data.get('nombre')
        url_archivo = request.data.get('url_archivo')
        
        if not tipo_documento or not nombre or not url_archivo:
            return Response({
                'success': False,
                'detail': 'Tipo, nombre y URL del documento son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            vendedor = request.user.vendedor
        except:
            vendedor = None
        
        documento = DocumentoOrden.objects.create(
            orden=orden,
            tipo_documento=tipo_documento,
            nombre=nombre,
            url_archivo=url_archivo,
            subido_por=vendedor
        )
        
        return Response({
            'success': True,
            'data': DocumentoOrdenSerializer(documento).data,
            'message': 'Documento subido exitosamente'
        })


class ActualizarEstadoPagoView(APIView):
    """Actualiza el estado de pago de una transacción"""
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
        
        nuevo_estado_id = request.data.get('estado_pago_id')
        if not nuevo_estado_id:
            return Response({'success': False, 'detail': 'Estado de pago requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        transaccion.estado_pago_id = nuevo_estado_id
        transaccion.save()
        
        return Response({
            'success': True,
            'message': 'Estado de pago actualizado exitosamente'
        })

class ActualizarEstadoPagoIndividualView(APIView):
    """Actualiza el estado de un pago parcial individual"""
    permission_classes = [IsAuthenticated, IsAdminOrVendedor]
    
    @transaction.atomic
    def patch(self, request, pago_id):
        try:
            pago = SeguimientoPago.objects.select_related('transaccion').get(pk=pago_id)
        except SeguimientoPago.DoesNotExist:
            return Response({'success': False, 'detail': 'Pago no encontrado'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        nuevo_estado_id = request.data.get('estado_id')
        if not nuevo_estado_id:
            return Response({'success': False, 'detail': 'Estado requerido'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        pago.estado_id = nuevo_estado_id
        pago.save()
        
        # Recalcular monto restante de la transacción
        transaccion = pago.transaccion
        total_pagado = float(transaccion.monto_inicial or 0)
        for p in transaccion.pagos_parciales.filter(estado_id__in=[2, 3]):  # Solo pagados/verificados
            total_pagado += float(p.monto_pagado or 0)
        
        transaccion.monto_restante = float(transaccion.monto) - total_pagado
        if transaccion.monto_restante <= 0:
            transaccion.monto_restante = 0
            transaccion.estado_pago_id = 2  # Pagado
        
        transaccion.save()
        
        return Response({
            'success': True,
            'data': SeguimientoPagoSerializer(pago).data,
            'message': 'Estado actualizado exitosamente'
        })
    
class EstadoOrdenListView(APIView):
    """
    Endpoint de solo lectura para obtener los posibles estados de una orden.
    No requiere permisos estrictos, pero puedes ajustarlo.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        estados = CtEstadoOrden.objects.all()
        data = [{'id': estado.id, 'nombre': estado.estado_orden} for estado in estados]
        return Response({
            'success': True,
            'data': data
        })