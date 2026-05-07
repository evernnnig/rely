# apps/catalogos/models.py

from django.db import models


class CtPais(models.Model):
    codigo_iso = models.CharField(max_length=10, unique=True, db_column='codigo_iso')
    nombre = models.CharField(max_length=100, db_column='nombre')
    continente = models.CharField(max_length=50, db_column='continente')

    class Meta:
        managed = False
        db_table = 'ct_pais'
        verbose_name = 'País'
        verbose_name_plural = 'Países'

    def __str__(self):
        return self.nombre


class CtEstadoVenezuela(models.Model):
    nombre = models.CharField(max_length=100, db_column='nombre')
    codigo_iso = models.CharField(max_length=10, unique=True, db_column='codigo_iso')
    pais = models.ForeignKey(CtPais, on_delete=models.PROTECT, db_column='pais_id')

    class Meta:
        managed = False
        db_table = 'ct_estado_venezuela'
        verbose_name = 'Estado de Venezuela'
        verbose_name_plural = 'Estados de Venezuela'

    def __str__(self):
        return self.nombre


class CtEstadoOrden(models.Model):
    estado_orden = models.CharField(max_length=100, db_column='estado_orden')

    class Meta:
        managed = False
        db_table = 'ct_estado_orden'
        verbose_name = 'Estado de Orden'
        verbose_name_plural = 'Estados de Órdenes'

    def __str__(self):
        return self.estado_orden


class CtEstadoPago(models.Model):
    estado_pago = models.CharField(max_length=100, db_column='estado_pago')

    class Meta:
        managed = False
        db_table = 'ct_estado_pago'
        verbose_name = 'Estado de Pago'
        verbose_name_plural = 'Estados de Pagos'

    def __str__(self):
        return self.estado_pago


class CtEstadoVehiculo(models.Model):
    estado = models.CharField(max_length=100, db_column='estado')

    class Meta:
        managed = False
        db_table = 'ct_estado_vehiculo'
        verbose_name = 'Estado de Vehículo'
        verbose_name_plural = 'Estados de Vehículos'

    def __str__(self):
        return self.estado


class CtEntidadFinanciera(models.Model):
    nombre = models.CharField(max_length=255, db_column='nombre')
    pais = models.ForeignKey(CtPais, on_delete=models.PROTECT, null=True, db_column='pais_id')
    codigo_identificador = models.CharField(max_length=50, unique=True, null=True, db_column='codigo_identificador')
    metodo_pago_asociado = models.CharField(max_length=50, null=True, db_column='metodo_pago_asociado')
    prefijo_telefono = models.CharField(max_length=10, null=True, db_column='prefijo_telefono')
    red_blockchain = models.CharField(max_length=50, null=True, db_column='red_blockchain')

    class Meta:
        managed = False
        db_table = 'ct_entidad_financiera'
        verbose_name = 'Entidad Financiera'
        verbose_name_plural = 'Entidades Financieras'

    def __str__(self):
        return self.nombre


class CtTipoModelo(models.Model):
    tipo = models.CharField(max_length=100, db_column='tipo')

    class Meta:
        managed = False
        db_table = 'ct_tipo_modelo'
        verbose_name = 'Tipo de Modelo'
        verbose_name_plural = 'Tipos de Modelos'

    def __str__(self):
        return self.tipo


class CtEstadoReclamo(models.Model):
    estado_reclamo = models.CharField(max_length=100, null=True, db_column='estado_reclamo')

    class Meta:
        managed = False
        db_table = 'ct_estado_reclamo'
        verbose_name = 'Estado de Reclamo'
        verbose_name_plural = 'Estados de Reclamos'

    def __str__(self):
        return self.estado_reclamo or ''

class CtMetodoPago(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=255, null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        managed = False
        db_table = 'ct_metodo_pago'

    def __str__(self):
        return self.nombre