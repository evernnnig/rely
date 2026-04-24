import { apiFetch, saveTokens, clearTokens, getAccessToken, getRefreshToken } from './apiClient';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
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

  saveTokens(data.access, data.refresh);
  return data.user as AuthUser;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    await apiFetch('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
  } finally {
    // Siempre limpiar ambos tokens — el backend confirma con clear_tokens: true
    // pero lo hacemos aquí también para garantizar seguridad inmediata
    clearTokens();
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await apiFetch('/api/auth/me/');
    if (!res.ok) {
      clearTokens();
      return null;
    }
    return await res.json() as AuthUser;
  } catch {
    return null;
  }
}
