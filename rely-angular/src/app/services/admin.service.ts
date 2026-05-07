import { Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  // Perfil vendedor (requerido cuando role es Vendedor o Administrador)
  telefono_1?: string;
  telefono_2?: string;
  direccion?: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
  // Perfil vendedor
  telefono_1?: string;
  telefono_2?: string;
  direccion?: string;
}

export interface UserItem {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string | null;
  is_active: boolean;
  // Perfil vendedor (puede estar vacío si el usuario no tiene perfil)
  telefono_1: string;
  telefono_2: string;
  direccion: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiClientService) {}

  async getRoles(): Promise<string[]> {
    const res = await this.api.apiFetch('/api/auth/roles/');
    if (!res.ok) throw new Error('Error al cargar los roles');
    const data = await res.json();
    return data.roles as string[];
  }

  async getUsers(): Promise<UserItem[]> {
    const res = await this.api.apiFetch('/api/auth/users/');
    if (!res.ok) throw new Error('Error al cargar los usuarios');
    return (await res.json()) as UserItem[];
  }

  async createUser(payload: CreateUserPayload): Promise<void> {
    const res = await this.api.apiFetch('/api/auth/users/create/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const firstKey = Object.keys(data)[0];
      const firstError = data[firstKey];
      throw new Error(Array.isArray(firstError) ? firstError[0] : 'Error al crear el usuario');
    }
  }

  async updateUser(id: number, payload: UpdateUserPayload): Promise<UserItem> {
    const res = await this.api.apiFetch(`/api/auth/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const firstKey = Object.keys(data)[0];
      const firstError = data[firstKey];
      throw new Error(Array.isArray(firstError) ? firstError[0] : 'Error al actualizar el usuario');
    }
    return data as UserItem;
  }
}