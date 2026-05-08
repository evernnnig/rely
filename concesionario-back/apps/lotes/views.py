from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone

from .models import CtEstadoLote, LoteImportacion, HistorialEstadosLote, ESTADO_LOTE_A_VEHICULO
from .serializers import (
    CtEstadoLoteSerializer,
    LoteImportacionListSerializer,
    LoteImportacionDetailSerializer,
    LoteImportacionCreateSerializer,
    LoteUpdateEstadoSerializer,
    LoteAddVehiculosSerializer,
)


class CtEstadoLoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        estados = CtEstadoLote.objects.all()
        return Response({'success': True, 'data': CtEstadoLoteSerializer(estados, many=True).data})


class LoteImportacionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = LoteImportacion.objects.select_related(
            'estado_lote', 'sede_destino', 'pais_origen', 'creado_por'
        ).prefetch_related('vehiculos', 'historial_estados')

        # Filtros opcionales
        estado = request.query_params.get('estado')
        sede = request.query_params.get('sede')
        if estado:
            qs = qs.filter(estado_lote__codigo=estado.upper())
        if sede:
            qs = qs.filter(sede_destino_id=sede)

        serializer = LoteImportacionListSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data, 'total': qs.count()})

    def post(self, request):
        serializer = LoteImportacionCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            lote = serializer.save()
            # Registrar estado inicial en historial
            HistorialEstadosLote.objects.create(
                lote=lote,
                estado_anterior=None,
                estado_nuevo=lote.estado_lote,
                responsable=request.user,
                notas='Lote creado.',
            )

        return Response(
            {
                'success': True,
                'data': LoteImportacionDetailSerializer(lote).data,
                'message': f'Lote {lote.codigo_lote} creado con estado PROGRAMADO.',
            },
            status=status.HTTP_201_CREATED,
        )


class LoteImportacionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_lote(self, pk):
        try:
            return LoteImportacion.objects.select_related(
                'estado_lote', 'sede_destino', 'pais_origen', 'creado_por'
            ).prefetch_related(
                'vehiculos', 'historial_estados__estado_anterior',
                'historial_estados__estado_nuevo', 'historial_estados__responsable'
            ).get(pk=pk)
        except LoteImportacion.DoesNotExist:
            return None

    def get(self, request, pk):
        lote = self._get_lote(pk)
        if not lote:
            return Response({'success': False, 'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': LoteImportacionDetailSerializer(lote).data})

    def patch(self, request, pk):
        """Actualiza campos informativos del lote (NO el estado — usa /estado/ para eso)."""
        lote = self._get_lote(pk)
        if not lote:
            return Response({'success': False, 'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = LoteImportacionCreateSerializer(lote, data=request.data, partial=True, context={'request': request})
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        lote = serializer.save()
        return Response({'success': True, 'data': LoteImportacionDetailSerializer(lote).data})


class LoteCambiarEstadoView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            lote = LoteImportacion.objects.select_related(
                'estado_lote', 'sede_destino'
            ).prefetch_related('vehiculos').get(pk=pk)
        except LoteImportacion.DoesNotExist:
            return Response({'success': False, 'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LoteUpdateEstadoSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        nuevo_estado = serializer.validated_data['estado_lote_id']  # CtEstadoLote instance
        estado_anterior = lote.estado_lote

        # Validar que no se retroceda en el flujo
        if nuevo_estado.orden <= estado_anterior.orden:
            return Response({
                'success': False,
                'detail': (
                    f'No se puede retroceder de "{estado_anterior.nombre}" '
                    f'(orden {estado_anterior.orden}) a "{nuevo_estado.nombre}" '
                    f'(orden {nuevo_estado.orden}).'
                ),
            }, status=status.HTTP_400_BAD_REQUEST)

        # Actualizar fechas automáticas según el estado
        if nuevo_estado.codigo == 'EMBARCADO' and not lote.fecha_embarque_real:
            lote.fecha_embarque_real = timezone.now().date()
        elif nuevo_estado.codigo == 'RECIBIDO_SEDE' and not lote.fecha_llegada_real:
            lote.fecha_llegada_real = timezone.now().date()

        lote.estado_lote = nuevo_estado
        lote.save()

        # Registrar en historial
        HistorialEstadosLote.objects.create(
            lote=lote,
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado,
            responsable=request.user,
            notas=serializer.validated_data.get('notas', ''),
            ubicacion=serializer.validated_data.get('ubicacion', ''),
        )

        # Bulk update de vehículos según el nuevo estado del lote
        nuevo_estado_vehiculo_id = ESTADO_LOTE_A_VEHICULO.get(nuevo_estado.codigo)
        vehiculos_actualizados = 0
        if nuevo_estado_vehiculo_id:
            update_fields = {'estado_id': nuevo_estado_vehiculo_id}
            if nuevo_estado.codigo == 'RECIBIDO_SEDE':
                update_fields['sede_actual_id'] = lote.sede_destino_id
                update_fields['fecha_llegada'] = timezone.now()
            vehiculos_actualizados = lote.vehiculos.update(**update_fields)

        lote.refresh_from_db()
        return Response({
            'success': True,
            'data': LoteImportacionDetailSerializer(lote).data,
            'message': (
                f'Lote "{lote.codigo_lote}" avanzó a "{nuevo_estado.nombre}". '
                f'{vehiculos_actualizados} vehículo(s) actualizado(s).'
            ),
        })


class LoteVehiculosView(APIView):
    """Lista los vehículos de un lote y permite agregar nuevos desde un manifiesto."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            lote = LoteImportacion.objects.get(pk=pk)
        except LoteImportacion.DoesNotExist:
            return Response({'success': False, 'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.vehiculos.serializers import VehiculoNuevoSerializer
        vehiculos = lote.vehiculos.select_related('version__modelo__marca', 'estado', 'sede_actual')
        serializer = VehiculoNuevoSerializer(vehiculos, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'total': vehiculos.count(),
            'capacidad': lote.total_unidades,
            'disponibles_slots': lote.total_unidades - vehiculos.count(),
        })

    @transaction.atomic
    def post(self, request, pk):
        """Agrega vehículos al lote (carga de manifiesto)."""
        try:
            lote = LoteImportacion.objects.select_related('estado_lote', 'sede_destino').get(pk=pk)
        except LoteImportacion.DoesNotExist:
            return Response({'success': False, 'detail': 'Lote no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if lote.estado_lote.codigo == 'CERRADO':
            return Response(
                {'success': False, 'detail': 'No se pueden agregar vehículos a un lote cerrado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LoteAddVehiculosSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        vehiculos_data = serializer.validated_data['vehiculos']
        slots_disponibles = lote.total_unidades - lote.vehiculos.count()

        if len(vehiculos_data) > slots_disponibles:
            return Response({
                'success': False,
                'detail': f'El lote solo tiene {slots_disponibles} slot(s) disponible(s).',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Determinar estado inicial del vehículo según estado del lote
        from apps.lotes.models import ESTADO_LOTE_A_VEHICULO
        estado_vehiculo_id = ESTADO_LOTE_A_VEHICULO.get(lote.estado_lote.codigo, 3)  # default: En Tránsito

        from apps.vehiculos.models import VehiculoNuevo
        creados = []
        for v in vehiculos_data:
            vehiculo = VehiculoNuevo.objects.create(
                lote=lote,
                version_id=v['version_id'],
                vin=v['vin'],
                numero_motor=v.get('numero_motor', ''),
                numero_chasis=v.get('numero_chasis', ''),
                color_exterior=v.get('color_exterior', ''),
                color_interior=v.get('color_interior', ''),
                precio_lista_sugerido=v.get('precio_lista_sugerido'),
                estado_id=estado_vehiculo_id,
                sede_actual=lote.sede_destino if lote.estado_lote.codigo == 'RECIBIDO_SEDE' else None,
            )
            creados.append(vehiculo.vin)

        return Response({
            'success': True,
            'message': f'{len(creados)} vehículo(s) agregado(s) al lote {lote.codigo_lote}.',
            'vins_creados': creados,
        }, status=status.HTTP_201_CREATED)
