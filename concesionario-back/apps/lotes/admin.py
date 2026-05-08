from django.contrib import admin
from .models import CtEstadoLote, LoteImportacion, HistorialEstadosLote


@admin.register(CtEstadoLote)
class CtEstadoLoteAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'orden', 'color_hex']
    ordering = ['orden']


@admin.register(LoteImportacion)
class LoteImportacionAdmin(admin.ModelAdmin):
    list_display = ['codigo_lote', 'proveedor', 'estado_lote', 'sede_destino', 'total_unidades', 'fecha_llegada_estimada']
    list_filter = ['estado_lote', 'sede_destino']
    search_fields = ['codigo_lote', 'proveedor', 'numero_bl']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion', 'creado_por']


@admin.register(HistorialEstadosLote)
class HistorialEstadosLoteAdmin(admin.ModelAdmin):
    list_display = ['lote', 'estado_anterior', 'estado_nuevo', 'fecha_cambio', 'responsable']
    list_filter = ['estado_nuevo']
    readonly_fields = ['fecha_cambio']
