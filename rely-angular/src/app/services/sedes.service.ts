import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface Sede {
  id: number;
  codigo_sede: string;
  nombre: string;
  ciudad: string;
  estado_venezuela: number | null;
  estado_nombre: string | null;
  direccion: string;
  telefono: string | null;
  email: string | null;
  encargado: number | null;
  encargado_nombre: string | null;
  activa: boolean;
  fecha_creacion: string;
  total_vehiculos: number;
}

export interface CreateSedePayload {
  codigo_sede: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  estado_venezuela?: number;
  telefono?: string;
  email?: string;
  encargado?: number;
  activa?: boolean;
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
export class SedesService {
  constructor(private api: ApiClientService) {}

  async getSedes(soloActivas = false): Promise<Sede[]> {
    const url = soloActivas ? '/api/sedes/?activas=1' : '/api/sedes/';
    const res = await this.api.apiFetch(url);
    const body: ApiResponse<Sede[]> = await res.json();
    if (!res.ok || !body.success) throw new Error(body.detail || 'Error al cargar sedes');
    return body.data || [];
  }

  async getSedeById(id: number): Promise<Sede> {
    const res = await this.api.apiFetch(`/api/sedes/${id}/`);
    const body: ApiResponse<Sede> = await res.json();
    if (!res.ok || !body.success || !body.data) throw new Error(body.detail || 'Sede no encontrada');
    return body.data;
  }

  async createSede(payload: CreateSedePayload): Promise<Sede> {
    const res = await this.api.apiFetch('/api/sedes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const body: ApiResponse<Sede> = await res.json();
    if (!res.ok || !body.success || !body.data) {
      const msg = body.errors ? JSON.stringify(body.errors) : (body.detail || 'Error al crear sede');
      throw new Error(msg);
    }
    return body.data;
  }

  async updateSede(id: number, payload: Partial<CreateSedePayload>): Promise<Sede> {
    const res = await this.api.apiFetch(`/api/sedes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const body: ApiResponse<Sede> = await res.json();
    if (!res.ok || !body.success || !body.data) {
      const msg = body.errors ? JSON.stringify(body.errors) : (body.detail || 'Error al actualizar sede');
      throw new Error(msg);
    }
    return body.data;
  }

  async deleteSede(id: number): Promise<void> {
    const res = await this.api.apiFetch(`/api/sedes/${id}/`, { method: 'DELETE' });
    const body: ApiResponse<null> = await res.json();
    if (!res.ok || !body.success) throw new Error(body.detail || 'Error al eliminar sede');
  }
}
