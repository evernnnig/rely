import { Component, OnInit } from '@angular/core';
import { VentasService, OrdenVenta } from '../../services/ventas.service';

@Component({
  standalone: false,
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  orders: OrdenVenta[] = [];
  filteredOrders: OrdenVenta[] = [];
  searchTerm = '';
  selectedOrder: OrdenVenta | null = null;
  isModalOpen = false;
  isLoading = true;
  error = '';

  constructor(private ventasService: VentasService) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  async fetchOrders(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      this.orders = await this.ventasService.getOrders();
      this.filteredOrders = [...this.orders];
    } catch {
      this.error = 'Error al cargar las órdenes';
    } finally {
      this.isLoading = false;
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    const t = term.toLowerCase();
    this.filteredOrders = this.orders.filter(o =>
      o.cliente_nombre.toLowerCase().includes(t) ||
      o.cliente_email.toLowerCase().includes(t) ||
      o.referencia.includes(term)
    );
  }

  openOrder(order: OrdenVenta): void {
    this.selectedOrder = order;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedOrder = null;
  }

  get totalVentas(): number {
    return this.orders.reduce((sum, o) => sum + Number(o.precio), 0);
  }

  get ordenesHoy(): number {
    const today = new Date().toDateString();
    return this.orders.filter(o => new Date(o.created_at).toDateString() === today).length;
  }

  get promedio(): number {
    return this.orders.length > 0 ? Math.round(this.totalVentas / this.orders.length) : 0;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES');
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateFull(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
