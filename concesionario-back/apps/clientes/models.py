from django.db import models

# class Cliente(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     nombre_completo = models.CharField(max_length=255)
#     nacionalidad = models.ForeignKey(
#         'catalogos.CtPais', 
#         on_delete=models.PROTECT, 
#         db_column='nacionalidad_id',
#     )
#     identificacion = models.CharField(max_length=50, unique=True)
#     correo = models.EmailField(unique=True)
#     telefono_1 = models.CharField(max_length=20, null=True, blank=True)
#     telefono_2 = models.CharField(max_length=20, null=True, blank=True)
#     direccion = models.TextField(null=True, blank=True)
    
#     estado_residencia = models.ForeignKey(
#         'catalogos.CtEstadoVenezuela',
#         on_delete=models.SET_NULL,
#         db_column='estado_id',
#         null=True,
#         blank=True
#     )

#     class Meta:
#         managed = False
#         db_table = 'cliente'

#     def __str__(self):
#         return f"{self.identificacion} - {self.nombre_completo}"

class Cliente(models.Model):
    nombre_completo = models.CharField(
        max_length=255,
        db_column='nombre_completo'
    )
    nacionalidad = models.ForeignKey(
        'catalogos.CtPais',
        on_delete=models.PROTECT,
        null=True,
        db_column='nacionalidad_id',
        related_name='clientes'
    )
    identificacion = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        db_column='identificacion'
    )
    correo = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        db_column='correo'
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
    estado = models.ForeignKey(
        'catalogos.CtEstadoVenezuela',
        on_delete=models.PROTECT,
        null=True,
        db_column='estado_id',
        related_name='clientes'
    )

    class Meta:
        managed = False
        db_table = 'cliente'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return self.nombre_completo or f"Cliente #{self.id}"