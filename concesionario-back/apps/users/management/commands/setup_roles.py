from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

ROLES = ['Administrador', 'Vendedor', 'Gerente']


class Command(BaseCommand):
    help = 'Crea los roles base del sistema (grupos de Django). Seguro de ejecutar múltiples veces.'

    def handle(self, *args, **options):
        self.stdout.write('Configurando roles...')
        for role_name in ROLES:
            _, created = Group.objects.get_or_create(name=role_name)
            label = 'creado' if created else 'ya existía'
            self.stdout.write(f'  Rol "{role_name}": {label}')
        self.stdout.write(self.style.SUCCESS('Roles configurados correctamente.'))
