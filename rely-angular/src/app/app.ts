import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ViewType } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App implements OnInit {
  isAuth = false;
  userEmail = '';
  isLoginOpen = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) return;

    this.authService.getCurrentUser().then((user) => {
      if (user) {
        this.isAuth = true;
        this.userEmail = user.email;
      }
    });
  }

  get currentView(): ViewType {
    const url = this.router.url;
    if (url.startsWith('/ventas')) return 'sales';
    if (url.startsWith('/ordenes')) return 'orders';
    if (url.startsWith('/tracking')) return 'tracking';
    return 'home';
  }

  handleViewChange(view: ViewType): void {
    if (['sales', 'orders', 'tracking'].includes(view) && !this.isAuth) {
      this.isLoginOpen = true;
      return;
    }
    const routes: Record<string, string> = {
      home: '/',
      sales: '/ventas',
      orders: '/ordenes',
      tracking: '/tracking',
    };
    this.router.navigate([routes[view] || '/']);
  }

  handleLoginSuccess(email: string): void {
    this.isAuth = true;
    this.userEmail = email;
    this.isLoginOpen = false;
  }

  async handleLogout(): Promise<void> {
    await this.authService.logout();
    this.isAuth = false;
    this.userEmail = '';
    this.router.navigate(['/']);
  }
}
