from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import Sede
from .serializers import SedeSerializer, SedeCreateSerializer


class SedeListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        solo_activas = request.query_params.get('activas', None)
        qs = Sede.objects.select_related('estado_venezuela', 'encargado').prefetch_related('vehiculos')
        if solo_activas == '1':
            qs = qs.filter(activa=True)
        serializer = SedeSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data, 'total': qs.count()})

    def post(self, request):
        serializer = SedeCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        sede = serializer.save()
        return Response(
            {'success': True, 'data': SedeSerializer(sede).data, 'message': f'Sede {sede.codigo_sede} creada.'},
            status=status.HTTP_201_CREATED,
        )


class SedeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Sede.objects.select_related('estado_venezuela', 'encargado').prefetch_related('vehiculos').get(pk=pk)
        except Sede.DoesNotExist:
            return None

    def get(self, request, pk):
        sede = self._get(pk)
        if not sede:
            return Response({'success': False, 'detail': 'Sede no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': SedeSerializer(sede).data})

    def patch(self, request, pk):
        sede = self._get(pk)
        if not sede:
            return Response({'success': False, 'detail': 'Sede no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SedeCreateSerializer(sede, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        sede = serializer.save()
        return Response({'success': True, 'data': SedeSerializer(sede).data})

    def delete(self, request, pk):
        sede = self._get(pk)
        if not sede:
            return Response({'success': False, 'detail': 'Sede no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        if sede.vehiculos.exists():
            return Response(
                {'success': False, 'detail': 'No se puede eliminar una sede con vehículos asignados.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sede.delete()
        return Response({'success': True, 'message': 'Sede eliminada.'})
