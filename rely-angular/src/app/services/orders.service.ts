// services/orders.service.ts
import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

// ============================================================
// INTERFACES
// ============================================================

export interface TransaccionPago {
  id: number;
  monto: string;
  monto_inicial: string;
  monto_restante: string;
  moneda: string;
  metodo_pago: number;
  referencia: string;
  fecha_pago: string;
  estado_pago: number;
}

interface OrdenVentaAPI {
  id: number;
  codigo_orden: string;
  precio_final_venta: string;
  fecha_creacion: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  vendedor_nombre: string;
  vehiculo_vin: string;
  vehiculo_color: string;
  vehiculo_modelo: string;
  transaccion_info: TransaccionPago | null;
  estado_orden: number;
}

export interface OrdenVenta {
  id: number;
  referencia: string;
  precio: string;
  estado: string;
  estadoId: number;
  created_at: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  vendedor_nombre: string;
  vin_vehiculo: string;
  color_vehiculo: string;
  modelo_vehiculo: string;
  transaccion: TransaccionPago | null;
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

// ============================================================
// INTERFACES PARA DETALLE COMPLETO
// ============================================================

export interface OrdenDetalleCompleta {
  id: number;
  codigo_orden: string;
  precio_final_venta: string;
  fecha_creacion: string;
  cliente_info: ClienteInfo | null;
  vendedor_info: VendedorInfo | null;
  vehiculo_info: VehiculoInfo | null;
  transaccion: TransaccionDetalle | null;
  pagos_parciales: PagoParcial[];
  notificaciones: Notificacion[];
  documentos: DocumentoOrden[];
  historial_estados: HistorialEstado[];
  estado_orden: number;
  estado_orden_id: number;
}

export interface ClienteInfo {
  id: number;
  nombre: string;
  email: string;
  telefono_1: string;
  telefono_2: string;
  identificacion: string;
  direccion: string;
  nacionalidad_id?: number;
  estado_id?: number;
}

export interface VendedorInfo {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  identificacion: string;
}

export interface VehiculoInfo {
  id: number;
  vin: string;
  color_exterior: string;
  color_interior: string | null;
  numero_motor: string;
  numero_chasis: string;
  precio_lista: string;
  estado_id: number;
  ubicacion: string;
  version?: {
    nombre: string;
    motorizacion: string;
    transmision: string;
    año_modelo: string;
  };
  modelo?: {
    nombre: string;
    marca: string;
  };
}

export interface TransaccionDetalle {
  id: number;
  monto_total: string;
  monto_inicial: string;
  monto_restante: string;
  moneda: string;
  tasa_cambio: string | null;
  metodo_pago_id: number;
  metodo_pago_nombre: string;
  referencia: string;
  fecha_pago: string;
  estado_pago_id: number;
  estado_pago_nombre: string;
  entidad_financiera_id: number | null;
  entidad_financiera_nombre: string | null;
  porcentaje_pagado: number;
}

export interface PagoParcial {
  id: number;
  numero_cuota: number;
  monto_pagado: string;
  fecha_pago: string;
  fecha_vencimiento: string | null;
  estado: number;
  estado_nombre: string;
  comprobante_url: string | null;
  notas: string | null;
}

export interface Notificacion {
  id: number;
  tipo: string;
  asunto: string;
  mensaje: string;
  fecha_envio: string;
  enviado_por_nombre: string;
  estado_envio: string;
}

export interface DocumentoOrden {
  id: number;
  tipo_documento: string;
  nombre: string;
  url_archivo: string;
  fecha_subida: string;
  subido_por_nombre: string;
}

export interface HistorialEstado {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  fecha_cambio: string;
  responsable: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errors?: any;
  detail?: string;
  message?: string;
  total?: number;
}

export interface EstadoOrden {
  id: number;
  nombre: string;
}

// ============================================================
// CONSTANTES
// ============================================================

const ESTADO_ORDEN_LABELS: Record<number, string> = {
  1: 'Pendiente',
  2: 'En Proceso',
  3: 'Aprobada',
  4: 'Rechazada',
  5: 'Completada',
  6: 'Cancelada',
};

const ESTADO_PAGO_LABELS: Record<number, string> = {
  1: 'Pendiente',
  2: 'Pagado',
  3: 'Verificado',
};

const METODO_PAGO_LABELS: Record<number, string> = {
  1: 'Efectivo',
  2: 'Transferencia Bancaria',
  3: 'Financiamiento',
  4: 'Tarjeta de Crédito',
  5: 'Tarjeta de Débito',
  6: 'Cheque',
  7: 'Criptomoneda',
  8: 'Otro',
};

// ============================================================
// SERVICIO
// ============================================================

@Injectable({ providedIn: 'root' })
export class VentasService {
  constructor(private api: ApiClientService) {}

  // ──────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────

  getEstadoOrdenLabel(estadoId: number): string {
    return ESTADO_ORDEN_LABELS[estadoId] || 'Desconocido';
  }

  getEstadoPagoLabel(estadoId: number): string {
    return ESTADO_PAGO_LABELS[estadoId] || 'Desconocido';
  }

  getMetodoPagoLabel(metodoId: number): string {
    return METODO_PAGO_LABELS[metodoId] || `Método ${metodoId}`;
  }

  async getEstadosOrden(): Promise<EstadoOrden[]> {
    const res = await this.api.apiFetch('/api/ventas/estados-orden/');
    const response: ApiResponse<EstadoOrden[]> = await res.json();
    if (!res.ok || !response.success) {
      throw new Error(response.detail || 'Error al cargar estados de orden');
    }
    return response.data || [];
}

