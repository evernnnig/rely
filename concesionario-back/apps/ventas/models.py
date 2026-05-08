from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

DURACION_RESERVA_DIAS_DEFAULT = 7


class OrdenVenta(models.Model):
    vehiculo = models.ForeignKey(
        'vehiculos.VehiculoNuevo',
        on_delete=models.PROTECT,
        db_column='vehiculo_id',
        related_name='ordenes_venta'
    )
    cliente = models.ForeignKey(
        'clientes.Cliente',
        on_delete=models.PROTECT,
        null=True,
        db_column='cliente_id',
        related_name='ordenes_venta'
    )
    vendedor = models.ForeignKey(
        'vendedores.Vendedor',  # Ahora sí existe la app vendedores
        on_delete=models.PROTECT,
        null=True,
        db_column='vendedor_id',
        related_name='ordenes_venta'
    )
    estado_orden = models.ForeignKey(
        'catalogos.CtEstadoOrden',  # Referencia correcta al modelo
        on_delete=models.PROTECT,
        null=True,
        db_column='estado_orden',
        related_name='ordenes'
    )
    
    codigo_orden = models.CharField(
        max_length=100,
        unique=True,
        db_column='codigo_orden'
    )
    precio_final_venta = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        db_column='precio_final_venta'
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        db_column='fecha_creacion'
    )

    class Meta:
        managed = False
        db_table = 'orden_venta'
        ordering = ['-fecha_creacion']
        verbose_name = 'Orden de Venta'
        verbose_name_plural = 'Órdenes de Venta'

    def __str__(self):
        cliente_nombre = self.cliente.nombre_completo if self.cliente else 'Sin cliente'
        return f"#{self.codigo_orden} - {cliente_nombre}"


class TransaccionPago(models.Model):
    orden_venta = models.ForeignKey(
        OrdenVenta,
        on_delete=models.PROTECT,
        db_column='orden_venta_id',
        related_name='transacciones_pago'
    )
    entidad_financiera = models.ForeignKey(
        'catalogos.CtEntidadFinanciera',
        on_delete=models.PROTECT,
        null=True,
        db_column='entidad_financiera_id',
        related_name='transacciones'
    )
    estado_pago = models.ForeignKey(
        'catalogos.CtEstadoPago',  # Referencia correcta
        on_delete=models.PROTECT,
        null=True,
        db_column='estado_pago',
        related_name='transacciones'
    )
    
    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        db_column='monto'
    )
    monto_inicial = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        db_column='monto_inicial'
    )
    monto_restante = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        db_column='monto_restante'
    )
    moneda = models.CharField(
        max_length=10,
        null=True,
        db_column='moneda'
    )
    tasa_cambio = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        db_column='tasa_cambio'
    )
    metodo_pago = models.IntegerField(
        null=True,
        db_column='metodo_pago'
    )
    referencia = models.CharField(
        max_length=100,
        unique=True,
        db_column='referencia'
    )
    fecha_pago = models.DateTimeField(
        null=True,
        db_column='fecha_pago'
    )
    verificado_por = models.IntegerField(
        null=True,
        db_column='verificado_por'
    )

    class Meta:
        managed = False
        db_table = 'transaccion_pago'
        ordering = ['-fecha_pago']
        verbose_name = 'Transacción de Pago'
        verbose_name_plural = 'Transacciones de Pago'

    def __str__(self):
        return f"Pago {self.referencia} - Orden #{self.orden_venta.codigo_orden}"


class HistorialEstadosOrden(models.Model):
    orden = models.ForeignKey(
        OrdenVenta,
        on_delete=models.PROTECT,
        db_column='orden_id',
        related_name='historial_estados'
    )
    estado_anterior = models.ForeignKey(
        'catalogos.CtEstadoOrden',
        on_delete=models.PROTECT,
        null=True,
        db_column='estado_anterior_id',
        related_name='cambios_desde'
    )
    estado_nuevo = models.ForeignKey(
        'catalogos.CtEstadoOrden',
        on_delete=models.PROTECT,
        null=True,
        db_column='estado_nuevo_id',
        related_name='cambios_hacia'
    )
    fecha_cambio = models.DateTimeField(
        auto_now_add=True,
        db_column='fecha_cambio'
    )
    responsable = models.ForeignKey(
        'vendedores.Vendedor',
        on_delete=models.PROTECT,
        null=True,
        db_column='responsable_id',
        related_name='cambios_estado'
    )
    motivo_cambio = models.TextField(
        null=True,
        blank=True,
        db_column='motivo_cambio'
    )

    class Meta:
        managed = False
        db_table = 'historial_estados_orden'
        ordering = ['-fecha_cambio']
        verbose_name = 'Historial de Estado de Orden'
        verbose_name_plural = 'Historial de Estados de Órdenes'

    def __str__(self):
        return f"Cambio de estado - Orden #{self.orden.codigo_orden}"


