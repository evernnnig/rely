from django.db import transaction
from django.utils import timezone
from datetime import timedelta, date


# ─── Constantes de estado comercial ───────────────────────────────────────────
EC_DISPONIBLE = 1
EC_RESERVADO = 2
EC_VENDIDO = 3
EC_NO_DISPONIBLE = 4
EC_MANTENIMIENTO = 5

DURACION_RESERVA_DIAS_DEFAULT = 7


# ─── Excepciones de dominio ───────────────────────────────────────────────────
class VehiculoNoDisponible(Exception):
    pass


class ReservaInvalida(Exception):
    pass


# ─── Helpers internos ─────────────────────────────────────────────────────────

def _expirar_reservas_vencidas():
    """Marca como VENCIDA toda reserva ACTIVA cuya fecha_vencimiento ya pasó
    y restaura el estado_comercial del vehículo a DISPONIBLE.
    Llamar sin transaction.atomic propio — el caller lo provee cuando sea necesario."""
    from .models import Reserva
    from apps.vehiculos.models import VehiculoNuevo

    ahora = timezone.now()
    vencidas = (
        Reserva.objects
        .select_related('vehiculo')
        .select_for_update(skip_locked=True)
        .filter(estado=Reserva.ESTADO_ACTIVA, fecha_vencimiento__lt=ahora)
    )
    for reserva in vencidas:
        reserva.estado = Reserva.ESTADO_VENCIDA
        reserva.save(update_fields=['estado'])
        v = reserva.vehiculo
        if v.estado_comercial == EC_RESERVADO:
            v.estado_comercial = EC_DISPONIBLE
            v.save(update_fields=['estado_comercial'])


def _get_vehiculo_bloqueado(vehiculo_id):
    """Obtiene el vehículo con SELECT FOR UPDATE para operaciones transaccionales."""
    from apps.vehiculos.models import VehiculoNuevo
    return VehiculoNuevo.objects.select_for_update().get(id=vehiculo_id)


def _get_o_crear_cliente(cliente_data):
    from apps.clientes.models import Cliente
    cliente, _ = Cliente.objects.update_or_create(
        identificacion=cliente_data['identificacion'],
        defaults={
            'nombre_completo': f"{cliente_data['first_name']} {cliente_data['last_name']}",
            'correo': cliente_data['email'],
            'telefono_1': cliente_data['phone1'],
            'telefono_2': cliente_data.get('phone2', ''),
            'nacionalidad_id': cliente_data.get('nacionalidad'),
            'direccion': cliente_data['direccion'],
            'estado_id': cliente_data.get('estado'),
        }
    )
    return cliente


def _crear_plan_cuotas(orden, transaccion, monto_total, monto_inicial, numero_cuotas, fecha_inicio):
    from .models import PlanPago, CuotaPlan
    monto_restante = float(monto_total) - float(monto_inicial)
    monto_por_cuota = round(monto_restante / numero_cuotas, 2)

    plan = PlanPago.objects.create(
        orden=orden,
        tipo=PlanPago.TIPO_CUOTAS,
        total_acordado=monto_total,
        cuotas_totales=numero_cuotas,
        periodicidad='MENSUAL',
        fecha_inicio=fecha_inicio,
        estado='ACTIVO',
    )
    for i in range(1, numero_cuotas + 1):
        CuotaPlan.objects.create(
            plan=plan,
            numero_cuota=i,
            monto_esperado=monto_por_cuota,
            fecha_vencimiento=fecha_inicio + timedelta(days=30 * i),
            estado='PENDIENTE',
        )
    return plan


# ─── Operaciones públicas ─────────────────────────────────────────────────────

@transaction.atomic
def crear_reserva(vehiculo_id, vendedor, cliente=None, monto_separacion=None,
                  notas='', dias=DURACION_RESERVA_DIAS_DEFAULT):
    """
    Bloquea un vehículo DISPONIBLE y crea una Reserva ACTIVA.
    Lanza VehiculoNoDisponible si el vehículo no está disponible.
    """
    from .models import Reserva

    _expirar_reservas_vencidas()

    vehiculo = _get_vehiculo_bloqueado(vehiculo_id)

    if vehiculo.estado_comercial != EC_DISPONIBLE:
        labels = dict(vehiculo.ESTADO_COMERCIAL_CHOICES)
        raise VehiculoNoDisponible(
            f'El vehículo {vehiculo.vin} está en estado '
            f'"{labels.get(vehiculo.estado_comercial, vehiculo.estado_comercial)}" '
            f'y no puede reservarse.'
        )

    reserva = Reserva.objects.create(
        vehiculo=vehiculo,
        cliente=cliente,
        vendedor=vendedor,
        fecha_vencimiento=timezone.now() + timedelta(days=dias),
        monto_separacion=monto_separacion,
        notas=notas,
        estado=Reserva.ESTADO_ACTIVA,
    )
    vehiculo.estado_comercial = EC_RESERVADO
    vehiculo.save(update_fields=['estado_comercial'])
    return reserva


