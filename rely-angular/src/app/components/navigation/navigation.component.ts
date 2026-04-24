import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ViewType = 'home' | 'sales' | 'orders' | 'tracking';

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
  @Output() viewChange = new EventEmitter<ViewType>();
  @Output() login = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  isOpen = false;

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
