import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { VentasService, OrdenVenta } from '../../services/orders.service';
import { Router } from '@angular/router';


export interface EstadoOpcion {
  id: number;
  label: string;
  class: string;
}

@Component({
  standalone: false,
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  orders: OrdenVenta[] = [];
  filteredOrders: OrdenVenta[] = [];
  isLoading = true;
  isFirstLoad = true;
  error = '';
  searchTerm = '';
  selectedOrder: OrdenVenta | null = null;

  // Procesar orden
  isProcesarOpen = false;
  isUpdating = false;
  procesarError = '';
  nuevoEstadoId = 2;

  readonly estadosDisponibles: EstadoOpcion[] = [
    { id: 2, label: 'Aprobada',   class: 'text-blue-400' },
    { id: 3, label: 'Completada', class: 'text-emerald-400' },
    { id: 4, label: 'Cancelada',  class: 'text-red-400' },
  ];

  constructor(
    private ventasService: VentasService,
    private cdr: ChangeDetectorRef,
     private router: Router  // Agrega esto
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      const data = await this.ventasService.getOrders();
      this.orders = data || [];
      this.filteredOrders = [...this.orders];
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      this.error = 'No se pudieron cargar las órdenes. Verifica tu conexión.';
      this.orders = [];
      this.filteredOrders = [];
    } finally {
      this.isLoading = false;
      this.isFirstLoad = false;
      this.cdr.detectChanges();
    }
  }

  parseFloatValue(value: string | number): number {
  return typeof value === 'string' ? parseFloat(value) : value;
}

  onSearch(term: string): void {
    this.searchTerm = term;
    if (!term.trim()) {
      this.filteredOrders = [...this.orders];
      return;
    }
    const q = term.toLowerCase();
    this.filteredOrders = this.orders.filter(o =>
      (o.referencia?.toLowerCase() || '').includes(q) ||
      (o.cliente_nombre?.toLowerCase() || '').includes(q) ||
      (o.modelo_vehiculo?.toLowerCase() || '').includes(q) ||
      (o.vendedor_nombre?.toLowerCase() || '').includes(q)
    );
  }

// Cambia el método openDetail para redirigir a la página de detalle
  // openDetail(order: OrdenVenta): void {
  //   this.router.navigate(['/orders', order.id]);
  // }

  // O si prefieres mantener el modal y agregar un botón "Ver Detalle Completo":
 verDetalleCompleto(order: OrdenVenta): void {
    if (order && order.id) {
      this.router.navigate(['/ordenes', order.id]);
    }
  }

  openDetail(order: OrdenVenta): void {
    this.selectedOrder = order;
    this.isProcesarOpen = false;
  }

  closeDetail(): void {
    this.selectedOrder = null;
    this.isProcesarOpen = false;
  }

  openProcesar(): void {
    if (!this.selectedOrder) return;
    // Sugerir el siguiente estado lógico
    const siguiente = (this.selectedOrder.estadoId || 1) + 1;
    this.nuevoEstadoId = siguiente <= 3 ? siguiente : 4;
    this.procesarError = '';
    this.isProcesarOpen = true;
  }

  closeProcesar(): void {
    this.isProcesarOpen = false;
    this.procesarError = '';
  }

  async submitProcesar(): Promise<void> {
    if (!this.selectedOrder) return;
    this.isUpdating = true;
    this.procesarError = '';
    try {
      const updated = await this.ventasService.updateOrderStatus(
        this.selectedOrder.id,
        this.nuevoEstadoId,
      );
      // Actualizar en ambas listas
      this.orders = this.orders.map(o => o.id === updated.id ? updated : o);
      this.filteredOrders = this.filteredOrders.map(o => o.id === updated.id ? updated : o);
      this.selectedOrder = updated;
      this.isProcesarOpen = false;
      this.cdr.detectChanges();
    } catch (err: any) {
      this.procesarError = err.message || 'Error al procesar la orden';
    } finally {
      this.isUpdating = false;
      this.cdr.detectChanges();
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatPrice(price: string | number): string {
    const n = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(n);
  }

  getEstadoLabel(estado: string): string {
    return estado || 'Pendiente';
  }

  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'Pendiente':  'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
      'Aprobada':   'bg-blue-900/40 text-blue-300 border-blue-700/40',
      'Completada': 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
      'Cancelada':  'bg-red-900/40 text-red-300 border-red-700/40',
    };
    return classes[estado] || 'bg-gray-800 text-gray-400 border-gray-700';
  }

  getMetodoPagoLabel(id: number): string {
    const metodos: Record<number, string> = {
      1: 'Efectivo', 2: 'Transferencia', 3: 'Financiamiento',
      4: 'Tarjeta de Crédito', 5: 'Tarjeta de Débito',
      6: 'Cheque', 7: 'Criptomoneda', 8: 'Otro',
    };
    return metodos[id] || `Método ${id}`;
  }

  get totalVentas(): number {
    return this.orders.reduce((sum, o) => sum + (parseFloat(o.precio) || 0), 0);
  }

  get ordenesHoy(): number {
    const hoy = new Date().toDateString();
    return this.orders.filter(o => new Date(o.created_at).toDateString() === hoy).length;
  }

  get promedio(): number {
    if (!this.orders.length) return 0;
    return this.totalVentas / this.orders.length;
  }
}
