from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth.models import User, Group

from .serializers import LoginSerializer, UserSerializer, CreateUserSerializer, UpdateUserSerializer
from .permissions import IsAdministrador


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Se requiere el refresh token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({
                'message': 'Token inválido, sesión cerrada de todas formas',
                'clear_tokens': True,
            }, status=status.HTTP_200_OK)

        return Response({
            'message': 'Sesión cerrada exitosamente',
            'clear_tokens': True,
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class CreateUserView(APIView):
    """Crea un nuevo usuario con rol. Solo accesible por Administrador."""
    permission_classes = [IsAuthenticated, IsAdministrador]

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class ListUsersView(APIView):
    """Lista todos los usuarios del sistema. Solo accesible por Administrador."""
    permission_classes = [IsAuthenticated, IsAdministrador]

    def get(self, request):
        users = (
            User.objects
            .prefetch_related('groups')
            .select_related('vendedor')
            .all()
            .order_by('id')
        )
        return Response(UserSerializer(users, many=True).data)


class UpdateUserView(APIView):
    """Actualiza datos, rol, contraseña y estado de un usuario. Solo accesible por Administrador."""
    permission_classes = [IsAuthenticated, IsAdministrador]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateUserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        return Response(UserSerializer(updated_user).data)


class RolesListView(APIView):
    """Devuelve los roles disponibles en el sistema. Solo accesible por Administrador."""
    permission_classes = [IsAuthenticated, IsAdministrador]

    def get(self, request):
        roles = list(Group.objects.values_list('name', flat=True))
        return Response({'roles': roles})