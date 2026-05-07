from rest_framework import viewsets
from .models import *
from .serializers import *

class PaisViewSet(viewsets.ModelViewSet):
    queryset = CtPais.objects.all()
    serializer_class = CtPaisSerializer

class TipoModeloViewSet(viewsets.ModelViewSet):
    queryset = CtTipoModelo.objects.all()
    serializer_class = CtTipoModeloSerializer

class EstadoVehiculoViewSet(viewsets.ModelViewSet):
    queryset = CtEstadoVehiculo.objects.all()
    serializer_class = CtEstadoVehiculoSerializer

class EstadoVenezuelaViewSet(viewsets.ModelViewSet):
    queryset = CtEstadoVenezuela.objects.all()
    serializer_class = CtEstadoVenezuelaSerializer
    
class EntidadFinancieraViewSet(viewsets.ModelViewSet):
    queryset = CtEntidadFinanciera.objects.all()
    serializer_class = CtEntidadFinancieraSerializer
    
class EstadoOrdenViewSet(viewsets.ModelViewSet):
    queryset = CtEstadoOrden.objects.all()
    serializer_class = CtEstadoOrdenSerializer

class EstadoPagoViewSet(viewsets.ModelViewSet):
    queryset = CtEstadoPago.objects.all()
    serializer_class = CtEstadoPagoSerializer

class MetodoPagoViewSet(viewsets.ModelViewSet):
    queryset = CtMetodoPago.objects.all()
    serializer_class = CtMetodoPagoSerializer