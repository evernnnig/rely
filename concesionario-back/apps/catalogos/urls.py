from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'pais', PaisViewSet)
router.register(r'estado-vehiculo', EstadoVehiculoViewSet)
router.register(r'estado-venezuela', EstadoVenezuelaViewSet)
router.register(r'entidad-financiera', EntidadFinancieraViewSet)
router.register(r'estado-orden', EstadoOrdenViewSet)
router.register(r'metodo-pago', MetodoPagoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]