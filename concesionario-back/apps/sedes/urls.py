from django.urls import path
from .views import SedeListCreateView, SedeDetailView

urlpatterns = [
    path('', SedeListCreateView.as_view(), name='sede-list-create'),
    path('<int:pk>/', SedeDetailView.as_view(), name='sede-detail'),
]
