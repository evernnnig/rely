import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { VentasService, OrdenVenta } from '../../services/orders.service';
import { Router } from '@angular/router';

export interface EstadoOpcion {
  id: number;
  label: string;
  class: string;
}

// Constantes centralizadas
const ESTADO_ORDEN = {
  PENDIENTE: 1,
  EN_PROCESO: 2,
  APROBADA: 3,
  RECHAZADA: 4,
  COMPLETADA: 5,
  CANCELADA: 6
} as const;

const METODOS_PAGO: Record<number, string> = {
  1: 'Efectivo',
  2: 'Transferencia',
  3: 'Financiamiento',
  4: 'Tarjeta de Crédito',
  5: 'Tarjeta de Débito',
  6: 'Cheque',
  7: 'Criptomoneda',
  8: 'Otro',
};

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
  error = '';
  searchTerm = '';
  selectedOrder: OrdenVenta | null = null;
  isProcesarOpen = false;
  isUpdating = false;
  procesarError = '';
  nuevoEstadoId: number = ESTADO_ORDEN.EN_PROCESO;
  updatingOrderId: number | null = null;

  estadosDisponibles: EstadoOpcion[] = [];

  constructor(
    private ventasService: VentasService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadOrders();
    await this.loadEstadosOrden();
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
      this.cdr.detectChanges();
    }
  }

  async loadEstadosOrden(): Promise<void> {
    try {
      const estados = await this.ventasService.getEstadosOrden();
      this.estadosDisponibles = estados.map(e => ({
        id: e.id,
        label: e.nombre,
        class: this.getEstadoClassForId(e.id)
      }));
    } catch (err: any) {
      console.error('Error cargando estados de orden:', err);
    }
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

  verDetalleCompleto(order: OrdenVenta): void {
    if (order?.id) {
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
    const estadoActual = this.selectedOrder.estadoId || ESTADO_ORDEN.PENDIENTE;
    
    // Diccionario de transiciones con tipo explícito
    const transiciones: Record<number, number> = {
      [ESTADO_ORDEN.PENDIENTE]: ESTADO_ORDEN.EN_PROCESO,
      [ESTADO_ORDEN.EN_PROCESO]: ESTADO_ORDEN.APROBADA,
      [ESTADO_ORDEN.APROBADA]: ESTADO_ORDEN.COMPLETADA,
    };
    
    const siguienteEstado = transiciones[estadoActual] ?? ESTADO_ORDEN.APROBADA;
    this.nuevoEstadoId = siguienteEstado;
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
    this.updatingOrderId = this.selectedOrder.id;
    this.procesarError = '';
    
    try {
      const updated = await this.ventasService.updateOrderStatus(
        this.selectedOrder.id,
        this.nuevoEstadoId,
      );
      
      this.orders = this.orders.map(o => o.id === updated.id ? updated : o);
      this.filteredOrders = this.filteredOrders.map(o => o.id === updated.id ? updated : o);
      this.selectedOrder = updated;
      this.isProcesarOpen = false;
      
    } catch (err: any) {
      this.procesarError = err.message || 'Error al procesar la orden';
    } finally {
      this.isUpdating = false;
      this.updatingOrderId = null;
      this.cdr.detectChanges();
    }
  }

  // ==================== HELPERS ====================
  private getEstadoClassForId(id: number): string {
    const classMap: Record<number, string> = {
      [ESTADO_ORDEN.PENDIENTE]: 'text-yellow-400',
      [ESTADO_ORDEN.EN_PROCESO]: 'text-blue-400',
      [ESTADO_ORDEN.APROBADA]: 'text-indigo-400',
      [ESTADO_ORDEN.RECHAZADA]: 'text-red-400',
      [ESTADO_ORDEN.COMPLETADA]: 'text-emerald-400',
      [ESTADO_ORDEN.CANCELADA]: 'text-gray-400',
    };
    return classMap[id] || 'text-gray-400';
  }

  getEstadoLabel(estado: string): string {
    return estado || 'Pendiente';
  }

  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'Pendiente': 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
      'En proceso': 'bg-blue-900/40 text-blue-300 border-blue-700/40',
      'En Proceso': 'bg-blue-900/40 text-blue-300 border-blue-700/40',
      'Aprobada': 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40',
      'Rechazada': 'bg-red-900/40 text-red-300 border-red-700/40',
      'Completada': 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
      'Cancelada': 'bg-gray-700/40 text-gray-300 border-gray-600/40',
    };
    return classes[estado] || 'bg-gray-800 text-gray-400 border-gray-700';
  }

  getMetodoPagoLabel(id: number): string {
    return METODOS_PAGO[id] || `Método ${id}`;
  }

  parseFloatValue(value: string | number): number {
    return typeof value === 'string' ? parseFloat(value) : value;
  }

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