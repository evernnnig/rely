from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework.decorators import action
from rest_framework.response import Response

class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.select_related('pais_origen').all()
    serializer_class = MarcaSerializer

class ModeloViewSet(viewsets.ModelViewSet):
    queryset = Modelo.objects.select_related('marca', 'tipo').all()
    serializer_class = ModeloSerializer

class VersionTrimViewSet(viewsets.ModelViewSet):
    queryset = VersionTrim.objects.select_related('modelo__marca').all()
    serializer_class = VersionTrimSerializer

class EquipamientoBaseViewSet(viewsets.ModelViewSet):
    queryset = EquipamientoBase.objects.all()
    serializer_class = EquipamientoBaseSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        version_id = self.request.query_params.get('version')
        if version_id:
            queryset = queryset.filter(version_id=version_id)
        return queryset

class VehiculoNuevoViewSet(viewsets.ModelViewSet):
    serializer_class = VehiculoNuevoSerializer
    
    def get_queryset(self):
        """
        Filtra SOLO vehículos DISPONIBLES (estado = 1).
        """
        queryset = VehiculoNuevo.objects.filter(estado=1).select_related(
            'version__modelo__marca',
            'ubicacion_fisica'
        ).prefetch_related('version__equipamiento')
        
        vin = self.request.query_params.get('vin')
        if vin:
            queryset = queryset.filter(vin__icontains=vin)
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='todos')
    def todos(self, request):
        """
        Endpoint para ver TODOS los vehículos (incluyendo reservados, vendidos, etc.)
        Útil para panel de administración.
        GET /api/vehiculos/inventario/todos/
        """
        queryset = VehiculoNuevo.objects.select_related(
            'version__modelo__marca',
            'ubicacion_fisica'
        ).prefetch_related('version__equipamiento').all()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='por-estado')
    def por_estado(self, request):
        """
        Filtrar vehículos por estado.
        GET /api/vehiculos/inventario/por-estado/?estado=2
        """
        estado = request.query_params.get('estado', 1)
        queryset = VehiculoNuevo.objects.filter(estado=estado).select_related(
            'version__modelo__marca',
            'ubicacion_fisica'
        ).prefetch_related('version__equipamiento')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='disponibles')
    def disponibles(self, request):
        """
        Solo vehículos disponibles (mismo que el default).
        GET /api/vehiculos/inventario/disponibles/
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)