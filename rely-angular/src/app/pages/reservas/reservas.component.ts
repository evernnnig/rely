import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { VentasService, Reserva } from '../../services/ventas.service';

type FiltroEstado = 'TODAS' | 'ACTIVA' | 'VENCIDA' | 'CONVERTIDA' | 'CANCELADA';

@Component({
  standalone: false,
  selector: 'app-reservas',
  templateUrl: './reservas.component.html',
})
export class ReservasComponent implements OnInit {
  reservas: Reserva[] = [];
  filtradas: Reserva[] = [];
  isLoading = true;
  error = '';
  filtroActivo: FiltroEstado = 'TODAS';

  showCancelarModal = false;
  reservaACancelar: Reserva | null = null;
  cancelando = false;
  cancelError = '';

  readonly filtros: { id: FiltroEstado; label: string }[] = [
    { id: 'TODAS', label: 'Todas' },
    { id: 'ACTIVA', label: 'Activas' },
    { id: 'VENCIDA', label: 'Vencidas' },
    { id: 'CONVERTIDA', label: 'Convertidas' },
    { id: 'CANCELADA', label: 'Canceladas' },
  ];

  constructor(
    private ventasService: VentasService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  async cargarReservas(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      this.reservas = await this.ventasService.getReservas();
      this.aplicarFiltro();
    } catch (err: any) {
      this.error = err.message || 'Error al cargar las reservas';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  aplicarFiltro(): void {
    this.filtradas = this.filtroActivo === 'TODAS'
      ? [...this.reservas]
      : this.reservas.filter(r => r.estado === this.filtroActivo);
  }

  setFiltro(f: FiltroEstado): void {
    this.filtroActivo = f;
    this.aplicarFiltro();
  }

  // ── Estadísticas ──────────────────────────────────────────────
  contarPorEstado(estado: string): number {
    return this.reservas.filter(r => r.estado === estado).length;
  }

  get totalActivas(): number { return this.contarPorEstado('ACTIVA'); }
  get totalVenciendoHoy(): number {
    return this.reservas.filter(r => r.estado === 'ACTIVA' && r.dias_restantes <= 1).length;
  }
  get totalConvertidas(): number { return this.reservas.filter(r => r.estado === 'CONVERTIDA').length; }

  // ── Colores de estado ─────────────────────────────────────────
  getEstadoClass(estado: string): string {
    const m: Record<string, string> = {
      ACTIVA:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
      VENCIDA:    'bg-red-500/15 text-red-400 border-red-500/30',
      CONVERTIDA: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      CANCELADA:  'bg-gray-500/15 text-gray-400 border-gray-500/30',
    };
    return m[estado] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
  }

  getDiasClass(dias: number): string {
    if (dias <= 1) return 'text-red-400 font-bold';
    if (dias <= 3) return 'text-amber-400 font-semibold';
    return 'text-emerald-400';
  }

  // ── Cancelar ──────────────────────────────────────────────────
  abrirCancelar(r: Reserva): void {
    this.reservaACancelar = r;
    this.cancelError = '';
    this.showCancelarModal = true;
  }

  cerrarCancelar(): void {
    this.showCancelarModal = false;
    this.reservaACancelar = null;
    this.cancelError = '';
  }

  async confirmarCancelar(): Promise<void> {
    if (!this.reservaACancelar) return;
    this.cancelando = true;
    this.cancelError = '';
    try {
      await this.ventasService.cancelarReserva(this.reservaACancelar.id);
      this.cerrarCancelar();
      await this.cargarReservas();
    } catch (err: any) {
      this.cancelError = err.message || 'Error al cancelar la reserva';
    } finally {
      this.cancelando = false;
      this.cdr.detectChanges();
    }
  }

  // ── Convertir a venta ─────────────────────────────────────────
  convertirAVenta(r: Reserva): void {
    // Redirige a ventas; el módulo de ventas puede recibir el VIN/vehículo pre-seleccionado
    this.router.navigate(['/ventas'], { queryParams: { reserva: r.id, vehiculo: r.vehiculo } });
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatMonto(m: string | null): string {
    if (!m) return '—';
    const n = parseFloat(m);
    return isNaN(n) ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
}
