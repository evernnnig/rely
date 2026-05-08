import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { LotesService, LoteImportacion, CtEstadoLote } from '../../services/lotes.service';
import { SedesService, Sede } from '../../services/sedes.service';
import { CatalogosService, Pais } from '../../services/catalogos.service';
import { VehicleService, MarcaVehiculo, ModeloVehiculo, VersionVehiculo } from '../../services/vehiculos.service';

export interface VehiculoManifiesto {
  version_id: number;
  version_label: string;
  vin: string;
  color_exterior: string;
  color_interior: string;
  numero_motor: string;
  numero_chasis: string;
  precio_lista_sugerido: number | null;
}

@Component({
  standalone: false,
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.css'],
})
export class TrackingComponent implements OnInit {
  // ── Lista ──────────────────────────────────────────────────────
  lotes: LoteImportacion[] = [];
  filteredLotes: LoteImportacion[] = [];
  estados: CtEstadoLote[] = [];
  searchTerm = '';
  estadoFiltro = 'all';
  isLoading = false;
  error = '';

  // ── Modal detalle ──────────────────────────────────────────────
  selectedLote: LoteImportacion | null = null;
  isDetailOpen = false;
  detailTab: 'info' | 'vehiculos' = 'info';

  // ── Avanzar estado ─────────────────────────────────────────────
  isAvanzarOpen = false;
  avanzarEstadoId: number | null = null;
  avanzarNotas = '';
  avanzarUbicacion = '';
  isAvanzando = false;
  avanzarError = '';

  // ── Crear lote ─────────────────────────────────────────────────
  isCrearOpen = false;
  isCreando = false;
  crearError = '';
  catalogosLoading = false;
  paises: Pais[] = [];
  sedes: Sede[] = [];

  loteForm = {
    codigo_lote: '', proveedor: '', pais_origen: 0,
    puerto_origen: '', puerto_destino: '', sede_destino: 0,
    total_unidades: 1, fecha_orden_compra: '',
    fecha_embarque_estimado: '', fecha_llegada_estimada: '',
    numero_contenedores: null as number | null,
    valor_fob_usd: null as number | null, notas: '',
  };


  // ── Catálogo de colores para manifiesto ───────────────────────
  readonly coloresDisponibles = [
    'Blanco', 'Blanco Perla', 'Blanco Polar',
    'Negro', 'Negro Obsidiana', 'Negro Midnight',
    'Gris', 'Gris Titanio', 'Gris Oscuro',
    'Plata', 'Plata Metálico', 'Plata Hielo',
    'Azul', 'Azul Océano', 'Azul Metálico', 'Azul Marino',
    'Rojo', 'Rojo Carmesí', 'Rojo Metálico', 'Rojo Vino',
    'Verde', 'Verde Oscuro', 'Verde Militar',
    'Amarillo', 'Amarillo Oro',
    'Naranja', 'Naranja Quemado',
    'Marrón', 'Beige', 'Beige Arena',
    'Dorado', 'Dorado Champagne',
    'Bronce',
    'Vino', 'Vino Tinto',
    'Turquesa',
    'Morado', 'Púrpura',
  ];

  // ── Manifiesto de vehículos ────────────────────────────────────
  isManifiestoOpen = false;
  vehiculosManifiesto: VehiculoManifiesto[] = [];
  marcas: MarcaVehiculo[] = [];
  modelos: ModeloVehiculo[] = [];
  versiones: VersionVehiculo[] = [];
  isLoadingMarcas = false;
  isLoadingModelos = false;
  isLoadingVersiones = false;
  isGuardando = false;
  manifiestoError = '';
  manifiestoSuccess = '';

  vehiculoForm = {
    marca_id: 0, modelo_id: 0, version_id: 0,
    vin: '', color_exterior: '', color_interior: '',
    numero_motor: '', numero_chasis: '',
    precio_lista_sugerido: null as number | null,
  };

