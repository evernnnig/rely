import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const BASE_URL = environment.apiBaseUrl;
const ACCESS_KEY = 'rely_access';
const REFRESH_KEY = 'rely_refresh';

@Injectable({ providedIn: 'root' })
export class ApiClientService {

  saveTokens(access: string, refresh: string): void {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private async tryRefreshToken(): Promise<string | null> {
    const refresh = this.getRefreshToken();
    if (!refresh) return null;

    const res = await fetch(`${BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      this.clearTokens();
      return null;
    }

    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.access);
    return data.access as string;
  }

  async apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      const newToken = await this.tryRefreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      }
    }

    return res;
  }
}