@transaction.atomic
def cancelar_reserva(reserva_id):
    """
    Cancela una Reserva ACTIVA y restaura el vehículo a DISPONIBLE.
    """
    from .models import Reserva

    reserva = (
        Reserva.objects
        .select_for_update()
        .select_related('vehiculo')
        .get(id=reserva_id)
    )
    if reserva.estado != Reserva.ESTADO_ACTIVA:
        raise ReservaInvalida(
            f'La reserva ya está en estado {reserva.estado} y no puede cancelarse.'
        )

    reserva.estado = Reserva.ESTADO_CANCELADA
    reserva.save(update_fields=['estado'])

    vehiculo = reserva.vehiculo
    if vehiculo.estado_comercial == EC_RESERVADO:
        vehiculo.estado_comercial = EC_DISPONIBLE
        vehiculo.save(update_fields=['estado_comercial'])

    return reserva


@transaction.atomic
def crear_venta_directa(vehiculo_id, cliente_data, pago_data, vendedor):
    """
    Crea una OrdenVenta de forma completamente atómica.
    Acepta vehículos DISPONIBLES o RESERVADOS.
    Lanza VehiculoNoDisponible si el estado no permite venta.
    """
    from .models import OrdenVenta, TransaccionPago, HistorialEstadosOrden
    from apps.catalogos.models import CtEstadoPago

    _expirar_reservas_vencidas()

    vehiculo = _get_vehiculo_bloqueado(vehiculo_id)

    if vehiculo.estado_comercial not in [EC_DISPONIBLE, EC_RESERVADO]:
        labels = dict(vehiculo.ESTADO_COMERCIAL_CHOICES)
        raise VehiculoNoDisponible(
            f'El vehículo {vehiculo.vin} está en estado '
            f'"{labels.get(vehiculo.estado_comercial, vehiculo.estado_comercial)}" '
            f'y no puede venderse.'
        )

    cliente = _get_o_crear_cliente(cliente_data)

    orden = OrdenVenta.objects.create(
        codigo_orden=pago_data['reference_number'],
        vehiculo=vehiculo,
        cliente=cliente,
        vendedor=vendedor,
        precio_final_venta=pago_data['price'],
        estado_orden_id=1,
    )

    monto_total = pago_data['price']
    monto_inicial = pago_data['monto_inicial']

    entidad_id = pago_data.get('entidad_financiera') or None
    if entidad_id == '':
        entidad_id = None

    transaccion = TransaccionPago.objects.create(
        orden_venta=orden,
        monto=monto_total,
        monto_inicial=monto_inicial,
        monto_restante=float(monto_total) - float(monto_inicial),
        moneda=pago_data['moneda'],
        tasa_cambio=pago_data.get('tasa_cambio'),
        metodo_pago=int(pago_data['paymentMethod']),
        referencia=pago_data['reference_number'],
        fecha_pago=pago_data['fecha_pago'],
        estado_pago=CtEstadoPago.objects.get(id=1),
        entidad_financiera_id=entidad_id,
    )

    numero_cuotas = pago_data.get('numero_cuotas')
    if numero_cuotas and int(numero_cuotas) > 1:
        fecha_inicio = pago_data.get('fecha_pago')
        if isinstance(fecha_inicio, str):
            from datetime import date as d
            fecha_inicio = date.fromisoformat(fecha_inicio)
        _crear_plan_cuotas(orden, transaccion, monto_total, monto_inicial,
                           int(numero_cuotas), fecha_inicio or date.today())

    HistorialEstadosOrden.objects.create(
        orden=orden,
        estado_anterior=None,
        estado_nuevo_id=1,
        responsable=vendedor,
    )

    vehiculo.estado_comercial = EC_VENDIDO
    vehiculo.save(update_fields=['estado_comercial'])

    return orden


@transaction.atomic
def convertir_reserva_a_venta(reserva_id, cliente_data, pago_data, vendedor):
    """
    Convierte una Reserva ACTIVA en OrdenVenta.
    La reserva pasa a estado CONVERTIDA y se vincula a la orden creada.
    """
    from .models import Reserva

    reserva = (
        Reserva.objects
        .select_for_update()
        .select_related('vehiculo')
        .get(id=reserva_id)
    )

    if reserva.estado != Reserva.ESTADO_ACTIVA:
        raise ReservaInvalida(
            f'La reserva está en estado {reserva.estado} y no puede convertirse.'
        )
    if timezone.now() > reserva.fecha_vencimiento:
        reserva.estado = Reserva.ESTADO_VENCIDA
        reserva.save(update_fields=['estado'])
        reserva.vehiculo.estado_comercial = EC_DISPONIBLE
        reserva.vehiculo.save(update_fields=['estado_comercial'])
        raise ReservaInvalida('La reserva ha vencido y fue liberada.')

    # El vehículo ya está RESERVADO; crear_venta_directa lo acepta
    orden = crear_venta_directa(
        vehiculo_id=reserva.vehiculo_id,
        cliente_data=cliente_data,
        pago_data=pago_data,
        vendedor=vendedor,
    )

    reserva.orden = orden
    reserva.estado = Reserva.ESTADO_CONVERTIDA
    reserva.save(update_fields=['orden', 'estado'])

    return orden


def expirar_reservas_vencidas_publico():
    """Wrapper público para disparar desde un endpoint o management command."""
    with transaction.atomic():
        _expirar_reservas_vencidas()
