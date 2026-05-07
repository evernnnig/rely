import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ApiClientService } from './api-client.service';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string | null;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiClientService, private router: Router) {}

  async login(email: string, password: string): Promise<AuthUser> {
    const res = await this.api.apiFetch('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      const message =
        data.non_field_errors?.[0] ||
        data.detail ||
        'Credenciales inválidas';
      throw new Error(message);
    }

    this.api.saveTokens(data.access, data.refresh);
    const user = data.user as AuthUser;
    this.currentUserSubject.next(user);
    return user;
  }

  async logout(): Promise<void> {
    const refresh = this.api.getRefreshToken();
    try {
      await this.api.apiFetch('/api/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Si falla el logout en el servidor igual limpiamos localmente
    } finally {
      this.api.clearTokens();
      this.currentUserSubject.next(null);
      this.router.navigate(['/']);
    }
  }

  isAuthenticated(): boolean {
    return !!this.api.getAccessToken();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const res = await this.api.apiFetch('/api/auth/me/');
      if (!res.ok) {
        this.api.clearTokens();
        this.currentUserSubject.next(null);
        return null;
      }
      const user = (await res.json()) as AuthUser;
      this.currentUserSubject.next(user);
      return user;
    } catch {
      return null;
    }
  }

  getCurrentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Retorna true si el usuario tiene alguno de los roles indicados.
   * Administrador siempre retorna true sin importar qué roles se pidan.
   */
  hasRole(...roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    if (user.role === 'Administrador') return true;
    return roles.includes(user.role ?? '');
  }
}
