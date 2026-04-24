import { apiFetch } from './apiClient';

export interface OrdenVenta {
  id: number;
  vendedor_nombre: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  referencia: string;
  precio: string;
  modelo_vehiculo: string;
  year_vehiculo: number | null;
  color: string;
  metodo_pago: string;
  notas: string;
  estado: string;
  created_at: string;
}

export interface CreateOrdenPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reference_number: string;
  price: number;
  vehicleModel: string;
  vehicleYear?: number;
  vehicleColor: string;
  paymentMethod: string;
  notes?: string;
}

export async function getOrders(): Promise<OrdenVenta[]> {
  const res = await apiFetch('/api/ventas/ordenes/');
  if (!res.ok) throw new Error('Error al cargar las órdenes');
  return res.json() as Promise<OrdenVenta[]>;
}

export async function createOrder(payload: CreateOrdenPayload): Promise<OrdenVenta> {
  const res = await apiFetch('/api/ventas/ordenes/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      data.reference_number?.[0] ||
      data.non_field_errors?.[0] ||
      data.detail ||
      'Error al registrar la venta';
    throw new Error(message);
  }

  return data as OrdenVenta;
}