class RegistroGarantia(models.Model):
    orden_venta = models.OneToOneField(
        OrdenVenta,
        on_delete=models.PROTECT,
        db_column='orden_venta_id',
        related_name='garantia'
    )
    fecha_vigencia = models.DateTimeField(
        null=True,
        db_column='fecha_vigencia'
    )
    fecha_vencimiento = models.DateTimeField(
        null=True,
        db_column='fecha_vencimiento'
    )
    kilometraje_garantia = models.CharField(
        max_length=50,
        null=True,
        db_column='kilometraje_garantia'
    )

    class Meta:
        managed = False
        db_table = 'registro_garantia'
        verbose_name = 'Registro de Garantía'
        verbose_name_plural = 'Registros de Garantías'

    def __str__(self):
        return f"Garantía - Orden #{self.orden_venta.codigo_orden}"


class MediaAdjunto(models.Model):
    tabla_referencia = models.CharField(
        max_length=100,
        db_column='tabla_referencia'
    )
    registro_id = models.BigIntegerField(
        db_column='registro_id'
    )
    tipo_archivo = models.CharField(
        max_length=50,
        null=True,
        db_column='tipo_archivo'
    )
    url_archivo = models.TextField(
        db_column='url_archivo'
    )
    fecha_subida = models.DateTimeField(
        auto_now_add=True,
        db_column='fecha_subida'
    )

    class Meta:
        managed = False
        db_table = 'media_adjunto'
        verbose_name = 'Archivo Adjunto'
        verbose_name_plural = 'Archivos Adjuntos'

    def __str__(self):
        return f"Adjunto {self.id} - {self.tabla_referencia}"

class SeguimientoPago(models.Model):
    """Registro de pagos parciales/cuotas"""
    transaccion = models.ForeignKey(
        'TransaccionPago',
        on_delete=models.PROTECT,
        db_column='transaccion_id',
        related_name='pagos_parciales'
    )
    numero_cuota = models.IntegerField(db_column='numero_cuota')
    monto_pagado = models.DecimalField(max_digits=12, decimal_places=2, db_column='monto_pagado')
    fecha_pago = models.DateTimeField(db_column='fecha_pago')
    fecha_vencimiento = models.DateTimeField(null=True, db_column='fecha_vencimiento')
    estado = models.ForeignKey(
        'catalogos.CtEstadoPago',
        on_delete=models.PROTECT,
        null=True,
        db_column='estado_id',
        related_name='cuotas'
    )
    comprobante_url = models.TextField(null=True, db_column='comprobante_url')
    notas = models.TextField(null=True, db_column='notas')
    
    class Meta:
        managed = False
        db_table = 'seguimiento_pago'
        ordering = ['numero_cuota']
        verbose_name = 'Seguimiento de Pago'
        verbose_name_plural = 'Seguimientos de Pagos'


class NotificacionCliente(models.Model):
    """Historial de notificaciones enviadas al cliente"""
    orden = models.ForeignKey(
        'OrdenVenta',
        on_delete=models.PROTECT,
        db_column='orden_id',
        related_name='notificaciones'
    )
    tipo = models.CharField(max_length=50, db_column='tipo')  # email, sms, whatsapp
    asunto = models.CharField(max_length=200, db_column='asunto')
    mensaje = models.TextField(db_column='mensaje')
    fecha_envio = models.DateTimeField(auto_now_add=True, db_column='fecha_envio')
    enviado_por = models.ForeignKey(
        'vendedores.Vendedor',
        on_delete=models.PROTECT,
        null=True,
        db_column='enviado_por_id',
        related_name='notificaciones_enviadas'
    )
    estado_envio = models.CharField(max_length=20, db_column='estado_envio', default='pendiente')
    
    class Meta:
        managed = False
        db_table = 'notificacion_cliente'
        ordering = ['-fecha_envio']
        verbose_name = 'Notificación al Cliente'
        verbose_name_plural = 'Notificaciones a Clientes'


class DocumentoOrden(models.Model):
    """Documentos adjuntos a la orden (contratos, facturas, etc.)"""
    orden = models.ForeignKey(
        'OrdenVenta',
        on_delete=models.PROTECT,
        db_column='orden_id',
        related_name='documentos'
    )
    tipo_documento = models.CharField(max_length=50, db_column='tipo_documento')
    nombre = models.CharField(max_length=200, db_column='nombre')
    url_archivo = models.TextField(db_column='url_archivo')
    fecha_subida = models.DateTimeField(auto_now_add=True, db_column='fecha_subida')
    subido_por = models.ForeignKey(
        'vendedores.Vendedor',
        on_delete=models.PROTECT,
        null=True,
        db_column='subido_por_id',
        related_name='documentos_subidos'
    )
    
    class Meta:
        managed = False
        db_table = 'documento_orden'
        ordering = ['-fecha_subida']
        verbose_name = 'Documento de Orden'
        verbose_name_plural = 'Documentos de Órdenes'


# ─────────────────────────────────────────────────────────────────
# NUEVOS MODELOS: Reserva, PlanPago, CuotaPlan
# ─────────────────────────────────────────────────────────────────

