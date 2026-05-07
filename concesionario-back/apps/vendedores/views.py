from django.db import models
from django.conf import settings


class Vendedor(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='vendedor'
    )
    nacionalidad = models.IntegerField(
        null=True,
        db_column='nacionalidad'
    )
    identificacion = models.CharField(
        max_length=50,
        unique=True,
        db_column='identificacion'
    )
    telefono_1 = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_column='telefono_1'
    )
    telefono_2 = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_column='telefono_2'
    )
    direccion = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_column='direccion'
    )
    cargo = models.IntegerField(
        null=True,
        db_column='cargo'
    )

    class Meta:
        managed = False  # La tabla ya existe
        db_table = 'vendedor'
        verbose_name = 'Vendedor'
        verbose_name_plural = 'Vendedores'

    def __str__(self):
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
        return f"Vendedor #{self.id}"
    
    @property
    def nombre_completo(self):
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}".strip()
        return ''
    
    @property
    def email(self):
        return self.user.email if self.user else ''