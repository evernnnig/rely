from rest_framework import serializers
from .models import CtEstadoLote, LoteImportacion, HistorialEstadosLote


class VehiculoEnLoteSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    vin = serializers.CharField()
    numero_motor = serializers.CharField()
    numero_chasis = serializers.CharField()
    color_exterior = serializers.CharField()
    color_interior = serializers.CharField()
    precio_lista_sugerido = serializers.DecimalField(max_digits=15, decimal_places=2, allow_null=True)
    nombre_estado = serializers.SerializerMethodField()
    marca = serializers.SerializerMethodField()
    modelo = serializers.SerializerMethodField()
    version = serializers.SerializerMethodField()

    def get_nombre_estado(self, obj):
        return obj.estado.estado if obj.estado else None

    def get_marca(self, obj):
        try: return obj.version.modelo.marca.nombre
        except: return None

    def get_modelo(self, obj):
        try: return obj.version.modelo.nombre
        except: return None

    def get_version(self, obj):
        try: return obj.version.nombre_version
        except: return None


class CtEstadoLoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CtEstadoLote
        fields = ['id', 'codigo', 'nombre', 'descripcion', 'orden', 'color_hex']


class HistorialEstadosLoteSerializer(serializers.ModelSerializer):
    estado_anterior_nombre = serializers.CharField(source='estado_anterior.nombre', read_only=True)
    estado_nuevo_nombre = serializers.CharField(source='estado_nuevo.nombre', read_only=True)
    estado_nuevo_color = serializers.CharField(source='estado_nuevo.color_hex', read_only=True)
    responsable_nombre = serializers.SerializerMethodField()

    class Meta:
        model = HistorialEstadosLote
        fields = [
            'id', 'estado_anterior_nombre', 'estado_nuevo_nombre', 'estado_nuevo_color',
            'fecha_cambio', 'responsable_nombre', 'ubicacion', 'notas',
        ]

    def get_responsable_nombre(self, obj):
        if obj.responsable:
            return f"{obj.responsable.first_name} {obj.responsable.last_name}".strip() or obj.responsable.username
        return None


class LoteImportacionListSerializer(serializers.ModelSerializer):
    estado_lote_nombre = serializers.CharField(source='estado_lote.nombre', read_only=True)
    estado_lote_color = serializers.CharField(source='estado_lote.color_hex', read_only=True)
    sede_destino_nombre = serializers.CharField(source='sede_destino.nombre', read_only=True)
    pais_origen_nombre = serializers.CharField(source='pais_origen.nombre', read_only=True)
    unidades_registradas = serializers.ReadOnlyField()
    unidades_disponibles = serializers.ReadOnlyField()
    eta_dias = serializers.ReadOnlyField()
    dias_en_transito = serializers.ReadOnlyField()

    class Meta:
        model = LoteImportacion
        fields = [
            'id', 'codigo_lote', 'proveedor',
            'pais_origen_nombre', 'puerto_origen', 'puerto_destino',
            'sede_destino_nombre',
            'estado_lote', 'estado_lote_nombre', 'estado_lote_color',
            'total_unidades', 'unidades_registradas', 'unidades_disponibles',
            'fecha_llegada_estimada', 'fecha_llegada_real',
            'eta_dias', 'dias_en_transito',
            'fecha_creacion',
        ]


