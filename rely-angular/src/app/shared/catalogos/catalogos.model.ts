// Interfaz base para cualquier catálogo
export interface BaseItem {
  id?: number;
  nombre: string;
  activo?: boolean;
}

// Interfaces específicas
export interface Pais {
    id: number;
    codigo_iso: string;
    nombre: string;
}

export interface Estado extends BaseItem {
  pais_id: number;
}

export interface Ciudad extends BaseItem {
  estado_id: number;
}