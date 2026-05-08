import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SalesComponent } from './pages/sales/sales.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailComponent } from './pages/orders/order-detail.component';
import { TrackingComponent } from './pages/tracking/tracking.component';
import { AdminComponent } from './pages/admin/admin.component';
import { SedesComponent } from './pages/sedes/sedes.component';
import { ReservasComponent } from './pages/reservas/reservas.component';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'ventas',
    component: SalesComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Vendedor'] },
  },
  {
    path: 'ordenes',
    component: OrdersComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Gerente'] },
  },
  {
    path: 'ordenes/:id',
    component: OrderDetailComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Gerente'] },
  },
  {
    path: 'tracking',
    component: TrackingComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Vendedor', 'Gerente'] },
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [RoleGuard],
    data: { roles: [] },
  },
  {
    path: 'sedes',
    component: SedesComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Gerente'] },
  },
  {
    path: 'reservas',
    component: ReservasComponent,
    canActivate: [RoleGuard],
    data: { roles: ['Vendedor', 'Gerente'] },
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }