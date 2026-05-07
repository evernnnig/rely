// order-detail.component.ts
// import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VentasService, OrdenDetalleCompleta } from '../../services/orders.service';
import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { VentasService } from '../../services/orders.service';

@Component({
  standalone: false,
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  // Sin styleUrls si no tienes el archivo CSS
})
export class OrderDetailComponent implements OnInit {
  ordenId!: number;
  
  orden: OrdenDetalleCompleta | null = null;
  isLoading = true;
  error = '';
  
  activeTab: 'info' | 'pagos' | 'notificaciones' | 'documentos' | 'historial' = 'info';
  
  tabs = [
    { id: 'info' as const, label: 'Información General', icon: 'circle' },
    { id: 'pagos' as const, label: 'Pagos', icon: 'dollar' },
    { id: 'notificaciones' as const, label: 'Notificaciones', icon: 'mail' },
    { id: 'documentos' as const, label: 'Documentos', icon: 'file' },
    { id: 'historial' as const, label: 'Historial', icon: 'clock' },
  ];
  
  // Notificación
  showNotificarModal = false;
  notificacion = { tipo: 'email', asunto: '', mensaje: '' };
  enviandoNotificacion = false;
  
  // Pago parcial
  showPagoModal = false;
  pagoParcial = {
    numero_cuota: 1,
    monto_pagado: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    comprobante_url: '',
    notas: ''
  };
  registrandoPago = false;
  
  // Documento
  showDocumentoModal = false;
  
  constructor(
    private ventasService: VentasService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,   // ← Agrega esto
    private ngZone: NgZone   
  ) {}

ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.ordenId = +params['id'];
      this.cargarDetalle();
    });
  }

  async cargarDetalle(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    
    try {
      const data = await this.ventasService.getOrdenDetalleCompleta(this.ordenId);
      
      // Forzar actualización dentro de la zona de Angular
      this.ngZone.run(() => {
        this.orden = data;
        this.isLoading = false;
        this.cdr.detectChanges();  // ← Forzar detección de cambios
      });
      
      console.log('✅ Orden cargada:', this.orden);
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error = err.message || 'Error al cargar el detalle';
        this.isLoading = false;
        this.cdr.detectChanges();
      });
      console.error('❌ Error:', err);
    }
  }

  async enviarNotificacion(): Promise<void> {
    if (!this.orden) return;
    this.enviandoNotificacion = true;
    try {
      await this.ventasService.enviarNotificacion(this.orden.id, this.notificacion);
      this.showNotificarModal = false;
      this.notificacion = { tipo: 'email', asunto: '', mensaje: '' };
      await this.cargarDetalle();
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      this.enviandoNotificacion = false;
    }
  }

  async registrarPago(): Promise<void> {
    if (!this.orden) return;
    this.registrandoPago = true;
    try {
      await this.ventasService.registrarPagoParcial(this.orden.id, {
        numero_cuota: this.pagoParcial.numero_cuota,
        monto_pagado: this.pagoParcial.monto_pagado,
        fecha_pago: this.pagoParcial.fecha_pago,
        comprobante_url: this.pagoParcial.comprobante_url,
        notas: this.pagoParcial.notas
      });
      this.showPagoModal = false;
      this.pagoParcial = {
        numero_cuota: this.pagoParcial.numero_cuota + 1,
        monto_pagado: 0,
        fecha_pago: new Date().toISOString().split('T')[0],
        comprobante_url: '',
        notas: ''
      };
      await this.cargarDetalle();
    } catch (err: any) {
      console.error('Error:', err);
    } finally {
      this.registrandoPago = false;
    }
  }

  // order-detail.component.ts
getEstadoLabel(estadoId: number): string {
  const labels: Record<number, string> = {
    1: 'Pendiente',
    2: 'Aprobada',
    3: 'Completada',
    4: 'Cancelada',
  };
  return labels[estadoId] || 'Pendiente';
}

  getEstadoClase(estadoId: number): string {
    const clases: Record<number, string> = {
      1: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
      2: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
      3: 'bg-green-900/40 text-green-300 border-green-700/40',
      4: 'bg-red-900/40 text-red-300 border-red-700/40',
    };
    return clases[estadoId] || 'bg-gray-800 text-gray-400 border-gray-700';
  }

  getMontoRestanteClass(): string {
    if (!this.orden?.transaccion) return 'text-green-400';
    const restante = parseFloat(this.orden.transaccion.monto_restante);
    return restante > 0 ? 'text-yellow-400' : 'text-green-400';
  }

  get totalPagado(): number {
    if (!this.orden) return 0;
    return this.orden.pagos_parciales.reduce((sum, p) => sum + parseFloat(p.monto_pagado), 0);
  }

  get cuotasPendientes(): number {
    if (!this.orden?.transaccion) return 0;
    const restante = parseFloat(this.orden.transaccion.monto_restante);
    return restante > 0 ? 1 : 0;
  }
}