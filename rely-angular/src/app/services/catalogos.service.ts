import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface Pais {
  id: number;
  codigo_iso: string;
  nombre: string;
  continente: string;
}

export interface EstadoVenezuela {
  id: number;
  nombre: string;
  codigo_iso: string;
  pais_id: number;
}

export interface EntidadFinanciera {
  id: number;
  nombre: string;
  pais_id: number;
  codigo_identificador: string;
}

export interface EstadoOrden {
  id: number;
  estado_orden: string;
}

export interface EstadoVehiculo {
  id: number;
  estado: string;
}

export interface MetodoPago {
  id: number;
  nombre: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  
  private paises: Pais[] = [];
  private estadosVenezuela: EstadoVenezuela[] = [];
  private entidadesFinancieras: EntidadFinanciera[] = [];
   private metodosPago: MetodoPago[] = [];

  constructor(private api: ApiClientService) {}

  /**
   * Obtener lista de países
   */
  async getPaises(): Promise<Pais[]> {
    if (this.paises.length > 0) {
      return this.paises; // Usar caché
    }
    
    try {
      const res = await this.api.apiFetch('/api/catalogos/pais/');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        this.paises = data;
      } else if (data.results) {
        this.paises = data.results;
      } else if (data.data) {
        this.paises = data.data;
      }
      
      return this.paises;
    } catch (error) {
      console.error('Error cargando países:', error);
      return [];
    }
  }

  /**
   * Obtener estados de Venezuela
   */
  async getEstadosVenezuela(): Promise<EstadoVenezuela[]> {
    if (this.estadosVenezuela.length > 0) {
      return this.estadosVenezuela;
    }
    
    try {
      const res = await this.api.apiFetch('/api/catalogos/estado-venezuela/');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        this.estadosVenezuela = data;
      } else if (data.results) {
        this.estadosVenezuela = data.results;
      } else if (data.data) {
        this.estadosVenezuela = data.data;
      }
      
      return this.estadosVenezuela;
    } catch (error) {
      console.error('Error cargando estados:', error);
      return [];
    }
  }

  /**
   * Obtener entidades financieras
   */
  async getEntidadesFinancieras(): Promise<EntidadFinanciera[]> {
    if (this.entidadesFinancieras.length > 0) {
      return this.entidadesFinancieras;
    }
    
    try {
      const res = await this.api.apiFetch('/api/catalogos/entidad-financiera/');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        this.entidadesFinancieras = data;
      } else if (data.results) {
        this.entidadesFinancieras = data.results;
      } else if (data.data) {
        this.entidadesFinancieras = data.data;
      }
      
      return this.entidadesFinancieras;
    } catch (error) {
      console.error('Error cargando entidades financieras:', error);
      return [];
    }
  }

  /**
   * Obtener métodos de pago desde el catálogo
   */
  async getMetodosPago(): Promise<MetodoPago[]> {
    if (this.metodosPago.length > 0) {
      return this.metodosPago;
    }
    
    try {
      const res = await this.api.apiFetch('/api/catalogos/metodo-pago/');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        this.metodosPago = data;
      } else if (data.results) {
        this.metodosPago = data.results;
      } else if (data.data) {
        this.metodosPago = data.data;
      }
      
      console.log('✅ Métodos de pago cargados:', this.metodosPago.length);
      return this.metodosPago;
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
      return [];
    }
  }

  /**
   * Limpiar caché (útil al hacer logout)
   */
  clearCache(): void {
    this.paises = [];
    this.estadosVenezuela = [];
    this.entidadesFinancieras = [];
    this.metodosPago = [];
  }
}