class Reserva(models.Model):
    ESTADO_ACTIVA = 'ACTIVA'
    ESTADO_VENCIDA = 'VENCIDA'
    ESTADO_CONVERTIDA = 'CONVERTIDA'
    ESTADO_CANCELADA = 'CANCELADA'

    ESTADO_CHOICES = [
        (ESTADO_ACTIVA, 'Activa'),
        (ESTADO_VENCIDA, 'Vencida'),
        (ESTADO_CONVERTIDA, 'Convertida a Venta'),
        (ESTADO_CANCELADA, 'Cancelada'),
    ]

    vehiculo = models.ForeignKey(
        'vehiculos.VehiculoNuevo',
        on_delete=models.PROTECT,
        db_column='vehiculo_id',
        related_name='reservas',
    )
    cliente = models.ForeignKey(
        'clientes.Cliente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='cliente_id',
        related_name='reservas',
    )
    vendedor = models.ForeignKey(
        'vendedores.Vendedor',
        on_delete=models.PROTECT,
        null=True,
        db_column='vendedor_id',
        related_name='reservas',
    )
    orden = models.OneToOneField(
        OrdenVenta,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='orden_id',
        related_name='reserva_origen',
    )
    fecha_inicio = models.DateTimeField(auto_now_add=True, db_column='fecha_inicio')
    fecha_vencimiento = models.DateTimeField(db_column='fecha_vencimiento')
    monto_separacion = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, db_column='monto_separacion'
    )
    estado = models.CharField(
        max_length=20, choices=ESTADO_CHOICES, default=ESTADO_ACTIVA, db_column='estado'
    )
    notas = models.TextField(null=True, blank=True, db_column='notas')

    class Meta:
        db_table = 'reserva'
        ordering = ['-fecha_inicio']
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'

    def __str__(self):
        return f"Reserva #{self.id} — {self.vehiculo.vin}"

    @property
    def esta_vencida(self):
        return self.estado == self.ESTADO_ACTIVA and timezone.now() > self.fecha_vencimiento

    @property
    def dias_restantes(self):
        if self.estado != self.ESTADO_ACTIVA:
            return 0
        delta = self.fecha_vencimiento - timezone.now()
        return max(0, delta.days)


class PlanPago(models.Model):
    TIPO_CONTADO = 'CONTADO'
    TIPO_CUOTAS = 'CUOTAS_FIJAS'
    TIPO_HITOS = 'HITOS'

    TIPO_CHOICES = [
        (TIPO_CONTADO, 'Contado'),
        (TIPO_CUOTAS, 'Cuotas Fijas'),
        (TIPO_HITOS, 'Por Hitos'),
    ]

    PERIODICIDAD_CHOICES = [
        ('MENSUAL', 'Mensual'),
        ('TRIMESTRAL', 'Trimestral'),
        ('SEMESTRAL', 'Semestral'),
    ]

    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('COMPLETADO', 'Completado'),
        ('EN_MORA', 'En Mora'),
        ('CANCELADO', 'Cancelado'),
    ]

    orden = models.OneToOneField(
        OrdenVenta,
        on_delete=models.PROTECT,
        db_column='orden_id',
        related_name='plan_pago',
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TIPO_CONTADO, db_column='tipo')
    total_acordado = models.DecimalField(max_digits=12, decimal_places=2, db_column='total_acordado')
    cuotas_totales = models.IntegerField(default=1, db_column='cuotas_totales')
    periodicidad = models.CharField(
        max_length=20, choices=PERIODICIDAD_CHOICES, null=True, blank=True, db_column='periodicidad'
    )
    fecha_inicio = models.DateField(db_column='fecha_inicio')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO', db_column='estado')

    class Meta:
        db_table = 'plan_pago'
        verbose_name = 'Plan de Pago'
        verbose_name_plural = 'Planes de Pago'

    def __str__(self):
        return f"Plan #{self.id} — Orden #{self.orden.codigo_orden}"

    @property
    def monto_por_cuota(self):
        if self.cuotas_totales and self.cuotas_totales > 0:
            return round(float(self.total_acordado) / self.cuotas_totales, 2)
        return float(self.total_acordado)


class CuotaPlan(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('VENCIDA', 'Vencida'),
        ('PERDONADA', 'Perdonada'),
    ]

    plan = models.ForeignKey(
        PlanPago,
        on_delete=models.CASCADE,
        db_column='plan_id',
        related_name='cuotas',
    )
    transaccion = models.ForeignKey(
        TransaccionPago,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='transaccion_id',
        related_name='cuotas_plan',
    )
    numero_cuota = models.IntegerField(db_column='numero_cuota')
    monto_esperado = models.DecimalField(max_digits=12, decimal_places=2, db_column='monto_esperado')
    fecha_vencimiento = models.DateField(db_column='fecha_vencimiento')
    fecha_pago_real = models.DateField(null=True, blank=True, db_column='fecha_pago_real')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE', db_column='estado')

    class Meta:
        db_table = 'cuota_plan'
        ordering = ['numero_cuota']
        verbose_name = 'Cuota del Plan'
        verbose_name_plural = 'Cuotas del Plan'

    def __str__(self):
        return f"Cuota #{self.numero_cuota} — Plan #{self.plan_id}"