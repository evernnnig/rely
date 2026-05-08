from django.urls import path
from .views import (
    ActualizarEstadoPagoIndividualView,
    EstadoOrdenListView,
    OrdenVentaListCreateView,
    OrdenVentaDetailView,
    OrdenVentaDetalleCompletoView,
    EnviarNotificacionClienteView,
    RegistrarPagoParcialView,
    SubirDocumentoOrdenView,
    ActualizarEstadoPagoView,
    ReservaListCreateView,
    ReservaDetailView,
    ConvertirReservaView,
)

urlpatterns = [
    # Órdenes de venta
    path('ordenes/', OrdenVentaListCreateView.as_view(), name='ordenes-list-create'),
    path('ordenes/<int:pk>/', OrdenVentaDetailView.as_view(), name='ordenes-detail'),
    path('ordenes/<int:pk>/completo/', OrdenVentaDetalleCompletoView.as_view(), name='ordenes-detalle-completo'),
    path('ordenes/<int:pk>/notificar/', EnviarNotificacionClienteView.as_view(), name='ordenes-notificar'),
    path('ordenes/<int:pk>/pago-parcial/', RegistrarPagoParcialView.as_view(), name='ordenes-pago-parcial'),
    path('ordenes/<int:pk>/subir-documento/', SubirDocumentoOrdenView.as_view(), name='ordenes-subir-documento'),
    path('ordenes/<int:orden_id>/actualizar-estado-pago/', ActualizarEstadoPagoView.as_view(), name='ordenes-actualizar-estado-pago'),
    path('pagos/<int:pago_id>/estado/', ActualizarEstadoPagoIndividualView.as_view(), name='pago-actualizar-estado'),
    path('estados-orden/', EstadoOrdenListView.as_view(), name='estados-orden-list'),

    # Reservas
    path('reservas/', ReservaListCreateView.as_view(), name='reservas-list-create'),
    path('reservas/<int:pk>/', ReservaDetailView.as_view(), name='reservas-detail'),
    path('reservas/<int:pk>/convertir/', ConvertirReservaView.as_view(), name='reservas-convertir'),
]
