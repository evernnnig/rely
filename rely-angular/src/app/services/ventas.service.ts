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
}