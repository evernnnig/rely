from django.contrib.auth import authenticate
from django.contrib.auth.models import User, Group
from rest_framework import serializers

# Todos los roles crean perfil en la tabla vendedor
VENDEDOR_ROLES = {'Vendedor', 'Administrador', 'Gerente'}


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(label="Correo electrónico")
    password = serializers.CharField(
        label="Contraseña",
        style={'input_type': 'password'},
        trim_whitespace=False,
        write_only=True
    )

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = User.objects.filter(email=email).first()

            if not user:
                raise serializers.ValidationError('Credenciales inválidas')

            user = authenticate(username=user.username, password=password)

            if not user:
                raise serializers.ValidationError('Credenciales inválidas')

            if not user.is_active:
                raise serializers.ValidationError('Esta cuenta de usuario está inactiva.')
        else:
            raise serializers.ValidationError('Debe incluir "email" y "password".')

        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    telefono_1 = serializers.SerializerMethodField()
    telefono_2 = serializers.SerializerMethodField()
    direccion = serializers.SerializerMethodField()

    def get_role(self, obj):
        group = obj.groups.first()
        return group.name if group else None

    def get_telefono_1(self, obj):
        try:
            return obj.vendedor.telefono_1 or ''
        except Exception:
            return ''

    def get_telefono_2(self, obj):
        try:
            return obj.vendedor.telefono_2 or ''
        except Exception:
            return ''

    def get_direccion(self, obj):
        try:
            return obj.vendedor.direccion or ''
        except Exception:
            return ''

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'is_active', 'telefono_1', 'telefono_2', 'direccion',
        ]


class CreateUserSerializer(serializers.Serializer):
    username  = serializers.CharField(max_length=150)
    email     = serializers.EmailField()
    password  = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150)
    last_name  = serializers.CharField(max_length=150)
    role       = serializers.ChoiceField(choices=['Administrador', 'Vendedor', 'Gerente'])

    # Campos de perfil vendedor — solo obligatorios en frontend cuando rol es Vendedor/Admin
    telefono_1 = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    telefono_2 = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    direccion  = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Esta cédula ya está registrada.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este correo ya está registrado.')
        return value

    def create(self, validated_data):
        from apps.vendedores.models import Vendedor

        role_name  = validated_data.pop('role')
        telefono_1 = validated_data.pop('telefono_1', '')
        telefono_2 = validated_data.pop('telefono_2', '')
        direccion  = validated_data.pop('direccion', '')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )
        group = Group.objects.get(name=role_name)
        user.groups.add(group)

        # Crear perfil en tabla vendedor para roles que registran ventas
        if role_name in VENDEDOR_ROLES:
            Vendedor.objects.create(
                user=user,
                identificacion=user.username,
                telefono_1=telefono_1,
                telefono_2=telefono_2,
                direccion=direccion,
            )

        return user


class UpdateUserSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name  = serializers.CharField(max_length=150, required=False)
    email      = serializers.EmailField(required=False)
    username   = serializers.CharField(max_length=150, required=False)
    password   = serializers.CharField(min_length=6, required=False, allow_blank=True)
    role       = serializers.CharField(required=False)
    is_active  = serializers.BooleanField(required=False)

    # Campos de perfil vendedor
    telefono_1 = serializers.CharField(max_length=20, required=False, allow_blank=True)
    telefono_2 = serializers.CharField(max_length=20, required=False, allow_blank=True)
    direccion  = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError('Esta cédula ya está registrada.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError('Este correo ya está registrado.')
        return value

    def validate_role(self, value):
        if not Group.objects.filter(name=value).exists():
            raise serializers.ValidationError(f'El rol "{value}" no existe.')
        return value

    def validate_password(self, value):
        if value and len(value) < 6:
            raise serializers.ValidationError('La contraseña debe tener al menos 6 caracteres.')
        return value

    def update(self, instance, validated_data):
        from apps.vendedores.models import Vendedor

        role_name  = validated_data.pop('role', None)
        password   = validated_data.pop('password', None)
        telefono_1 = validated_data.pop('telefono_1', None)
        telefono_2 = validated_data.pop('telefono_2', None)
        direccion  = validated_data.pop('direccion', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if role_name is not None:
            instance.groups.clear()
            instance.groups.add(Group.objects.get(name=role_name))

        # Determinar el rol actual (después del posible cambio)
        current_role = role_name or (instance.groups.first().name if instance.groups.exists() else None)

        if current_role in VENDEDOR_ROLES:
            vendedor_data = {
                'identificacion': instance.username,  # Siempre sincronizar con username/cédula
            }
            if telefono_1 is not None:
                vendedor_data['telefono_1'] = telefono_1
            if telefono_2 is not None:
                vendedor_data['telefono_2'] = telefono_2
            if direccion is not None:
                vendedor_data['direccion'] = direccion

            Vendedor.objects.update_or_create(
                user=instance,
                defaults=vendedor_data,
            )

        return instance