class LoteImportacionDetailSerializer(serializers.ModelSerializer):
    estado_lote_nombre = serializers.CharField(source='estado_lote.nombre', read_only=True)
    estado_lote_color = serializers.CharField(source='estado_lote.color_hex', read_only=True)
    estado_lote_orden = serializers.IntegerField(source='estado_lote.orden', read_only=True)
    sede_destino_nombre = serializers.CharField(source='sede_destino.nombre', read_only=True)
    sede_destino_ciudad = serializers.CharField(source='sede_destino.ciudad', read_only=True)
    pais_origen_nombre = serializers.CharField(source='pais_origen.nombre', read_only=True)
    creado_por_nombre = serializers.SerializerMethodField()
    historial = HistorialEstadosLoteSerializer(source='historial_estados', many=True, read_only=True)
    vehiculos = serializers.SerializerMethodField()
    unidades_registradas = serializers.ReadOnlyField()
    unidades_disponibles = serializers.ReadOnlyField()
    eta_dias = serializers.ReadOnlyField()
    dias_en_transito = serializers.ReadOnlyField()

    class Meta:
        model = LoteImportacion
        fields = [
            'id', 'codigo_lote', 'proveedor',
            'pais_origen', 'pais_origen_nombre',
            'puerto_origen', 'puerto_destino',
            'sede_destino', 'sede_destino_nombre', 'sede_destino_ciudad',
            'estado_lote', 'estado_lote_nombre', 'estado_lote_color', 'estado_lote_orden',
            'total_unidades', 'unidades_registradas', 'unidades_disponibles',
            'fecha_orden_compra',
            'fecha_embarque_estimado', 'fecha_embarque_real',
            'fecha_llegada_estimada', 'fecha_llegada_real',
            'eta_dias', 'dias_en_transito',
            'numero_bl', 'numero_contenedores',
            'agente_aduanal', 'valor_fob_usd',
            'notas', 'creado_por_nombre',
            'fecha_creacion', 'fecha_actualizacion',
            'historial', 'vehiculos',
        ]

    def get_vehiculos(self, obj):
        qs = obj.vehiculos.select_related('version__modelo__marca', 'estado')
        return VehiculoEnLoteSerializer(qs, many=True).data

    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return f"{obj.creado_por.first_name} {obj.creado_por.last_name}".strip() or obj.creado_por.username
        return None


class LoteImportacionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoteImportacion
        fields = [
            'codigo_lote', 'proveedor', 'pais_origen',
            'puerto_origen', 'puerto_destino', 'sede_destino',
            'total_unidades',
            'fecha_orden_compra',
            'fecha_embarque_estimado', 'fecha_llegada_estimada',
            'numero_contenedores', 'valor_fob_usd', 'notas',
        ]

    def validate_codigo_lote(self, value):
        if LoteImportacion.objects.filter(codigo_lote=value.upper()).exists():
            raise serializers.ValidationError('Ya existe un lote con este código.')
        return value.upper()

    def validate_total_unidades(self, value):
        if value <= 0:
            raise serializers.ValidationError('El total de unidades debe ser mayor a 0.')
        return value

    def create(self, validated_data):
        # Estado inicial: PROGRAMADO (orden=1)
        try:
            estado_inicial = CtEstadoLote.objects.get(codigo='PROGRAMADO')
        except CtEstadoLote.DoesNotExist:
            raise serializers.ValidationError(
                'Estado inicial "PROGRAMADO" no encontrado. Ejecuta el script de setup.'
            )
        validated_data['estado_lote'] = estado_inicial
        validated_data['creado_por'] = self.context['request'].user
        return super().create(validated_data)


class LoteUpdateEstadoSerializer(serializers.Serializer):
    estado_lote_id = serializers.IntegerField()
    notas = serializers.CharField(required=False, allow_blank=True, default='')
    ubicacion = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_estado_lote_id(self, value):
        try:
            return CtEstadoLote.objects.get(pk=value)
        except CtEstadoLote.DoesNotExist:
            raise serializers.ValidationError('Estado de lote no encontrado.')


class LoteAddVehiculosSerializer(serializers.Serializer):
    """Agrega vehículos al lote desde un manifiesto."""
    vehiculos = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )

    def validate_vehiculos(self, vehiculos):
        from apps.vehiculos.models import VehiculoNuevo
        required = {'vin', 'version_id', 'color_exterior'}
        for i, v in enumerate(vehiculos):
            missing = required - set(v.keys())
            if missing:
                raise serializers.ValidationError(
                    f'Vehículo {i+1}: campos requeridos faltantes: {missing}'
                )
            if VehiculoNuevo.objects.filter(vin=v['vin']).exists():
                raise serializers.ValidationError(
                    f'VIN {v["vin"]} ya existe en el sistema.'
                )
        return vehiculos
