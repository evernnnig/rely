from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    telefono_1 = models.IntegerField()
    telefono_2 = models.IntegerField()
    nacionalidad = models.IntegerField()
    identificacion = models.IntegerField()
    cargo = models.IntegerField()
    direccion = models.CharField(max_length=100)
    