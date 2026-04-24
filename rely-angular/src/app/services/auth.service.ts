import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseClientService } from './supabase-client.service';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private supabase: SupabaseClientService) {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.currentUserSubject.next({
          id: session.user.id,
          email: session.user.email ?? '',
        });
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Credenciales inválidas'
          : error.message
      );
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? '',
    };
    this.currentUserSubject.next(user);
    return user;
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.supabase.auth.getSession();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email ?? '',
    };
    this.currentUserSubject.next(user);
    return user;
  }

  getCurrentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }
}
