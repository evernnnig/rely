from django.db import models

class Marca(models.Model):
    nombre = models.CharField(max_length=255)
    pais_origen = models.ForeignKey(
        'catalogos.CtPais', 
        on_delete=models.PROTECT, 
        db_column='pais_origen'
    )

    class Meta:
        db_table = 'marca'
        verbose_name = 'Marca'
        verbose_name_plural = 'Marcas'

    def __str__(self):
        return self.nombre

class Modelo(models.Model):
    marca = models.ForeignKey(Marca, on_delete=models.CASCADE, db_column='marca_id')
    nombre = models.CharField(max_length=255)
    tipo = models.ForeignKey(
        'catalogos.CtTipoModelo', 
        on_delete=models.PROTECT, 
        db_column='tipo'
    )

    class Meta:
        db_table = 'modelo'

    def __str__(self):
        return f"{self.marca.nombre} {self.nombre}"

class VersionTrim(models.Model):
    modelo = models.ForeignKey(Modelo, on_delete=models.CASCADE, db_column='modelo_id')
    nombre_version = models.CharField(max_length=255, null=True, blank=True)
    transmision = models.CharField(max_length=100, null=True, blank=True)
    motorizacion = models.CharField(max_length=100, null=True, blank=True)
    año_modelo = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'version_trim'

    def __str__(self):
        return f"{self.modelo.nombre} - {self.nombre_version}"

class EquipamientoBase(models.Model):
    id = models.AutoField(primary_key=True)
    version = models.ForeignKey('VersionTrim', on_delete=models.CASCADE, related_name='equipamiento')
    descripcion = models.TextField(null=True, blank=True)
    nombre_caracteristica = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = 'equipamiento_base'

    def __str__(self):
        return f"{self.nombre_caracteristica} - {self.version.nombre_version}"

class VehiculoNuevo(models.Model):
    version = models.ForeignKey(VersionTrim, on_delete=models.PROTECT, db_column='version_id')
    vin = models.CharField(max_length=255, unique=True, db_column='vin')
    numero_motor = models.CharField(max_length=255, unique=True)
    numero_chasis = models.CharField(max_length=255, unique=True)
    color_exterior = models.CharField(max_length=100, null=True, blank=True)
    color_interior = models.CharField(max_length=100, null=True, blank=True)
    fecha_llegada = models.DateTimeField(null=True, blank=True)
    ubicacion_fisica = models.ForeignKey(
        'catalogos.CtEstadoVenezuela', 
        on_delete=models.SET_NULL, 
        db_column='ubicacion_estado_id',
        null=True, 
        blank=True,
        verbose_name="Ubicación (Estado)"
    )
    precio_lista_sugerido = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    estado = models.ForeignKey(
        'catalogos.CtEstadoVehiculo', 
        on_delete=models.PROTECT, 
        db_column='estado',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'vehiculo_nuevo'

    def __str__(self):
        return f"{self.vin} ({self.version})"

class EquipamientoBase(models.Model):
    version = models.ForeignKey(VersionTrim, on_delete=models.CASCADE, db_column='version_id')
    descripcion = models.CharField(max_length=255, null=True, blank=True)
    nombre_caracteristica = models.CharField(max_length=255, null=True, blank=True)

    version = models.ForeignKey(
        'VersionTrim', 
        related_name='equipamiento',
        on_delete=models.CASCADE,
        db_column='version_id'
    )

    class Meta:
        db_table = 'equipamiento_base'