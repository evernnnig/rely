from django.db import models
from django.conf import settings


class Sede(models.Model):
    codigo_sede = models.CharField(max_length=20, unique=True, db_column='codigo_sede')
    nombre = models.CharField(max_length=100, db_column='nombre')
    ciudad = models.CharField(max_length=100, db_column='ciudad')
    estado_venezuela = models.ForeignKey(
        'catalogos.CtEstadoVenezuela',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='estado_venezuela_id',
        related_name='sedes'
    )
    direccion = models.CharField(max_length=255, db_column='direccion')
    telefono = models.CharField(max_length=20, null=True, blank=True, db_column='telefono')
    email = models.CharField(max_length=100, null=True, blank=True, db_column='email')
    encargado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='encargado_id',
        related_name='sedes_a_cargo'
    )
    activa = models.BooleanField(default=True, db_column='activa')
    fecha_creacion = models.DateTimeField(auto_now_add=True, db_column='fecha_creacion')

    class Meta:
        db_table = 'sede'
        verbose_name = 'Sede'
        verbose_name_plural = 'Sedes'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.codigo_sede} — {self.nombre} ({self.ciudad})"
