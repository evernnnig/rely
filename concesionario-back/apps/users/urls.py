from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import LoginView, LogoutView, MeView, CreateUserView, ListUsersView, UpdateUserView, RolesListView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('roles/', RolesListView.as_view(), name='roles-list'),
    path('users/', ListUsersView.as_view(), name='users-list'),
    path('users/create/', CreateUserView.as_view(), name='users-create'),
    path('users/<int:user_id>/', UpdateUserView.as_view(), name='users-update'),
]
