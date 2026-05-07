import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { ViewType } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  isAuth = false;
  userEmail = '';
  userRole: string | null = null;
  isLoginOpen = false;
  currentView: ViewType = 'home';

  private routerSub?: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Track route changes reactively
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        if (url.startsWith('/ventas')) this.currentView = 'sales';
        else if (url.startsWith('/ordenes')) this.currentView = 'orders';
        else if (url.startsWith('/tracking')) this.currentView = 'tracking';
        else if (url.startsWith('/admin')) this.currentView = 'admin';
        else this.currentView = 'home';
      });

    // Set initial view
    const url = this.router.url;
    if (url.startsWith('/ventas')) this.currentView = 'sales';
    else if (url.startsWith('/ordenes')) this.currentView = 'orders';
    else if (url.startsWith('/tracking')) this.currentView = 'tracking';
    else if (url.startsWith('/admin')) this.currentView = 'admin';
    else this.currentView = 'home';

    // Restore session
    if (!this.authService.isAuthenticated()) return;
    this.authService.getCurrentUser().then((user) => {
      if (user) {
        this.isAuth = true;
        this.userEmail = user.email;
        this.userRole = user.role;
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  handleViewChange(view: ViewType): void {
    if (['sales', 'orders', 'tracking', 'admin'].includes(view) && !this.isAuth) {
      this.isLoginOpen = true;
      return;
    }
    const routes: Record<ViewType, string> = {
      home: '/',
      sales: '/ventas',
      orders: '/ordenes',
      tracking: '/tracking',
      admin: '/admin',
    };
    this.router.navigate([routes[view]]);
  }

  handleLoginSuccess(email: string): void {
    this.isAuth = true;
    this.userEmail = email;
    const user = this.authService.getCurrentUserValue();
    this.userRole = user?.role ?? null;
    this.isLoginOpen = false;
  }

  async handleLogout(): Promise<void> {
    await this.authService.logout();
    this.isAuth = false;
    this.userEmail = '';
    this.userRole = null;
    this.router.navigate(['/']);
  }
}