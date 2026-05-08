import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ViewType = 'home' | 'sales' | 'orders' | 'reservas' | 'tracking' | 'admin';

@Component({
  standalone: false,
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
})
export class NavigationComponent {
  @Input() currentView: ViewType = 'home';
  @Input() isAuthenticated = false;
  @Input() userEmail = '';
  @Input() userRole: string | null = null;
  @Output() viewChange = new EventEmitter<ViewType>();
  @Output() login = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  isOpen = false;

  canAccess(view: 'sales' | 'orders' | 'reservas' | 'tracking'): boolean {
    if (!this.isAuthenticated) return false;
    if (this.userRole === 'Administrador') return true;
    if (view === 'sales') return this.userRole === 'Vendedor';
    if (view === 'orders') return this.userRole === 'Gerente';
    if (view === 'reservas') return this.userRole === 'Vendedor' || this.userRole === 'Gerente';
    if (view === 'tracking') return this.userRole === 'Vendedor' || this.userRole === 'Gerente';
    return false;
  }

  handleNavigation(view: ViewType, anchor?: string): void {
    if (view === 'home' && anchor) {
      this.viewChange.emit('home');
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      this.viewChange.emit(view);
    }
    this.isOpen = false;
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }
}
