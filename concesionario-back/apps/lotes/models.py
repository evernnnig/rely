from django.db import models
from django.conf import settings
from django.utils import timezone


class CtEstadoLote(models.Model):
    codigo = models.CharField(max_length=30, unique=True, db_column='codigo')
    nombre = models.CharField(max_length=100, db_column='nombre')
    descripcion = models.TextField(null=True, blank=True, db_column='descripcion')
    orden = models.IntegerField(default=0, db_column='orden')
    color_hex = models.CharField(max_length=7, null=True, blank=True, db_column='color_hex')

    class Meta:
        db_table = 'ct_estado_lote'
        verbose_name = 'Estado de Lote'
        verbose_name_plural = 'Estados de Lote'
        ordering = ['orden']

    def __str__(self):
        return self.nombre


class LoteImportacion(models.Model):
    codigo_lote = models.CharField(max_length=50, unique=True, db_column='codigo_lote')
    proveedor = models.CharField(max_length=200, db_column='proveedor')
    pais_origen = models.ForeignKey(
        'catalogos.CtPais',
        on_delete=models.PROTECT,
        db_column='pais_origen_id',
        related_name='lotes_importacion'
    )
    puerto_origen = models.CharField(max_length=100, db_column='puerto_origen')
    puerto_destino = models.CharField(max_length=100, db_column='puerto_destino')
    sede_destino = models.ForeignKey(
        'sedes.Sede',
        on_delete=models.PROTECT,
        db_column='sede_destino_id',
        related_name='lotes_entrantes'
    )
    estado_lote = models.ForeignKey(
        CtEstadoLote,
        on_delete=models.PROTECT,
        db_column='estado_lote_id',
        related_name='lotes'
    )
    total_unidades = models.IntegerField(db_column='total_unidades')
    fecha_orden_compra = models.DateField(null=True, blank=True, db_column='fecha_orden_compra')
    fecha_embarque_estimado = models.DateField(null=True, blank=True, db_column='fecha_embarque_estimado')
    fecha_embarque_real = models.DateField(null=True, blank=True, db_column='fecha_embarque_real')
    fecha_llegada_estimada = models.DateField(null=True, blank=True, db_column='fecha_llegada_estimada')
    fecha_llegada_real = models.DateField(null=True, blank=True, db_column='fecha_llegada_real')
    numero_bl = models.CharField(max_length=100, null=True, blank=True, db_column='numero_bl')
    numero_contenedores = models.IntegerField(null=True, blank=True, db_column='numero_contenedores')
    agente_aduanal = models.CharField(max_length=200, null=True, blank=True, db_column='agente_aduanal')
    valor_fob_usd = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_column='valor_fob_usd'
    )
    notas = models.TextField(null=True, blank=True, db_column='notas')
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='creado_por_id',
        related_name='lotes_creados'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True, db_column='fecha_creacion')
    fecha_actualizacion = models.DateTimeField(auto_now=True, db_column='fecha_actualizacion')

    class Meta:
        db_table = 'lote_importacion'
        verbose_name = 'Lote de Importación'
        verbose_name_plural = 'Lotes de Importación'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.codigo_lote} — {self.proveedor} ({self.total_unidades} uds.)"

    @property
    def unidades_registradas(self):
        return self.vehiculos.count()

    @property
    def unidades_disponibles(self):
        return self.vehiculos.filter(estado_id=1).count()

    @property
    def dias_en_transito(self):
        if self.fecha_embarque_real and not self.fecha_llegada_real:
            return (timezone.now().date() - self.fecha_embarque_real).days
        return None

    @property
    def eta_dias(self):
        if self.fecha_llegada_estimada and not self.fecha_llegada_real:
            return (self.fecha_llegada_estimada - timezone.now().date()).days
        return None


# Mapa: codigo estado lote → id estado vehículo
ESTADO_LOTE_A_VEHICULO = {
    'EMBARCADO':          3,  # En Tránsito
    'TRANSITO_MARITIMO':  3,
    'EN_ADUANA':          4,  # En Aduana
    'EN_PUERTO':          4,
    'TRANSITO_NACIONAL':  3,
    'RECIBIDO_SEDE':      1,  # Disponible
}


class HistorialEstadosLote(models.Model):
    lote = models.ForeignKey(
        LoteImportacion,
        on_delete=models.PROTECT,
        db_column='lote_id',
        related_name='historial_estados'
    )
    estado_anterior = models.ForeignKey(
        CtEstadoLote,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        db_column='estado_anterior_id',
        related_name='historial_desde'
    )
    estado_nuevo = models.ForeignKey(
        CtEstadoLote,
        on_delete=models.PROTECT,
        db_column='estado_nuevo_id',
        related_name='historial_hacia'
    )
    fecha_cambio = models.DateTimeField(auto_now_add=True, db_column='fecha_cambio')
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='responsable_id',
        related_name='cambios_estado_lote'
    )
    ubicacion = models.CharField(max_length=255, null=True, blank=True, db_column='ubicacion')
    notas = models.TextField(null=True, blank=True, db_column='notas')

    class Meta:
        db_table = 'historial_estados_lote'
        verbose_name = 'Historial de Estado de Lote'
        verbose_name_plural = 'Historial de Estados de Lotes'
        ordering = ['-fecha_cambio']

    def __str__(self):
        anterior = self.estado_anterior.nombre if self.estado_anterior else 'Inicio'
        return f"{self.lote.codigo_lote}: {anterior} → {self.estado_nuevo.nombre}"
