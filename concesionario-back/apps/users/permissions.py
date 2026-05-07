from rest_framework.permissions import BasePermission

ROLE_ADMIN = 'Administrador'
ROLE_VENDEDOR = 'Vendedor'
ROLE_GERENTE = 'Gerente'


def _user_in_roles(user, roles):
    if not user or not user.is_authenticated:
        return False
    return user.groups.filter(name__in=roles).exists()


class IsAdministrador(BasePermission):
    """Solo Administrador."""
    def has_permission(self, request, view):
        return _user_in_roles(request.user, [ROLE_ADMIN])


class IsAdminOrVendedor(BasePermission):
    """Administrador o Vendedor."""
    def has_permission(self, request, view):
        return _user_in_roles(request.user, [ROLE_ADMIN, ROLE_VENDEDOR])


class IsAdminOrGerente(BasePermission):
    """Administrador o Gerente."""
    def has_permission(self, request, view):
        return _user_in_roles(request.user, [ROLE_ADMIN, ROLE_GERENTE])


class IsAdminOrVendedorOrGerente(BasePermission):
    """Cualquier rol válido del sistema."""
    def has_permission(self, request, view):
        return _user_in_roles(request.user, [ROLE_ADMIN, ROLE_VENDEDOR, ROLE_GERENTE])
