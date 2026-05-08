import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface CtEstadoLote {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  orden: number;
  color_hex: string;
}

export interface HistorialEstadoLote {
  id: number;
  estado_anterior_nombre: string | null;
  estado_nuevo_nombre: string;
  estado_nuevo_color: string;
  fecha_cambio: string;
  responsable_nombre: string | null;
  ubicacion: string;
  notas: string;
}

export interface VehiculoLote {
  id: number;
  vin: string;
  numero_motor: string;
  numero_chasis: string;
  color_exterior: string;
  color_interior: string;
  precio_lista_sugerido: number | null;
  nombre_estado: string | null;
  marca: string | null;
  modelo: string | null;
  version: string | null;
}

export interface LoteImportacion {
  id: number;
  codigo_lote: string;
  proveedor: string;
  pais_origen: number;
  pais_origen_nombre: string;
  puerto_origen: string;
  puerto_destino: string;
  sede_destino: number;
  sede_destino_nombre: string;
  sede_destino_ciudad: string;
  estado_lote: number;
  estado_lote_nombre: string;
  estado_lote_color: string;
  estado_lote_orden: number;
  total_unidades: number;
  unidades_registradas: number;
  unidades_disponibles: number;
  fecha_orden_compra: string | null;
  fecha_embarque_estimado: string | null;
  fecha_embarque_real: string | null;
  fecha_llegada_estimada: string | null;
  fecha_llegada_real: string | null;
  eta_dias: number | null;
  dias_en_transito: number | null;
  numero_bl: string | null;
  numero_contenedores: number | null;
  agente_aduanal: string | null;
  valor_fob_usd: string | null;
  notas: string | null;
  creado_por_nombre: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  historial: HistorialEstadoLote[];
  vehiculos: VehiculoLote[];
}

export interface CreateLotePayload {
  codigo_lote: string;
  proveedor: string;
  pais_origen: number;
  puerto_origen: string;
  puerto_destino: string;
  sede_destino: number;
  total_unidades: number;
  fecha_orden_compra?: string;
  fecha_embarque_estimado?: string;
  fecha_llegada_estimada?: string;
  numero_contenedores?: number;
  valor_fob_usd?: number;
  notas?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errors?: any;
  detail?: string;
  message?: string;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class LotesService {
  constructor(private api: ApiClientService) {}

  async getEstados(): Promise<CtEstadoLote[]> {
    const res = await this.api.apiFetch('/api/lotes/estados/');
    const body: ApiResponse<CtEstadoLote[]> = await res.json();
    if (!res.ok || !body.success) throw new Error(body.detail || 'Error al cargar estados');
    return body.data || [];
  }

  async getLotes(filtros?: { estado?: string; sede?: number }): Promise<LoteImportacion[]> {
    let url = '/api/lotes/';
    const params: string[] = [];
    if (filtros?.estado) params.push(`estado=${filtros.estado}`);
    if (filtros?.sede) params.push(`sede=${filtros.sede}`);
    if (params.length) url += '?' + params.join('&');

    const res = await this.api.apiFetch(url);
    const body: ApiResponse<LoteImportacion[]> = await res.json();
    if (!res.ok || !body.success) throw new Error(body.detail || 'Error al cargar lotes');
    return body.data || [];
  }

  async getLoteById(id: number): Promise<LoteImportacion> {
    const res = await this.api.apiFetch(`/api/lotes/${id}/`);
    const body: ApiResponse<LoteImportacion> = await res.json();
    if (!res.ok || !body.success || !body.data) throw new Error(body.detail || 'Lote no encontrado');
    return body.data;
  }

  async createLote(payload: CreateLotePayload): Promise<LoteImportacion> {
    const res = await this.api.apiFetch('/api/lotes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const body: ApiResponse<LoteImportacion> = await res.json();
    if (!res.ok || !body.success || !body.data) {
      const msg = body.errors ? JSON.stringify(body.errors) : (body.detail || 'Error al crear lote');
      throw new Error(msg);
    }
    return body.data;
  }

  async getVehiculos(loteId: number): Promise<any[]> {
    const res = await this.api.apiFetch(`/api/lotes/${loteId}/vehiculos/`);
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.detail || 'Error al cargar vehículos');
    return body.data || [];
  }

  async addVehiculos(loteId: number, vehiculos: any[]): Promise<{ message: string; vins_creados: string[] }> {
    const res = await this.api.apiFetch(`/api/lotes/${loteId}/vehiculos/`, {
      method: 'POST',
      body: JSON.stringify({ vehiculos }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(body.detail || 'Error al guardar vehículos');
    return body;
  }

  async avanzarEstado(id: number, estadoLoteId: number, notas?: string, ubicacion?: string): Promise<LoteImportacion> {
    const res = await this.api.apiFetch(`/api/lotes/${id}/estado/`, {
      method: 'POST',
      body: JSON.stringify({ estado_lote_id: estadoLoteId, notas: notas || '', ubicacion: ubicacion || '' }),
    });
    const body: ApiResponse<LoteImportacion> = await res.json();
    if (!res.ok || !body.success || !body.data) throw new Error(body.detail || 'Error al cambiar estado');
    return body.data;
  }
}
