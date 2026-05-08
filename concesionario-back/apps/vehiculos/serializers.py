from apps.catalogos.serializers import *
from rest_framework import serializers
from .models import Marca, Modelo, VersionTrim, VehiculoNuevo, EquipamientoBase

# 1. Serializer para Marca
class MarcaSerializer(serializers.ModelSerializer):
    nombre_pais = CtPaisSerializer(source='pais_origen', read_only=True)

    class Meta:
        model = Marca
        fields = ['id', 'nombre', 'pais_origen', 'nombre_pais']

# 2. Serializer para Modelo
class ModeloSerializer(serializers.ModelSerializer):
    marca_detalle = MarcaSerializer(source='marca', read_only=True)
    nombre_tipo = serializers.ReadOnlyField(source='tipo.tipo')

    class Meta:
        model = Modelo
        fields = ['id', 'marca', 'marca_detalle', 'nombre', 'tipo', 'nombre_tipo']

# 3. Serializer para Equipamiento Base
class EquipamientoBaseSerializer(serializers.ModelSerializer):
    version = serializers.PrimaryKeyRelatedField(
        queryset=VersionTrim.objects.all()
    )
    
    class Meta:
        model = EquipamientoBase
        fields = ['id', 'version', 'descripcion', 'nombre_caracteristica']

# 4. Serializer para Versión
class VersionTrimSerializer(serializers.ModelSerializer):
    modelo_detalle = ModeloSerializer(source='modelo', read_only=True)
    equipamiento = EquipamientoBaseSerializer(many=True, read_only=True)

    class Meta:
        model = VersionTrim
        fields = ['id', 'modelo', 'modelo_detalle', 'nombre_version', 'transmision', 'motorizacion', 'año_modelo', 'equipamiento']

# 5. Serializer para VehiculoNuevo
class VehiculoNuevoSerializer(serializers.ModelSerializer):
    version = VersionTrimSerializer(read_only=True)
    version_id = serializers.PrimaryKeyRelatedField(
        queryset=VersionTrim.objects.all(), 
        source='version', 
        write_only=True
    )
    nombre_estado = serializers.ReadOnlyField(source='estado.estado')
    ubicacion_detalle = CtEstadoVenezuelaSerializer(source='ubicacion_fisica', read_only=True)
    estado_comercial_label = serializers.CharField(source='get_estado_comercial_display', read_only=True)
    equipamiento = EquipamientoBaseSerializer(many=True, read_only=True)
    lote_codigo = serializers.SerializerMethodField()
    fecha_llegada_estimada = serializers.SerializerMethodField()
    estado_lote_nombre = serializers.SerializerMethodField()

    def get_lote_codigo(self, obj):
        return obj.lote.codigo_lote if obj.lote else None

    def get_fecha_llegada_estimada(self, obj):
        if obj.lote and obj.lote.fecha_llegada_estimada:
            return str(obj.lote.fecha_llegada_estimada)
        return None

    def get_estado_lote_nombre(self, obj):
        if obj.lote and obj.lote.estado_lote:
            return obj.lote.estado_lote.nombre
        return None

    class Meta:
        model = VehiculoNuevo
        fields = [
            'id', 'version', 'version_id', 'vin', 'numero_motor',
            'numero_chasis', 'color_exterior', 'color_interior',
            'fecha_llegada', 'ubicacion_fisica', 'ubicacion_detalle', 'precio_lista_sugerido',
            'estado', 'nombre_estado', 'estado_comercial', 'estado_comercial_label',
            'equipamiento', 'lote_codigo', 'fecha_llegada_estimada', 'estado_lote_nombre',
        ]