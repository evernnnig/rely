import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface MarcaVehiculo {
  id: number;
  nombre: string;
  pais_origen: number;
  nombre_pais: {
    id: number;
    codigo_iso: string;
    nombre: string;
    continente: string;
  };
}

export interface ModeloVehiculo {
  id: number;
  marca: number;
  marca_detalle: MarcaVehiculo;
  nombre: string;
  tipo: number;
  nombre_tipo: string;
}

export interface Equipamiento {
  id: number;
  version: number;
  descripcion: string;
  nombre_caracteristica: string;
}

export interface VersionVehiculo {
  id: number;
  modelo: number;
  modelo_detalle: ModeloVehiculo;
  nombre_version: string;
  transmision: string;
  motorizacion: string;
  año_modelo: string;
  equipamiento: Equipamiento[];
}

export interface VehiculoInventario {
  id: number;
  version: VersionVehiculo;
  vin: string;
  numero_motor: string | null;
  numero_chasis: string | null;
  color_exterior: string;
  color_interior: string;
  fecha_llegada: string;
  ubicacion_fisica: number | null;
  ubicacion_detalle: {
    id: number;
    nombre: string;
  } | null;
  precio_lista_sugerido: string | null;
  estado: number;
  nombre_estado: string;
  estado_comercial: number;
  estado_comercial_label: string;
  lote_codigo: string | null;
  fecha_llegada_estimada: string | null;
  estado_lote_nombre: string | null;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  constructor(private api: ApiClientService) {}

  private parseList<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (data?.results) return data.results;
    if (data?.data) return data.data;
    return [];
  }

  async getMarcas(): Promise<MarcaVehiculo[]> {
    const res = await this.api.apiFetch('/api/vehiculos/marcas/');
    if (!res.ok) throw new Error('Error al cargar marcas');
    return this.parseList<MarcaVehiculo>(await res.json());
  }

  async getModelos(marcaId?: number): Promise<ModeloVehiculo[]> {
    const url = marcaId ? `/api/vehiculos/modelos/?marca=${marcaId}` : '/api/vehiculos/modelos/';
    const res = await this.api.apiFetch(url);
    if (!res.ok) throw new Error('Error al cargar modelos');
    return this.parseList<ModeloVehiculo>(await res.json());
  }

  async getVersiones(modeloId?: number): Promise<VersionVehiculo[]> {
    const url = modeloId ? `/api/vehiculos/versiones/?modelo=${modeloId}` : '/api/vehiculos/versiones/';
    const res = await this.api.apiFetch(url);
    if (!res.ok) throw new Error('Error al cargar versiones');
    return this.parseList<VersionVehiculo>(await res.json());
  }

  async getInventario(): Promise<VehiculoInventario[]> {
    const res = await this.api.apiFetch('/api/vehiculos/inventario/');
    if (!res.ok) throw new Error('Error al cargar el inventario');
    return res.json() as Promise<VehiculoInventario[]>;
  }

  async getVehiculoById(id: number): Promise<VehiculoInventario> {
    const res = await this.api.apiFetch(`/api/vehiculos/inventario/${id}/`);
    if (!res.ok) throw new Error('Error al cargar el vehículo');
    return res.json() as Promise<VehiculoInventario>;
  }

  async getInventarioReservable(): Promise<VehiculoInventario[]> {
    const res = await this.api.apiFetch('/api/vehiculos/inventario/reservables/');
    if (!res.ok) throw new Error('Error al cargar el inventario');
    return res.json() as Promise<VehiculoInventario[]>;
  }
}