  private mapOrden(apiOrden: OrdenVentaAPI): OrdenVenta {
    return {
      id: apiOrden.id,
      referencia: apiOrden.codigo_orden,
      precio: apiOrden.precio_final_venta,
      estado: ESTADO_ORDEN_LABELS[apiOrden.estado_orden] || 'Pendiente',
      estadoId: apiOrden.estado_orden,
      created_at: apiOrden.fecha_creacion,
      cliente_nombre: apiOrden.cliente_nombre,
      cliente_email: apiOrden.cliente_email,
      cliente_telefono: apiOrden.cliente_telefono,
      vendedor_nombre: apiOrden.vendedor_nombre,
      vin_vehiculo: apiOrden.vehiculo_vin,
      color_vehiculo: apiOrden.vehiculo_color,
      modelo_vehiculo: apiOrden.vehiculo_modelo,
      transaccion: apiOrden.transaccion_info,
    };
  }

  // ──────────────────────────────────────────────
  // LISTA DE ÓRDENES
  // ──────────────────────────────────────────────

  async getOrders(): Promise<OrdenVenta[]> {
    const res = await this.api.apiFetch('/api/ventas/ordenes/');
    const response: ApiResponse<OrdenVentaAPI[]> = await res.json();
    if (!res.ok || !response.success) {
      throw new Error(response.detail || 'Error al cargar las órdenes');
    }
    return (response.data || []).map(item => this.mapOrden(item));
  }

  async getOrderById(id: number): Promise<OrdenVenta> {
    const res = await this.api.apiFetch(`/api/ventas/ordenes/${id}/`);
    const response: ApiResponse<OrdenVentaAPI> = await res.json();
    if (!res.ok || !response.success || !response.data) {
      throw new Error(response.detail || 'Orden no encontrada');
    }
    return this.mapOrden(response.data);
  }

  async updateOrderStatus(id: number, estadoOrden: number): Promise<OrdenVenta> {
    const res = await this.api.apiFetch(`/api/ventas/ordenes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_orden: estadoOrden }),
    });
    const response: ApiResponse<OrdenVentaAPI> = await res.json();
    if (!res.ok || !response.success || !response.data) {
      throw new Error(response.detail || 'Error al actualizar la orden');
    }
    return this.mapOrden(response.data);
  }

  async createOrder(payload: CreateOrdenPayload): Promise<OrdenVenta> {
    const res = await this.api.apiFetch('/api/ventas/ordenes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const message = data.reference_number?.[0] ||
        data.non_field_errors?.[0] ||
        data.detail ||
        'Error al registrar la venta';
      throw new Error(message);
    }
    return data as OrdenVenta;
  }

  // ──────────────────────────────────────────────
  // DETALLE COMPLETO
  // ──────────────────────────────────────────────

  async getOrdenDetalleCompleta(id: number): Promise<OrdenDetalleCompleta> {
    const res = await this.api.apiFetch(`/api/ventas/ordenes/${id}/completo/`);
    const response: ApiResponse<OrdenDetalleCompleta> = await res.json();
    if (!res.ok || !response.success || !response.data) {
      throw new Error(response.detail || 'Error al cargar detalle de la orden');
    }
    return response.data;
  }

  // ──────────────────────────────────────────────
  // PAGOS PARCIALES
  // ──────────────────────────────────────────────

  async registrarPagoParcial(ordenId: number, payload: {
    numero_cuota: number;
    monto_pagado: number;
    fecha_pago?: string;
    fecha_vencimiento?: string;
    comprobante_url?: string;
    notas?: string;
  }): Promise<PagoParcial> {
    const res = await this.api.apiFetch(`/api/ventas/ordenes/${ordenId}/pago-parcial/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const response = await res.json();
    if (!res.ok || !response.success) {
      throw new Error(response.detail || 'Error al registrar pago');
    }
    return response.data;
  }

  async actualizarEstadoPagoIndividual(pagoId: number, estadoId: number): Promise<any> {
    const res = await this.api.apiFetch(`/api/ventas/pagos/${pagoId}/estado/`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_id: estadoId }),
    });
    const response = await res.json();
    if (!res.ok || !response.success) {
      throw new Error(response.detail || 'Error al actualizar estado');
    }
    return response;
  }

  async actualizarEstadoPago(ordenId: number, estadoPagoId: number): Promise<any> {
    const res = await this.api.apiFetch(`/api/ventas/ordenes/${ordenId}/actualizar-estado-pago/`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_pago_id: estadoPagoId }),
    });
    const response = await res.json();
    if (!res.ok || !response.success) {
      throw new Error(response.detail || 'Error al actualizar estado de pago');
    }
    return response;
  }

  // ──────────────────────────────────────────────
  // NOTIFICACIONES
  // ──────────────────────────────────────────────

  async enviarNotificacion(ordenId: number, payload: {
    tipo: string;
    asunto: string;
    mensaje: string;
  }): Promise<Notificacion> {
    const res = await this.api.apiFetch(`/api/ventas/ordenes/${ordenId}/notificar/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const response = await res.json();
    if (!res.ok || !response.success) {
      throw new Error(response.detail || 'Error al enviar notificación');
    }
    return response.data;
  }

  // ──────────────────────────────────────────────
  // DOCUMENTOS
  // ──────────────────────────────────────────────

  async subirDocumento(ordenId: number, payload: {
    tipo_documento: string;
    nombre: string;
    url_archivo: string;
  }): Promise<DocumentoOrden> {
    const res = await this.api.apiFetch(`/api/ventas/ordenes/${ordenId}/subir-documento/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const response = await res.json();
    if (!res.ok || !response.success) {
      throw new Error(response.detail || 'Error al subir documento');
    }
    return response.data;
  }
}