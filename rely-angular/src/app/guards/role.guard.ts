import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return false;
    }

    // Si el usuario ya está en memoria lo usamos, si no lo pedimos al backend
    let user = this.authService.getCurrentUserValue();
    if (!user) {
      user = await this.authService.getCurrentUser();
    }

    if (!user) {
      this.router.navigate(['/']);
      return false;
    }

    // Administrador bypasea todo
    if (user.role === 'Administrador') return true;

    const allowedRoles: string[] = route.data['roles'] || [];
    if (allowedRoles.includes(user.role ?? '')) return true;

    // Sin permiso → regresa al inicio
    this.router.navigate(['/']);
    return false;
  }
}
