import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiClientService } from './api-client.service';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiClientService) {}

  async login(email: string, password: string): Promise<AuthUser> {
    const res = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    } finally {
      this.api.clearTokens();
      this.currentUserSubject.next(null);
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
        return null;
      }
      const user = await res.json() as AuthUser;
      this.currentUserSubject.next(user);
      return user;
    } catch {
      return null;
    }
  }

  getCurrentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }
}