  constructor(
    private lotesService: LotesService,
    private sedesService: SedesService,
    private catalogosService: CatalogosService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void { this.loadData(); }

  // ── Carga principal ────────────────────────────────────────────
  async loadData(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      const [lotes, estados] = await Promise.all([
        this.lotesService.getLotes(),
        this.lotesService.getEstados(),
      ]);
      this.lotes = lotes;
      this.estados = estados;
      this.applyFilters();
    } catch (e: any) {
      this.error = e.message || 'Error al cargar lotes';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // ── Filtros ────────────────────────────────────────────────────
  applyFilters(): void {
    let r = [...this.lotes];
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      r = r.filter(l =>
        l.codigo_lote.toLowerCase().includes(t) ||
        l.proveedor.toLowerCase().includes(t) ||
        l.sede_destino_nombre.toLowerCase().includes(t) ||
        (l.numero_bl || '').toLowerCase().includes(t)
      );
    }
    if (this.estadoFiltro !== 'all')
      r = r.filter(l => l.estado_lote_nombre === this.estadoFiltro);
    this.filteredLotes = r;
  }

  setEstadoFiltro(e: string): void { this.estadoFiltro = e; this.applyFilters(); }
  onSearch(t: string): void { this.searchTerm = t; this.applyFilters(); }

  // ── Detalle ────────────────────────────────────────────────────
  async openDetail(lote: LoteImportacion): Promise<void> {
    this.selectedLote = { ...lote, vehiculos: [] };
    this.detailTab = 'info';
    this.isDetailOpen = true;
    this.closeAvanzar();
    this.closeManifiesto();
    try {
      const detalle = await this.lotesService.getLoteById(lote.id);
      this.selectedLote = detalle;
      this.cdr.detectChanges();
    } catch (e) {
      this.cdr.detectChanges();
    }
  }

  closeDetail(): void {
    this.isDetailOpen = false;
    this.selectedLote = null;
    this.closeAvanzar();
    this.closeManifiesto();
  }

  // ── Avanzar estado ─────────────────────────────────────────────
  openAvanzar(): void {
    this.avanzarEstadoId = null; this.avanzarNotas = '';
    this.avanzarUbicacion = ''; this.avanzarError = '';
    this.isAvanzarOpen = true;
  }
  closeAvanzar(): void { this.isAvanzarOpen = false; }

  get estadosSiguientes(): CtEstadoLote[] {
    if (!this.selectedLote) return [];
    return this.estados.filter(e => e.orden > this.selectedLote!.estado_lote_orden);
  }

  async submitAvanzar(): Promise<void> {
    if (!this.selectedLote || !this.avanzarEstadoId) return;
    this.isAvanzando = true; this.avanzarError = '';
    try {
      const updated = await this.lotesService.avanzarEstado(
        this.selectedLote.id, this.avanzarEstadoId, this.avanzarNotas, this.avanzarUbicacion,
      );
      const idx = this.lotes.findIndex(l => l.id === updated.id);
      if (idx !== -1) this.lotes[idx] = updated;
      this.selectedLote = updated;
      this.applyFilters();
      this.closeAvanzar();
    } catch (e: any) {
      this.avanzarError = e.message || 'Error al cambiar estado';
    } finally {
      this.isAvanzando = false; this.cdr.detectChanges();
    }
  }

  // ── Crear lote ─────────────────────────────────────────────────
  async openCrear(): Promise<void> {
    this.resetLoteForm();
    this.crearError = '';
    this.isCrearOpen = true;
    if (!this.paises.length || !this.sedes.length) {
      this.catalogosLoading = true;
      try {
        const [p, s] = await Promise.all([
          this.catalogosService.getPaises(),
          this.sedesService.getSedes(true),
        ]);
        this.paises = p; this.sedes = s;
      } catch {}
      this.catalogosLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeCrear(): void { this.isCrearOpen = false; }

  async submitCrear(): Promise<void> {
    const f = this.loteForm;
    if (!f.codigo_lote || !f.proveedor || !f.pais_origen ||
        !f.puerto_origen || !f.puerto_destino || !f.sede_destino || !f.total_unidades) {
      this.crearError = 'Completa todos los campos obligatorios.';
      return;
    }
    this.isCreando = true; this.crearError = '';
    try {
      const payload: any = {
        codigo_lote: f.codigo_lote, proveedor: f.proveedor,
        pais_origen: f.pais_origen, puerto_origen: f.puerto_origen,
        puerto_destino: f.puerto_destino, sede_destino: f.sede_destino,
        total_unidades: f.total_unidades, notas: f.notas,
      };
      if (f.fecha_orden_compra) payload.fecha_orden_compra = f.fecha_orden_compra;
      if (f.fecha_embarque_estimado) payload.fecha_embarque_estimado = f.fecha_embarque_estimado;
      if (f.fecha_llegada_estimada) payload.fecha_llegada_estimada = f.fecha_llegada_estimada;
      if (f.numero_contenedores) payload.numero_contenedores = f.numero_contenedores;
      if (f.valor_fob_usd) payload.valor_fob_usd = f.valor_fob_usd;

      const lote = await this.lotesService.createLote(payload);
      this.lotes.unshift(lote);
      this.applyFilters();
      this.closeCrear();
      this.openDetail(lote);
    } catch (e: any) {
      this.crearError = e.message || 'Error al crear lote';
    } finally {
      this.isCreando = false; this.cdr.detectChanges();
    }
  }

  // ── Manifiesto de vehículos ────────────────────────────────────
  async openManifiesto(): Promise<void> {
    this.resetVehiculoForm();
    this.vehiculosManifiesto = [];
    this.manifiestoError = '';
    this.manifiestoSuccess = '';
    this.isManifiestoOpen = true;
    if (!this.marcas.length) {
      this.isLoadingMarcas = true;
      try { this.marcas = await this.vehicleService.getMarcas(); } catch {}
      this.isLoadingMarcas = false;
      this.cdr.detectChanges();
    }
  }

  closeManifiesto(): void { this.isManifiestoOpen = false; }

  async onMarcaChange(): Promise<void> {
    this.vehiculoForm.modelo_id = 0; this.vehiculoForm.version_id = 0;
    this.modelos = []; this.versiones = [];
    if (!this.vehiculoForm.marca_id) return;
    this.isLoadingModelos = true;
    try { this.modelos = await this.vehicleService.getModelos(this.vehiculoForm.marca_id); } catch {}
    this.isLoadingModelos = false; this.cdr.detectChanges();
  }

  async onModeloChange(): Promise<void> {
    this.vehiculoForm.version_id = 0; this.versiones = [];
    if (!this.vehiculoForm.modelo_id) return;
    this.isLoadingVersiones = true;
    try { this.versiones = await this.vehicleService.getVersiones(this.vehiculoForm.modelo_id); } catch {}
    this.isLoadingVersiones = false; this.cdr.detectChanges();
  }

  agregarVehiculo(): void {
    const f = this.vehiculoForm;
    this.manifiestoError = '';
    if (!f.version_id || !f.vin.trim() || !f.color_exterior.trim()) {
      this.manifiestoError = 'Versión, VIN y color exterior son obligatorios.'; return;
    }
    if (this.vehiculosManifiesto.some(v => v.vin === f.vin.trim())) {
      this.manifiestoError = `VIN "${f.vin}" ya está en la lista.`; return;
    }
    const ver = this.versiones.find(v => v.id === f.version_id);
    const label = ver
      ? `${ver.modelo_detalle?.marca_detalle?.nombre || ''} ${ver.modelo_detalle?.nombre || ''} ${ver.nombre_version || ''}`.trim()
      : `Versión ${f.version_id}`;

    this.vehiculosManifiesto.push({
      version_id: f.version_id, version_label: label,
      vin: f.vin.trim(), color_exterior: f.color_exterior.trim(),
      color_interior: f.color_interior.trim(), numero_motor: f.numero_motor.trim(),
      numero_chasis: f.numero_chasis.trim(), precio_lista_sugerido: f.precio_lista_sugerido,
    });
    // Resetea solo los campos únicos por vehículo, mantiene marca/modelo/versión
    this.vehiculoForm.vin = '';
    this.vehiculoForm.color_exterior = '';
    this.vehiculoForm.color_interior = '';
    this.vehiculoForm.numero_motor = '';
    this.vehiculoForm.numero_chasis = '';
    this.vehiculoForm.precio_lista_sugerido = null;
    this.cdr.detectChanges();
  }

  quitarVehiculo(i: number): void { this.vehiculosManifiesto.splice(i, 1); }

  get vehiculosDelLote() {
    return this.selectedLote?.vehiculos ?? [];
  }

  get slotsDisponibles(): number {
    if (!this.selectedLote) return 0;
    return this.selectedLote.total_unidades - this.selectedLote.unidades_registradas;
  }

  async guardarManifiesto(): Promise<void> {
    if (!this.selectedLote || !this.vehiculosManifiesto.length) return;
    if (this.vehiculosManifiesto.length > this.slotsDisponibles) {
      this.manifiestoError = `Solo hay ${this.slotsDisponibles} slot(s) disponibles en este lote.`; return;
    }
    this.isGuardando = true; this.manifiestoError = ''; this.manifiestoSuccess = '';
    try {
      await this.lotesService.addVehiculos(
        this.selectedLote.id,
        this.vehiculosManifiesto.map(v => ({
          version_id: v.version_id, vin: v.vin,
          color_exterior: v.color_exterior, color_interior: v.color_interior,
          numero_motor: v.numero_motor, numero_chasis: v.numero_chasis,
          precio_lista_sugerido: v.precio_lista_sugerido,
        })),
      );
      // Refresca el lote para ver unidades actualizadas
      const updated = await this.lotesService.getLoteById(this.selectedLote.id);
      this.ngZone.run(() => {
        const idx = this.lotes.findIndex(l => l.id === updated.id);
        if (idx !== -1) this.lotes[idx] = updated;
        this.selectedLote = updated;
        this.applyFilters();
        this.manifiestoSuccess = `${this.vehiculosManifiesto.length} vehículo(s) registrado(s) correctamente.`;
        this.vehiculosManifiesto = [];
        this.resetVehiculoForm();
      });
    } catch (e: any) {
      this.manifiestoError = e.message || 'Error al guardar vehículos';
    } finally {
      this.isGuardando = false; this.cdr.detectChanges();
    }
  }

  // ── Helpers ────────────────────────────────────────────────────
  private resetLoteForm(): void {
    this.loteForm = {
      codigo_lote: '', proveedor: '', pais_origen: 0,
      puerto_origen: '', puerto_destino: '', sede_destino: 0,
      total_unidades: 1, fecha_orden_compra: '', fecha_embarque_estimado: '',
      fecha_llegada_estimada: '', numero_contenedores: null, valor_fob_usd: null, notas: '',
    };
  }

  private resetVehiculoForm(): void {
    this.vehiculoForm = {
      marca_id: 0, modelo_id: 0, version_id: 0,
      vin: '', color_exterior: '', color_interior: '',
      numero_motor: '', numero_chasis: '', precio_lista_sugerido: null,
    };
    this.modelos = []; this.versiones = [];
  }

  getCountByEstado(nombre: string): number {
    if (nombre === 'all') return this.lotes.length;
    return this.lotes.filter(l => l.estado_lote_nombre === nombre).length;
  }

  get lotesEnTransito(): number {
    return this.lotes.filter(l =>
      ['Embarcado','Tránsito Marítimo','En Puerto','Tránsito Nacional'].includes(l.estado_lote_nombre)
    ).length;
  }
  get lotesEnAduana(): number { return this.lotes.filter(l => l.estado_lote_nombre === 'En Aduana').length; }
  get lotesRecibidos(): number {
    return this.lotes.filter(l => ['Recibido en Sede','Distribuido'].includes(l.estado_lote_nombre)).length;
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES');
  }
  formatDateTime(d: string): string {
    return new Date(d).toLocaleDateString('es-ES') + ' ' +
      new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  getEtaLabel(l: LoteImportacion): string {
    if (l.fecha_llegada_real) return 'Llegó';
    if (l.eta_dias === null) return '—';
    if (l.eta_dias < 0) return `${Math.abs(l.eta_dias)}d retraso`;
    if (l.eta_dias === 0) return 'Hoy';
    return `${l.eta_dias}d restantes`;
  }
  getEtaColor(l: LoteImportacion): string {
    if (l.fecha_llegada_real) return 'text-green-400';
    if (l.eta_dias === null) return 'text-gray-400';
    if (l.eta_dias < 0) return 'text-red-400';
    if (l.eta_dias <= 7) return 'text-yellow-400';
    return 'text-blue-400';
  }
}
