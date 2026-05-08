from django.contrib import admin
from .models import Sede

@admin.register(Sede)
class SedeAdmin(admin.ModelAdmin):
    list_display = ['codigo_sede', 'nombre', 'ciudad', 'activa']
    list_filter = ['activa', 'ciudad']
    search_fields = ['codigo_sede', 'nombre', 'ciudad']
