import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { NavigationComponent } from './components/navigation/navigation.component';
import { HeroComponent } from './components/hero/hero.component';
import { FeaturesComponent } from './components/features/features.component';
import { GalleryComponent } from './components/gallery/gallery.component';
import { ContactComponent } from './components/contact/contact.component';
import { LoginComponent } from './components/login/login.component';
import { AppDownloadComponent } from './components/apk/app-download.component';
import { PurchaseComponent } from './components/purchase/purchase.component';
import { PurchasePlanComponent } from './components/puchase-plan/purchase-plan.component';
import { HomeComponent } from './pages/home/home.component';
import { SalesComponent } from './pages/sales/sales.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailComponent } from './pages/orders/order-detail.component';
import { TrackingComponent } from './pages/tracking/tracking.component';
import { AdminComponent } from './pages/admin/admin.component';
import { SedesComponent } from './pages/sedes/sedes.component';
import { ReservasComponent } from './pages/reservas/reservas.component';

@NgModule({
  declarations: [
    App,
    NavigationComponent,
    HeroComponent,
    FeaturesComponent,
    GalleryComponent,
    ContactComponent,
    LoginComponent,
    PurchaseComponent,
    HomeComponent,
    PurchasePlanComponent,
    SalesComponent,
    OrdersComponent,
    OrderDetailComponent,
    TrackingComponent,
    AppDownloadComponent,
    AdminComponent,
    SedesComponent,
    ReservasComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
  ],
  bootstrap: [App],
})
export class AppModule {}