from rest_framework import serializers
from .models import Cliente
from apps.catalogos.serializers import *

class ClienteSerializer(serializers.ModelSerializer):
    estado_detalle = CtEstadoVenezuelaSerializer(source='estado_residencia', read_only=True)
    nacionalidad_detalle = CtPaisSerializer(source='nacionalidad', read_only=True)

    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre_completo', 'nacionalidad', 'nacionalidad_detalle', 'identificacion', 
            'correo', 'telefono_1', 'telefono_2', 'direccion', 
            'estado_residencia', 'estado_detalle',
        ]