import { Injectable } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

export interface OrdenVenta {
  id: string;
  first_name: string;
  last_name: string;
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

interface OrderRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reference_number: string;
  price: number;
  vehicle_model: string;
  vehicle_year: number | null;
  vehicle_color: string;
  payment_method: string;
  notes: string | null;
  status: string;
  user_id: string | null;
  created_at: string;
}

function mapRowToOrdenVenta(row: OrderRow): OrdenVenta {
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    cliente_nombre: `${row.first_name} ${row.last_name}`,
    cliente_email: row.email,
    cliente_telefono: row.phone,
    referencia: row.reference_number,
    precio: String(row.price),
    modelo_vehiculo: row.vehicle_model,
    year_vehiculo: row.vehicle_year,
    color: row.vehicle_color,
    metodo_pago: row.payment_method,
    notas: row.notes ?? '',
    estado: row.status,
    created_at: row.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  constructor(private supabase: SupabaseClientService) {}

  async getOrders(): Promise<OrdenVenta[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Error al cargar las órdenes');

    return (data as OrderRow[]).map(mapRowToOrdenVenta);
  }

  async createOrder(payload: CreateOrdenPayload): Promise<OrdenVenta> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    const insertData = {
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
      reference_number: payload.reference_number,
      price: payload.price,
      vehicle_model: payload.vehicleModel,
      vehicle_year: payload.vehicleYear ?? null,
      vehicle_color: payload.vehicleColor,
      payment_method: payload.paymentMethod,
      notes: payload.notes ?? null,
      user_id: session?.user?.id ?? null,
    };

    const { data, error } = await this.supabase.client
      .from('orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('El número de referencia ya existe');
      }
      throw new Error('Error al registrar la venta');
    }

    return mapRowToOrdenVenta(data as OrderRow);
  }
}
