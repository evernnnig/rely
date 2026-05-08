from rest_framework import serializers
from .models import Sede


class SedeSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source='estado_venezuela.nombre', read_only=True)
    encargado_nombre = serializers.SerializerMethodField()
    total_vehiculos = serializers.SerializerMethodField()

    class Meta:
        model = Sede
        fields = [
            'id', 'codigo_sede', 'nombre', 'ciudad',
            'estado_venezuela', 'estado_nombre',
            'direccion', 'telefono', 'email',
            'encargado', 'encargado_nombre',
            'activa', 'fecha_creacion', 'total_vehiculos',
        ]

    def get_encargado_nombre(self, obj):
        if obj.encargado:
            return f"{obj.encargado.first_name} {obj.encargado.last_name}".strip() or obj.encargado.username
        return None

    def get_total_vehiculos(self, obj):
        return obj.vehiculos.count()


class SedeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sede
        fields = [
            'codigo_sede', 'nombre', 'ciudad', 'estado_venezuela',
            'direccion', 'telefono', 'email', 'encargado', 'activa',
        ]

    def validate_codigo_sede(self, value):
        if Sede.objects.filter(codigo_sede=value.upper()).exists():
            raise serializers.ValidationError('Ya existe una sede con este código.')
        return value.upper()
