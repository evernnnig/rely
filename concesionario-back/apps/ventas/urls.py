# apps/ventas/urls.py
from django.urls import path
from .views import (
    OrdenVentaListCreateView, 
    OrdenVentaDetailView,
    OrdenVentaDetalleCompletoView,
    EnviarNotificacionClienteView,
    RegistrarPagoParcialView,
    SubirDocumentoOrdenView,
    ActualizarEstadoPagoView,
)

urlpatterns = [
    path('ordenes/', OrdenVentaListCreateView.as_view(), name='ordenes-list-create'),
    path('ordenes/<int:pk>/', OrdenVentaDetailView.as_view(), name='ordenes-detail'),
    path('ordenes/<int:pk>/completo/', OrdenVentaDetalleCompletoView.as_view(), name='ordenes-detalle-completo'),
    path('ordenes/<int:pk>/notificar/', EnviarNotificacionClienteView.as_view(), name='ordenes-notificar'),
    path('ordenes/<int:pk>/pago-parcial/', RegistrarPagoParcialView.as_view(), name='ordenes-pago-parcial'),
    path('ordenes/<int:pk>/subir-documento/', SubirDocumentoOrdenView.as_view(), name='ordenes-subir-documento'),
    path('ordenes/<int:orden_id>/actualizar-estado-pago/', ActualizarEstadoPagoView.as_view(), name='ordenes-actualizar-estado-pago'),
]