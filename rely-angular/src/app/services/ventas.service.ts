import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

// ============================================
// INTERFACES PARA EL MÓDULO DE VENTAS (SALES)
// ============================================

// Interfaz para el payload de creación de venta
export interface CreateVentaPayload {
  // Datos del cliente
  first_name: string;
  last_name: string;
  email: string;
  phone1: string;
  phone2: string;
  identificacion: string;
  nacionalidad: string;
  direccion: string;
  estado: string;
  
  // Datos del vehículo
  vehiculo_id: number;
  vehicleModel: string;
  vehicleYear?: number;
  vehicleColor: string;
  price: number;
  
  // Datos de pago
  moneda: string;
  monto_inicial: number;
  tasa_cambio?: number;
  paymentMethod: string;
  entidad_financiera: string;
  reference_number: string;
  fecha_pago: string;
  numero_cuotas?: number;
  numero_cuenta?: string;
  ultimos_digitos_tarjeta?: string;
  url_comprobante?: string;
  
  // Notas
  notes?: string;
}

// Interfaz para la respuesta de creación de venta
export interface VentaCreada {
  id: number;
  codigo_orden: string;
  mensaje: string;
}

// Interfaz para el módulo de reservas
export interface Reserva {
  id: number;
  vehiculo: number;
  vehiculo_vin: string;
  vehiculo_modelo: string;
  cliente: number | null;
  cliente_nombre: string | null;
  vendedor: number | null;
  vendedor_nombre: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  monto_separacion: string | null;
  estado: 'ACTIVA' | 'VENCIDA' | 'CONVERTIDA' | 'CANCELADA';
  notas: string;
  dias_restantes: number;
  orden: number | null;
  orden_codigo: string | null;
}

export interface CreateReservaPayload {
  vehiculo_id: number;
  cliente_id?: number;
  dias?: number;
  monto_separacion?: number;
  notas?: string;
}

// Interfaz para la respuesta de la API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errors?: any;
  detail?: string;
  message?: string;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  constructor(private api: ApiClientService) {}

  /**
   * Crear una nueva venta
   */
  async crearVenta(payload: CreateVentaPayload): Promise<VentaCreada> {
    try {
      console.log('📤 Enviando venta:', payload);
      
      const res = await this.api.apiFetch('/api/ventas/ordenes/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response: ApiResponse<any> = await res.json();
      
      console.log('📥 Respuesta:', response);
      
      if (!res.ok || !response.success) {
        if (response.errors) {
          const firstErrorKey = Object.keys(response.errors)[0];
          const firstError = response.errors[firstErrorKey];
          const message = Array.isArray(firstError) ? firstError[0] : firstError;
          throw new Error(String(message));
        }
        throw new Error(response.detail || 'Error al registrar la venta');
      }

      return {
        id: response.data?.id,
        codigo_orden: response.data?.codigo_orden,
        mensaje: response.message || 'Venta registrada exitosamente'
      };
    } catch (error) {
      console.error('Error en crearVenta:', error);
      throw error;
    }
  }

  async crearReserva(payload: CreateReservaPayload): Promise<Reserva> {
    const res = await this.api.apiFetch('/api/ventas/reservas/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const response: ApiResponse<Reserva> = await res.json();
    if (!res.ok || !response.success) {
      const err = response.errors ? Object.values(response.errors)[0] : null;
      throw new Error(err ? String(Array.isArray(err) ? err[0] : err) : (response.detail || 'Error al crear la reserva'));
    }
    return response.data!;
  }

  async getReservas(estado?: string): Promise<Reserva[]> {
    const url = estado ? `/api/ventas/reservas/?estado=${estado}` : '/api/ventas/reservas/';
    const res = await this.api.apiFetch(url);
    if (!res.ok) throw new Error('Error al cargar reservas');
    const response: ApiResponse<Reserva[]> = await res.json();
    return response.data ?? (response as any).results ?? [];
  }

  async cancelarReserva(id: number): Promise<void> {
    const res = await this.api.apiFetch(`/api/ventas/reservas/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al cancelar la reserva');
  }

  async convertirReserva(reservaId: number, ventaPayload: CreateVentaPayload): Promise<VentaCreada> {
    const res = await this.api.apiFetch(`/api/ventas/reservas/${reservaId}/convertir/`, {
      method: 'POST',
      body: JSON.stringify(ventaPayload),
    });
    const response: ApiResponse<any> = await res.json();
    if (!res.ok || !response.success) {
      const err = response.errors ? Object.values(response.errors)[0] : null;
      throw new Error(err ? String(Array.isArray(err) ? err[0] : err) : (response.detail || 'Error al convertir la reserva'));
    }
    return {
      id: response.data?.id,
      codigo_orden: response.data?.codigo_orden,
      mensaje: response.message || 'Reserva convertida exitosamente',
    };
  }
}