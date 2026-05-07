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
  numero_motor: string;
  numero_chasis: string;
  color_exterior: string;
  color_interior: string;
  fecha_llegada: string;
  ubicacion_fisica: number;
  ubicacion_detalle: {
    id: number;
    nombre: string;
  };
  precio_lista_sugerido: string;
  estado: number;
  nombre_estado: string;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  constructor(private api: ApiClientService) {}

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
}