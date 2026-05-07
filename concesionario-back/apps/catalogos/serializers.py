from rest_framework import serializers
from .models import *

class CtPaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtPais
        fields = ['id', 'codigo_iso', 'nombre', 'continente']

class CtTipoModeloSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtTipoModelo
        fields = ['id', 'tipo']

class CtEstadoVehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtEstadoVehiculo
        fields = ['id', 'estado']

class CtEstadoVenezuelaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtEstadoVenezuela
        fields = ['id', 'nombre']

class CtEntidadFinancieraSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtEntidadFinanciera
        fields = ['id', 'nombre', 'codigo_identificador']

class CtEstadoOrdenSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtEstadoOrden
        fields = ['id', 'estado_orden']
    
class CtEstadoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtEstadoPago
        fields = ['id', 'estado_pago']
    
class CtMetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtMetodoPago
        fields = ['id', 'nombre', 'descripcion', 'activo']