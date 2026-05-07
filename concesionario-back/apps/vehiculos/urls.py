# apps/vehiculos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'marcas', MarcaViewSet, basename='marcas')
router.register(r'modelos', ModeloViewSet, basename='modelos')
router.register(r'versiones', VersionTrimViewSet, basename='versiones')
router.register(r'equipamiento', EquipamientoBaseViewSet, basename='equipamiento')
router.register(r'inventario', VehiculoNuevoViewSet, basename='inventario')

urlpatterns = [
    path('', include(router.urls)),
]