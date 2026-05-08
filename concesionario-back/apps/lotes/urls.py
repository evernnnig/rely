from django.urls import path
from .views import (
    CtEstadoLoteListView,
    LoteImportacionListCreateView,
    LoteImportacionDetailView,
    LoteCambiarEstadoView,
    LoteVehiculosView,
)

urlpatterns = [
    path('estados/', CtEstadoLoteListView.as_view(), name='ct-estado-lote-list'),
    path('', LoteImportacionListCreateView.as_view(), name='lote-list-create'),
    path('<int:pk>/', LoteImportacionDetailView.as_view(), name='lote-detail'),
    path('<int:pk>/estado/', LoteCambiarEstadoView.as_view(), name='lote-cambiar-estado'),
    path('<int:pk>/vehiculos/', LoteVehiculosView.as_view(), name='lote-vehiculos'),
]
