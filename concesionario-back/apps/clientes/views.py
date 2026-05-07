from rest_framework import viewsets
from .models import Cliente
from .serializers import ClienteSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.select_related('estado_residencia').all()
    queryset = Cliente.objects.select_related('nacionalidad').all()
    serializer_class = ClienteSerializer