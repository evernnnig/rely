// order-detail.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VentasService, OrdenDetalleCompleta, PagoParcial } from '../../services/orders.service';
import { PdfVentaService, DatosVentaPDF } from '../../services/pdf-venta.service';

type TabId = 'info' | 'pagos' | 'notificaciones' | 'documentos' | 'historial';

// Constantes centralizadas
const ESTADO_PAGO = {
  PENDIENTE: 1,
  PAGADO: 2,
  VERIFICADO: 3,
  RECHAZADO: 4
} as const;

const ESTADO_ORDEN = {
  PENDIENTE: 1,
  EN_PROCESO: 2,
  APROBADA: 3,
  RECHAZADA: 4,
  COMPLETADA: 5,
  CANCELADA: 6
} as const;

const ESTADO_CLASSES: Record<number, string> = {
  [ESTADO_ORDEN.PENDIENTE]: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  [ESTADO_ORDEN.EN_PROCESO]: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  [ESTADO_ORDEN.APROBADA]: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  [ESTADO_ORDEN.RECHAZADA]: 'bg-red-500/15 text-red-400 border-red-500/30',
  [ESTADO_ORDEN.COMPLETADA]: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  [ESTADO_ORDEN.CANCELADA]: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const TRANSICIONES_ESTADO: Record<number, number[]> = {
  [ESTADO_ORDEN.PENDIENTE]: [ESTADO_ORDEN.EN_PROCESO, ESTADO_ORDEN.CANCELADA],
  [ESTADO_ORDEN.EN_PROCESO]: [ESTADO_ORDEN.APROBADA, ESTADO_ORDEN.RECHAZADA, ESTADO_ORDEN.CANCELADA],
  [ESTADO_ORDEN.APROBADA]: [ESTADO_ORDEN.COMPLETADA, ESTADO_ORDEN.CANCELADA],
  [ESTADO_ORDEN.RECHAZADA]: [ESTADO_ORDEN.PENDIENTE],
  [ESTADO_ORDEN.COMPLETADA]: [],
  [ESTADO_ORDEN.CANCELADA]: [ESTADO_ORDEN.PENDIENTE],
};

// Al inicio del archivo, después de los imports
interface NotificacionConExpanded extends Notificacion {
  expanded?: boolean;
}

// En el componente, modifica el tipo de orden
orden: (OrdenDetalleCompleta & { notificaciones: NotificacionConExpanded[] }) | null = null;

@Component({
  standalone: false,
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  ordenId!: number;
  orden: OrdenDetalleCompleta | null = null;
  isLoading = true;
  error = '';
  activeTab: TabId = 'info';
  showNotificarModal = false;
  showPagoModal = false;
  showDocumentoModal = false;
  showEstadoModal = false;

  notificacion = { tipo: 'email', asunto: '', mensaje: '' };
  pagoParcial = {
    numero_cuota: 1,
    monto_pagado: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    comprobante_url: '',
    notas: ''
  };
  documentoNuevo = { tipo_documento: 'contrato', nombre: '', url_archivo: '' };

  processingStates = {
    enviandoNotificacion: false,
    registrandoPago: false,
    subiendoDocumento: false,
    cambiandoEstado: false,
    procesandoPagoId: null as number | null,
    verificandoPagoId: null as number | null,
    rechazandoPagoId: null as number | null,
  };

  filtroPagos: 'todos' | 'pendientes' | 'pagados' | 'verificados' = 'todos';
  notificacionesFiltro: 'todas' | 'email' | 'whatsapp' | 'sms' = 'todas';
  documentosFiltro = 'todos';
  
  readonly tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'info', label: 'Información General' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'notificaciones', label: 'Notificaciones' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'historial', label: 'Historial' },
  ];

  readonly filtrosDisponibles = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendientes', label: 'Pendientes' },
    { id: 'pagados', label: 'Pagados' },
    { id: 'verificados', label: 'Verificados' },
  ] as const;

  readonly tiposDocumento = [
    { id: 'contrato', label: 'Contrato', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'factura', label: 'Factura', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    { id: 'comprobante', label: 'Comprobante', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'garantia', label: 'Garantía', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'identificacion', label: 'Identificación', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' },
    { id: 'otro', label: 'Otro', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  constructor(
    private ventasService: VentasService,
    private pdfVentaService: PdfVentaService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.ordenId = +params['id'];
      this.cargarDetalle();
    });
  }

  // ==================== CARGA DE DATOS ====================
  async cargarDetalle(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      const data = await this.ventasService.getOrdenDetalleCompleta(this.ordenId);
      // Agregar propiedad expanded a cada notificación
      if (data?.notificaciones) {
        (data.notificaciones as NotificacionConExpanded[]).forEach(n => n.expanded = false);
      }
      this.orden = data as any;
      this.actualizarBadges();
    } catch (err: any) {
      this.error = err.message || 'Error al cargar el detalle';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private actualizarBadges(): void {
    if (!this.orden) return;
    const badgeMap = {
      pagos: this.orden.pagos_parciales.length,
      notificaciones: this.orden.notificaciones.length,
      documentos: this.orden.documentos.length,
      historial: this.orden.historial_estados.length
    };
    this.tabs.forEach(tab => {
      if (badgeMap[tab.id as keyof typeof badgeMap] !== undefined) {
        tab.badge = badgeMap[tab.id as keyof typeof badgeMap];
      }
    });
  }

  // ==================== GETTERS ====================
  get pagosFiltrados(): PagoParcial[] {
    if (!this.orden) return [];
    
    const filtros: Record<string, (p: PagoParcial) => boolean> = {
      pendientes: (p) => p.estado === ESTADO_PAGO.PENDIENTE,
      pagados: (p) => p.estado === ESTADO_PAGO.PAGADO,
      verificados: (p) => p.estado === ESTADO_PAGO.VERIFICADO,
    };
    
    const filtro = filtros[this.filtroPagos];
    return filtro 
      ? this.orden.pagos_parciales.filter(filtro)
      : this.orden.pagos_parciales;
  }

  get notificacionesFiltradas() {
    if (!this.orden) return [];
    if (this.notificacionesFiltro === 'todas') return this.orden.notificaciones;
    return this.orden.notificaciones.filter(n => n.tipo === this.notificacionesFiltro);
  }

  get documentosFiltrados() {
    if (!this.orden) return [];
    if (this.documentosFiltro === 'todos') return this.orden.documentos;
    return this.orden.documentos.filter(d => d.tipo_documento === this.documentosFiltro);
  }

  get historialFiltrado() {
    return this.orden?.historial_estados || [];
  }

  get totalPagado(): number {
    if (!this.orden) return 0;
    const inicial = parseFloat(this.orden.transaccion?.monto_inicial || '0');
    const parciales = this.orden.pagos_parciales.reduce((sum, p) => sum + parseFloat(p.monto_pagado), 0);
    return inicial + parciales;
  }

  get totalPagadoParcial(): number {
    if (!this.orden) return 0;
    return this.orden.pagos_parciales
      .filter(p => p.estado === ESTADO_PAGO.PAGADO || p.estado === ESTADO_PAGO.VERIFICADO)
      .reduce((sum, p) => sum + parseFloat(p.monto_pagado), 0);
  }

  get totalPendienteParcial(): number {
    if (!this.orden) return 0;
    return this.orden.pagos_parciales
      .filter(p => p.estado === ESTADO_PAGO.PENDIENTE)
      .reduce((sum, p) => sum + parseFloat(p.monto_pagado), 0);
  }

  getTotalFiltrado(): number {
    return this.pagosFiltrados.reduce((sum, p) => sum + parseFloat(p.monto_pagado), 0);
  }

  // ==================== ORDEN ESTADO ====================
  getEstadoOrdenLabel(): string {
    const estadoId = this.orden?.estado_orden_id ?? this.orden?.estado_orden ?? ESTADO_ORDEN.PENDIENTE;
    const labels: Record<number, string> = {
      [ESTADO_ORDEN.PENDIENTE]: 'Pendiente',
      [ESTADO_ORDEN.EN_PROCESO]: 'En Proceso',
      [ESTADO_ORDEN.APROBADA]: 'Aprobada',
      [ESTADO_ORDEN.RECHAZADA]: 'Rechazada',
      [ESTADO_ORDEN.COMPLETADA]: 'Completada',
      [ESTADO_ORDEN.CANCELADA]: 'Cancelada',
    };
    return labels[estadoId] || 'Pendiente';
  }

  getEstadoOrdenClass(): string {
    const estadoId = this.orden?.estado_orden_id ?? this.orden?.estado_orden ?? ESTADO_ORDEN.PENDIENTE;
    return ESTADO_CLASSES[estadoId] || 'bg-gray-500/15 text-gray-400';
  }

  getEstadosDisponiblesParaCambio() {
    const estadoActual = this.orden?.estado_orden_id ?? this.orden?.estado_orden ?? ESTADO_ORDEN.PENDIENTE;
    const estadosPermitidos = TRANSICIONES_ESTADO[estadoActual] || [];
    
    const todosLosEstados = [
      { id: ESTADO_ORDEN.PENDIENTE, label: 'Pendiente', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', colorClass: 'text-yellow-400', descripcion: 'Orden en revisión inicial' },
      { id: ESTADO_ORDEN.EN_PROCESO, label: 'En Proceso', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorClass: 'text-blue-400', descripcion: 'Orden siendo procesada' },
      { id: ESTADO_ORDEN.APROBADA, label: 'Aprobada', icon: 'M5 13l4 4L19 7', colorClass: 'text-indigo-400', descripcion: 'Orden verificada y aprobada' },
      { id: ESTADO_ORDEN.RECHAZADA, label: 'Rechazada', icon: 'M6 18L18 6M6 6l12 12', colorClass: 'text-red-400', descripcion: 'Orden rechazada' },
      { id: ESTADO_ORDEN.COMPLETADA, label: 'Completada', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorClass: 'text-emerald-400', descripcion: 'Venta finalizada exitosamente' },
      { id: ESTADO_ORDEN.CANCELADA, label: 'Cancelada', icon: 'M6 18L18 6M6 6l12 12', colorClass: 'text-gray-400', descripcion: 'Orden cancelada' },
    ];
    
    return todosLosEstados.filter(e => estadosPermitidos.includes(e.id));
  }

  async cambiarEstadoOrden(nuevoEstado: number): Promise<void> {
    if (!this.orden) return;
    this.processingStates.cambiandoEstado = true;
    try {
      await this.ventasService.updateOrderStatus(this.orden.id, nuevoEstado);
      if (this.orden) {
        this.orden.estado_orden = nuevoEstado;
        this.orden.estado_orden_id = nuevoEstado;
      }
      this.showEstadoModal = false;
      await this.cargarDetalle();
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
    } finally {
      this.processingStates.cambiandoEstado = false;
      this.cdr.detectChanges();
    }
  }

  // ==================== PAGOS ====================
  getEstadoPagoIndividualClass(estadoId: number): string {
    const clases: Record<number, string> = {
      [ESTADO_PAGO.PENDIENTE]: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      [ESTADO_PAGO.PAGADO]: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      [ESTADO_PAGO.VERIFICADO]: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      [ESTADO_PAGO.RECHAZADO]: 'bg-red-500/15 text-red-400 border-red-500/30',
    };
    return clases[estadoId] || 'bg-gray-500/15 text-gray-400';
  }

  getEstadoPagoIndividualLabel(estadoId: number): string {
    const labels: Record<number, string> = {
      [ESTADO_PAGO.PENDIENTE]: 'Pendiente',
      [ESTADO_PAGO.PAGADO]: 'Pagado',
      [ESTADO_PAGO.VERIFICADO]: 'Verificado',
      [ESTADO_PAGO.RECHAZADO]: 'Rechazado',
    };
    return labels[estadoId] || 'Desconocido';
  }

  private async actualizarEstadoPago(pagoId: number, nuevoEstado: number): Promise<void> {
    try {
      await this.ventasService.actualizarEstadoPagoIndividual(pagoId, nuevoEstado);
      await this.cargarDetalle();
    } catch (err: any) {
      console.error('Error al actualizar pago:', err);
    }
  }

  async aprobarPago(pago: PagoParcial): Promise<void> {
    this.processingStates.procesandoPagoId = pago.id;
    await this.actualizarEstadoPago(pago.id, ESTADO_PAGO.PAGADO);
    this.processingStates.procesandoPagoId = null;
  }

  async verificarPago(pago: PagoParcial): Promise<void> {
    this.processingStates.verificandoPagoId = pago.id;
    await this.actualizarEstadoPago(pago.id, ESTADO_PAGO.VERIFICADO);
    this.processingStates.verificandoPagoId = null;
  }

  async rechazarPago(pago: PagoParcial): Promise<void> {
    this.processingStates.rechazandoPagoId = pago.id;
    await this.actualizarEstadoPago(pago.id, ESTADO_PAGO.RECHAZADO);
    this.processingStates.rechazandoPagoId = null;
  }

  async registrarPago(): Promise<void> {
    if (!this.orden) return;
    this.processingStates.registrandoPago = true;
    try {
      await this.ventasService.registrarPagoParcial(this.orden.id, this.pagoParcial);
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
      this.processingStates.registrandoPago = false;
    }
  }

  getProximoNumeroCuota(): number {
    if (!this.orden?.pagos_parciales.length) return 1;
    return Math.max(...this.orden.pagos_parciales.map(p => p.numero_cuota)) + 1;
  }

  abrirModalPago(): void {
    this.pagoParcial.numero_cuota = this.getProximoNumeroCuota();
    this.pagoParcial.monto_pagado = parseFloat(this.orden?.transaccion?.monto_restante || '0');
    this.showPagoModal = true;
  }

  getProgresoColor(): string {
    const p = this.orden?.transaccion?.porcentaje_pagado || 0;
    if (p >= 100) return 'from-emerald-500 to-emerald-400';
    if (p >= 75) return 'from-blue-500 to-blue-400';
    if (p >= 50) return 'from-amber-500 to-amber-400';
    return 'from-orange-500 to-orange-400';
  }

  getMontoRestanteClass(): string {
    if (!this.orden?.transaccion) return 'text-gray-400';
    return parseFloat(this.orden.transaccion.monto_restante) > 0 ? 'text-amber-400' : 'text-emerald-400';
  }

  getEstadoPagoClass(): string {
    const estadoId = this.orden?.transaccion?.estado_pago_id;
    const clases: Record<number, string> = {
      1: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      2: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      3: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    };
    return clases[estadoId || 1] || 'bg-gray-500/15 text-gray-400';
  }

  trackByPagoId(index: number, pago: PagoParcial): number {
    return pago.id;
  }

  // ==================== NOTIFICACIONES ====================
  getNotificacionIcon(tipo: string): string {
    const icons: Record<string, string> = {
      email: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      whatsapp: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
      sms: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z',
    };
    return icons[tipo] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }

  getNotificacionBgColor(tipo: string): string {
    const colors: Record<string, string> = {
      email: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      whatsapp: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      sms: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    };
    return colors[tipo] || 'bg-gray-500/10 border-gray-500/20 text-gray-400';
  }

  getNotificacionEstadoColor(estado: string): string {
    const colors: Record<string, string> = {
      enviado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      fallido: 'bg-red-500/10 text-red-400 border-red-500/30',
      leido: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
    return colors[estado] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }

  getNotificacionEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      enviado: 'Enviado',
      pendiente: 'Pendiente',
      fallido: 'Fallido',
      leido: 'Leído',
    };
    return labels[estado] || estado;
  }

  async enviarNotificacion(): Promise<void> {
    if (!this.orden) return;
    this.processingStates.enviandoNotificacion = true;
    try {
      await this.ventasService.enviarNotificacion(this.orden.id, this.notificacion);
      this.showNotificarModal = false;
      this.notificacion = { tipo: 'email', asunto: '', mensaje: '' };
      await this.cargarDetalle();
    } catch (err: any) {
      console.error('Error al enviar notificación:', err);
    } finally {
      this.processingStates.enviandoNotificacion = false;
      this.cdr.detectChanges();
    }
  }

  async reenviarNotificacion(notif: any): Promise<void> {
    this.notificacion = {
      tipo: notif.tipo,
      asunto: notif.asunto,
      mensaje: notif.mensaje
    };
    this.showNotificarModal = true;
  }

  // ==================== DOCUMENTOS ====================
  getDocumentoIcon(tipo: string): string {
    const found = this.tiposDocumento.find(t => t.id === tipo);
    return found?.icon || 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }

  getDocumentoBgColor(tipo: string): string {
    const colores: Record<string, string> = {
      contrato: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      factura: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      comprobante: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      garantia: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      identificacion: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      otro: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    };
    return colores[tipo] || 'bg-gray-500/10 border-gray-500/20 text-gray-400';
  }

  getDocumentoTipoLabel(tipo: string): string {
    const found = this.tiposDocumento.find(t => t.id === tipo);
    return found?.label || tipo;
  }

  async subirDocumento(): Promise<void> {
    if (!this.orden || !this.documentoNuevo.nombre || !this.documentoNuevo.url_archivo) return;
    this.processingStates.subiendoDocumento = true;
    try {
      await this.ventasService.subirDocumento(this.orden.id, this.documentoNuevo);
      this.showDocumentoModal = false;
      this.documentoNuevo = { tipo_documento: 'contrato', nombre: '', url_archivo: '' };
      await this.cargarDetalle();
    } catch (err: any) {
      console.error('Error al subir documento:', err);
    } finally {
      this.processingStates.subiendoDocumento = false;
    }
  }

  abrirModalDocumento(): void {
    this.documentoNuevo = { tipo_documento: 'contrato', nombre: '', url_archivo: '' };
    this.showDocumentoModal = true;
  }

  abrirDocumento(url: string): void {
    window.open(url, '_blank');
  }

  // ==================== UTILIDADES ====================
  descargarPDF(): void {
    if (!this.orden) return;
    const datosPDF = this.prepararDatosPDF();
    const blob = this.pdfVentaService.generarPDFVenta(datosPDF);
    this.pdfVentaService.descargarPDF(blob, `Comprobante-${this.orden.codigo_orden}.pdf`);
  }

  private prepararDatosPDF(): DatosVentaPDF {
    const o = this.orden!;
    return {
      codigoOrden: o.codigo_orden,
      fechaVenta: new Date(o.fecha_creacion).toLocaleDateString('es-VE', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      cliente: {
        nombres: o.cliente_info?.nombre || '',
        apellidos: '',
        nacionalidad: o.cliente_info?.identificacion || '',
        identificacion: o.cliente_info?.identificacion || '',
        email: o.cliente_info?.email || '',
        telefono: o.cliente_info?.telefono_1 || '',
        direccion: o.cliente_info?.direccion || '',
        estado: '',
      },
      vehiculo: {
        marca: o.vehiculo_info?.modelo?.marca || '',
        modelo: o.vehiculo_info?.modelo?.nombre || '',
        version: o.vehiculo_info?.version?.nombre || '',
        año: o.vehiculo_info?.version?.['año_modelo'] || '',
        color: o.vehiculo_info?.color_exterior || '',
        motorizacion: o.vehiculo_info?.version?.motorizacion || '',
        transmision: o.vehiculo_info?.version?.transmision || '',
        vin: o.vehiculo_info?.vin || '',
        numeroMotor: o.vehiculo_info?.numero_motor || '',
        numeroChasis: o.vehiculo_info?.numero_chasis || '',
        ubicacion: o.vehiculo_info?.ubicacion || '',
      },
      pago: {
        precioLista: parseFloat(o.transaccion?.monto_total || '0'),
        moneda: o.transaccion?.moneda || 'USD',
        montoTotal: parseFloat(o.transaccion?.monto_total || '0'),
        montoInicial: parseFloat(o.transaccion?.monto_inicial || '0'),
        saldoRestante: parseFloat(o.transaccion?.monto_restante || '0'),
        metodoPago: o.transaccion?.metodo_pago_nombre || '',
        entidadFinanciera: o.transaccion?.entidad_financiera_nombre || undefined,
        referencia: o.transaccion?.referencia || '',
        fechaPago: o.transaccion?.fecha_pago ? new Date(o.transaccion.fecha_pago).toLocaleDateString('es-VE') : '',
        tasaCambio: o.transaccion?.tasa_cambio ? parseFloat(o.transaccion.tasa_cambio) : undefined,
      },
    };
  }

  volver(): void {
    this.router.navigate(['/ordenes']);
  }
}