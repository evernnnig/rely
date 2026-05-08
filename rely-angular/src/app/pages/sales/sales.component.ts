import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { VentasService, CreateVentaPayload } from '../../services/ventas.service';
import { VehicleService, VehiculoInventario } from '../../services/vehiculos.service';
import { CatalogosService, Pais, EstadoVenezuela, EntidadFinanciera, MetodoPago  } from '../../services/catalogos.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PdfVentaService } from '../../services/pdf-venta.service';
import { DatosVentaPDF } from '../../services/pdf-venta.service';

// Interfaces mejoradas con tipos más específicos
interface VehicleFormData {
  firstName: string;
  lastName: string;
  nacionalidad: string;
  identificacion: string;
  email: string;
  phone1: string;
  phone2: string;
  direccion: string;
  estado: string;
  vehiculoId: number | null;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  price: string;
  montoTotal: number | null;
  moneda: string;
  montoInicial: number | null;
  tasaCambio: number | null;
  metodoPago: string;
  entidadFinanciera: string;
  referenciaPago: string;
  fechaPago: string;
  numeroCuotas: string;
  numeroCuenta: string;
  ultimosDigitosTarjeta: string;
  urlComprobante: string;
  notes: string;
}

interface VersionGroup {
  readonly nombre: string;
  readonly modelo: string;
  readonly marca: string;
  readonly version: string;
  readonly motorizacion: string;
  readonly transmision: string;
  readonly precio: string;
  readonly cantidad: number;
  readonly vehiculos: VehiculoInventario[];
  readonly colores: ColorGroup[];
}

interface ColorGroup {
  readonly color: string;
  readonly cantidad: number;
  readonly vehiculos: VehiculoInventario[];
}

// Constantes para validación y configuración
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{7,15}$/;
const IDENTIFICATION_REGEX = /^[a-zA-Z0-9\-]{3,20}$/;
const MAX_MONTO = 999999999.99;
const MIN_YEAR = 1900;

@Component({
  standalone: false,
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
})
export class SalesComponent implements OnInit, OnDestroy {
  // Estado del formulario
  formData: VehicleFormData = this.createEmptyForm();
  isSubmitted = false;
  submittedRef = '';
  isLoading = false;
  error = '';
  successMessage = '';

  // Estado de carga
  paginaCargada = false;
  errorCargaInicial = '';
  private subscriptions = new Subscription();

  // Datos de vehículos
  vehiculos: VehiculoInventario[] = [];
  versionesAgrupadas: VersionGroup[] = [];
  versionSeleccionada: VersionGroup | null = null;
  colorSeleccionado: ColorGroup | null = null;
  vehiculoSeleccionado: VehiculoInventario | null = null;
  cargandoInventario = false;
  
  paso: 'versiones' | 'colores' | 'unidades' | 'seleccionado' = 'versiones';

  // Catálogos
  paises: Pais[] = [];
  estadosVenezuela: EstadoVenezuela[] = [];
  entidadesFinancieras: EntidadFinanciera[] = [];
  metodosPago: MetodoPago[] = [];
  cargandoCatalogos = false;

  // Configuración de métodos de pago y monedas
  readonly paymentMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia Bancaria' },
    { value: 'financiamiento', label: 'Financiamiento' },
    { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
    { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'criptomoneda', label: 'Criptomoneda' },
    { value: 'otro', label: 'Otro' },
  ] as const;

  readonly monedas = [
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'VES', label: 'VES - Bolívar Digital' },
    { value: 'COP', label: 'COP - Peso Colombiano' },
  ] as const;

  mostrarConfirmacion = false;
  ultimaVentaCreada: any = null;

  // Mapa de colores mejorado con más variantes
  private readonly colorHexMap: Record<string, string> = {
    'blanco': '#FFFFFF', 'blanco perla': '#F5F5F0', 'blanco polar': '#F0F0F0',
    'negro': '#1A1A1A', 'negro obsidiana': '#0A0A0A', 'negro midnight': '#191970',
    'gris': '#808080', 'gris titanio': '#6B6B6B', 'gris oscuro': '#404040',
    'plata': '#C0C0C0', 'plata metálico': '#A8A9AD', 'plata hielo': '#D9D9D9',
    'azul': '#0066CC', 'azul océano': '#1E3F66', 'azul metálico': '#2E5090',
    'azul cielo': '#87CEEB', 'azul marino': '#000080',
    'rojo': '#CC0000', 'rojo carmesí': '#DC143C', 'rojo metálico': '#B22222',
    'rojo fuego': '#FF4500', 'rojo vino': '#8B0000',
    'verde': '#008000', 'verde oscuro': '#006400', 'verde lima': '#32CD32',
    'verde bosque': '#228B22', 'verde militar': '#556B2F',
    'amarillo': '#FFD700', 'amarillo oro': '#FFDF00',
    'naranja': '#FF6600', 'naranja quemado': '#CC5500',
    'marrón': '#8B4513', 'marrón café': '#6F4E37',
    'beige': '#F5F5DC', 'beige arena': '#C2B280',
    'dorado': '#FFD700', 'dorado champagne': '#F7E7CE',
    'bronce': '#CD7F32', 'bronce antiguo': '#8B6914',
    'vino': '#722F37', 'vino tinto': '#4A0404',
    'turquesa': '#40E0D0', 'turquesa oscuro': '#00CED1',
    'morado': '#800080', 'púrpura': '#6A0DAD',
    'rosa': '#FF69B4', 'rosa pastel': '#FFB6C1',
  };

constructor(
  private readonly ventasService: VentasService,
  private readonly vehicleService: VehicleService,
  private readonly catalogosService: CatalogosService,
  private readonly pdfVentaService: PdfVentaService, // Agregar esta línea
  private readonly router: Router,
  private readonly cdr: ChangeDetectorRef
) {}

  generarYDescargarPDF(): void {
  if (!this.ultimaVentaCreada) return;
  
  const datosPDF = this.prepararDatosPDF();
  const pdfBlob = this.pdfVentaService.generarPDFVenta(datosPDF);
  const nombreArchivo = `Comprobante-Compra-${this.submittedRef}.pdf`;
  this.pdfVentaService.descargarPDF(pdfBlob, nombreArchivo);
}

private obtenerNombrePais(id: string): string {
  const pais = this.paises.find(p => p.id.toString() === id);
  return pais ? pais.nombre : id;
}

private obtenerNombreEstado(id: string): string {
  const estado = this.estadosVenezuela.find(e => e.id.toString() === id);
  return estado ? estado.nombre : id;
}

private obtenerNombreEntidad(id: string): string {
  const entidad = this.entidadesFinancieras.find(e => e.id.toString() === id);
  return entidad ? entidad.nombre : id;
}

private prepararDatosPDF(): any {
  const vehiculo = this.vehiculoSeleccionado;
  const version = this.versionSeleccionada;
  
  return {
    codigoOrden: this.submittedRef,
    fechaVenta: new Date().toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    cliente: {
      nombres: this.formData.firstName,
      apellidos: this.formData.lastName,
      nacionalidad: this.obtenerNombrePais(this.formData.nacionalidad),
      identificacion: this.formData.identificacion,
      email: this.formData.email,
      telefono: this.formData.phone1,
      direccion: this.formData.direccion,
      estado: this.obtenerNombreEstado(this.formData.estado),
    },
    vehiculo: {
      marca: vehiculo?.version?.modelo_detalle?.marca_detalle?.nombre || '',
      modelo: vehiculo?.version?.modelo_detalle?.nombre || '',
      version: vehiculo?.version?.nombre_version || '',
      año: this.formData.vehicleYear,
      color: this.formData.vehicleColor,
      motorizacion: version?.motorizacion || 'No especificada',
      transmision: version?.transmision || 'No especificada',
      vin: vehiculo?.vin || 'No disponible',
      numeroMotor: vehiculo?.numero_motor || 'No disponible',
      numeroChasis: vehiculo?.numero_chasis || 'No disponible',
      ubicacion: vehiculo?.ubicacion_detalle?.nombre || 'No especificada',
    },
    pago: {
      precioLista: parseFloat(this.formData.price) || 0,
      moneda: this.formData.moneda,
      montoTotal: this.formData.montoTotal || 0,
      montoInicial: this.formData.montoInicial || 0,
      saldoRestante: (this.formData.montoTotal || 0) - (this.formData.montoInicial || 0),
      metodoPago: this.getNombreMetodoPago(this.formData.metodoPago),
      entidadFinanciera: this.formData.entidadFinanciera ? 
        this.obtenerNombreEntidad(this.formData.entidadFinanciera) : undefined,
      referencia: this.formData.referenciaPago,
      fechaPago: new Date(this.formData.fechaPago + 'T12:00:00').toLocaleDateString('es-VE'),
      cuotas: this.formData.numeroCuotas ? parseInt(this.formData.numeroCuotas) : undefined,
      montoCuota: this.formData.numeroCuotas ? this.montoPorCuota : undefined,
      tasaCambio: this.formData.tasaCambio || undefined,
      numeroCuenta: this.formData.numeroCuenta || undefined,
      ultimosDigitosTarjeta: this.formData.ultimosDigitosTarjeta || undefined,
    },
    notas: this.formData.notes || undefined,
  };
}

  ngOnInit(): void {
    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Métodos de inicialización
  private async inicializarComponente(): Promise<void> {
    console.log('🔄 Iniciando carga de datos...');
    this.paginaCargada = false;
    
    try {
      await Promise.all([
        this.cargarInventario(),
        this.cargarCatalogos()
      ]);
      
      this.paginaCargada = true;
      this.detectarCambios();
      console.log('✅ Página completamente cargada');
      
    } catch (error) {
      console.error('❌ Error en carga inicial:', error);
      this.errorCargaInicial = 'Error al cargar los datos. Intente recargar la página.';
      this.paginaCargada = true;
      this.detectarCambios();
    }
  }

  // Métodos de carga de datos
  private async cargarInventario(): Promise<void> {
    this.cargandoInventario = true;
    try {
      this.vehiculos = await this.vehicleService.getInventarioReservable();
      this.agruparPorVersion();
      console.log('✅ Inventario cargado:', this.vehiculos.length, 'vehículos');
    } catch (err) {
      console.error('❌ Error inventario:', err);
      throw new Error('No se pudo cargar el inventario de vehículos');
    } finally {
      this.cargandoInventario = false;
      this.detectarCambios();
    }
  }

  private async cargarCatalogos(): Promise<void> {
    this.cargandoCatalogos = true;
    try {
      const [paises, estados, entidades, metodos] = await Promise.all([
        this.catalogosService.getPaises(),
        this.catalogosService.getEstadosVenezuela(),
        this.catalogosService.getEntidadesFinancieras(),
        this.catalogosService.getMetodosPago(),
      ]);
      this.paises = paises || [];
      this.estadosVenezuela = estados || [];
      this.entidadesFinancieras = entidades || [];
      this.metodosPago = metodos || [];
      console.log('✅ Catálogos cargados');
    } catch (error) {
      console.error('❌ Error catálogos:', error);
      throw new Error('No se pudieron cargar los catálogos');
    } finally {
      this.cargandoCatalogos = false;
      this.detectarCambios();
    }
  }

  // Métodos de agrupación de vehículos
  private agruparPorVersion(): void {
    if (!this.vehiculos?.length) {
      this.versionesAgrupadas = [];
      return;
    }

    const grupos = this.agruparVehiculosPorVersion();
    this.versionesAgrupadas = this.crearGruposVersion(grupos);
  }

  private agruparVehiculosPorVersion(): Map<string, VehiculoInventario[]> {
    const grupos = new Map<string, VehiculoInventario[]>();
    
    for (const vehiculo of this.vehiculos) {
      if (!this.esVehiculoValido(vehiculo)) continue;
      
      const key = this.generarClaveVersion(vehiculo);
      if (!grupos.has(key)) {
        grupos.set(key, []);
      }
      grupos.get(key)!.push(vehiculo);
    }
    
    return grupos;
  }

  private generarClaveVersion(vehiculo: VehiculoInventario): string {
    const marca = vehiculo.version?.modelo_detalle?.marca_detalle?.nombre || 'Sin marca';
    const modelo = vehiculo.version?.modelo_detalle?.nombre || 'Sin modelo';
    const version = vehiculo.version?.nombre_version || 'Sin versión';
    return `${marca}-${modelo}-${version}`;
  }

  private esVehiculoValido(vehiculo: VehiculoInventario): boolean {
    return !!(vehiculo && vehiculo.version && vehiculo.version.modelo_detalle);
  }

  private crearGruposVersion(grupos: Map<string, VehiculoInventario[]>): VersionGroup[] {
    return Array.from(grupos.entries()).map(([key, vehiculos]) => {
      const primerVehiculo = vehiculos[0];
      const colores = this.agruparPorColores(vehiculos);
      
      return {
        nombre: key,
        modelo: primerVehiculo.version.modelo_detalle.nombre,
        marca: primerVehiculo.version.modelo_detalle.marca_detalle.nombre,
        version: primerVehiculo.version.nombre_version,
        motorizacion: primerVehiculo.version.motorizacion || 'No especificada',
        transmision: primerVehiculo.version.transmision || 'No especificada',
        precio: primerVehiculo.precio_lista_sugerido || '0',
        cantidad: vehiculos.length,
        vehiculos,
        colores
      };
    });
  }

  private agruparPorColores(vehiculos: VehiculoInventario[]): ColorGroup[] {
    const colorMap = new Map<string, VehiculoInventario[]>();
    
    for (const v of vehiculos) {
      const color = this.sanitizarColor(v.color_exterior);
      if (!colorMap.has(color)) {
        colorMap.set(color, []);
      }
      colorMap.get(color)!.push(v);
    }
    
    return Array.from(colorMap.entries()).map(([color, vehiculosColor]) => ({
      color,
      cantidad: vehiculosColor.length,
      vehiculos: vehiculosColor
    }));
  }

  private sanitizarColor(color: string | null | undefined): string {
    if (!color || typeof color !== 'string') return 'Sin color';
    return color.trim() || 'Sin color';
  }

  // Métodos de selección de vehículos
  seleccionarVersion(version: VersionGroup): void {
    if (!version) return;
    
    this.versionSeleccionada = version;
    this.colorSeleccionado = null;
    this.vehiculoSeleccionado = null;
    this.paso = 'colores';
    
    this.actualizarDatosVersion(version);
    this.detectarCambios();
  }

  private actualizarDatosVersion(version: VersionGroup): void {
    this.formData.vehicleModel = this.sanitizarString(`${version.marca} ${version.modelo} ${version.version}`);
    this.formData.price = this.sanitizarString(version.precio);
    this.formData.montoTotal = this.parseMonto(version.precio);
    
    if (version.vehiculos[0]?.version?.año_modelo) {
      this.formData.vehicleYear = this.obtenerAño(version.vehiculos[0].version.año_modelo);
    }
  }

  seleccionarColor(colorGroup: ColorGroup): void {
    if (!colorGroup) return;
    
    this.colorSeleccionado = colorGroup;
    this.vehiculoSeleccionado = null;
    this.paso = 'unidades';
    this.formData.vehicleColor = this.sanitizarString(colorGroup.color);
    this.detectarCambios();
  }

  seleccionarUnidad(vehiculo: VehiculoInventario): void {
    if (!vehiculo) return;
    
    this.vehiculoSeleccionado = vehiculo;
    this.paso = 'seleccionado';
    this.actualizarDatosUnidad(vehiculo);
    console.log('✅ Vehículo seleccionado - ID:', vehiculo.id);
    this.detectarCambios();
  }

  private actualizarDatosUnidad(vehiculo: VehiculoInventario): void {
    this.formData.vehiculoId = vehiculo.id;
    this.formData.price = this.sanitizarString(vehiculo.precio_lista_sugerido);
    this.formData.montoTotal = this.parseMonto(vehiculo.precio_lista_sugerido);
    this.formData.vehicleModel = this.generarModeloCompleto(vehiculo);
    this.formData.vehicleColor = this.sanitizarString(vehiculo.color_exterior);
    
    if (vehiculo.version?.año_modelo) {
      this.formData.vehicleYear = this.obtenerAño(vehiculo.version.año_modelo);
    }
  }

  private generarModeloCompleto(vehiculo: VehiculoInventario): string {
    const marca = vehiculo.version?.modelo_detalle?.marca_detalle?.nombre || 'Sin marca';
    const modelo = vehiculo.version?.modelo_detalle?.nombre || 'Sin modelo';
    const version = vehiculo.version?.nombre_version || 'Sin versión';
    return `${marca} ${modelo} ${version}`;
  }

  // Métodos de navegación entre pasos
  volverAColores(): void {
    this.colorSeleccionado = null;
    this.vehiculoSeleccionado = null;
    this.paso = 'colores';
    this.detectarCambios();
  }

  volverAVersiones(): void {
    this.limpiarSeleccionVehiculo();
    this.paso = 'versiones';
    this.detectarCambios();
  }

  limpiarSeleccion(): void {
    this.limpiarSeleccionVehiculo();
    this.paso = 'versiones';
    this.formData.vehicleYear = new Date().getFullYear().toString();
    this.detectarCambios();
  }

  private limpiarSeleccionVehiculo(): void {
    this.versionSeleccionada = null;
    this.colorSeleccionado = null;
    this.vehiculoSeleccionado = null;
    this.formData.vehicleModel = '';
    this.formData.vehicleColor = '';
    this.formData.price = '';
    this.formData.montoTotal = null;
    this.formData.vehiculoId = null;
  }

  // Métodos de utilidad
  getColorHex(colorName: string): string {
    if (!colorName) return '#4B5563';
    
    const colorLower = colorName.toLowerCase().trim();
    
    // Búsqueda exacta
    if (this.colorHexMap[colorLower]) {
      return this.colorHexMap[colorLower];
    }
    
    // Búsqueda parcial
    for (const [key, value] of Object.entries(this.colorHexMap)) {
      if (colorLower.includes(key)) {
        return value;
      }
    }
    
    return '#4B5563';
  }

  get montoPorCuota(): number {
    const montoRestante = this.calcularMontoRestante();
    const cuotas = Math.max(1, parseInt(this.formData.numeroCuotas) || 1);
    return montoRestante > 0 ? montoRestante / cuotas : 0;
  }

  get esPreReservable(): boolean {
    return !!this.vehiculoSeleccionado && [3, 4, 5].includes(this.vehiculoSeleccionado.estado);
  }

  get etiquetaAccion(): string {
    return this.esPreReservable ? 'Pre-reservar Vehículo' : 'Registrar Venta';
  }

  get catalogosListos(): boolean {
    return this.paises.length > 0 && 
           this.estadosVenezuela.length > 0 && 
           this.entidadesFinancieras.length > 0;
  }

  private calcularMontoRestante(): number {
    return (this.formData.montoTotal || 0) - (this.formData.montoInicial || 0);
  }

  private sanitizarString(valor: string | null | undefined): string {
    if (!valor || typeof valor !== 'string') return '';
    return valor.trim().replace(/[<>]/g, ''); // Prevenir XSS básico
  }

  private parseMonto(valor: string | number | null | undefined): number | null {
    if (valor === null || valor === undefined) return null;
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    return isNaN(numero) || numero < 0 ? null : Math.min(numero, MAX_MONTO);
  }

  private obtenerAño(fecha: string | Date | null | undefined): string {
    if (!fecha) return new Date().getFullYear().toString();
    try {
      const año = new Date(fecha).getFullYear();
      return año >= MIN_YEAR ? año.toString() : new Date().getFullYear().toString();
    } catch {
      return new Date().getFullYear().toString();
    }
  }

  private detectarCambios(): void {
    try {
      this.cdr.detectChanges();
    } catch (error) {
      console.warn('Error al detectar cambios:', error);
    }
  }

  // Métodos de formulario
  createEmptyForm(): VehicleFormData {
    return {
      firstName: '', lastName: '', email: '', phone1: '', phone2: '',
      identificacion: '', direccion: '', estado: '', nacionalidad: '',
      vehicleModel: '', vehicleYear: new Date().getFullYear().toString(),
      vehicleColor: '', price: '', vehiculoId: null,
      montoTotal: null, moneda: 'USD', montoInicial: null, tasaCambio: null,
      metodoPago: '', entidadFinanciera: '', referenciaPago: '',
      fechaPago: new Date().toISOString().split('T')[0], numeroCuotas: '',
      numeroCuenta: '', ultimosDigitosTarjeta: '', urlComprobante: '', notes: '',
    };
  }

  // Validación mejorada
  private validarFormulario(): boolean {
    this.error = '';
    
    if (!this.vehiculoSeleccionado) {
      this.error = 'Debe seleccionar un vehículo del inventario';
      return false;
    }

    if (!this.vehiculoSeleccionado.id) {
      this.error = 'Error: El vehículo seleccionado no tiene un ID válido';
      return false;
    }

    this.formData.vehiculoId = this.vehiculoSeleccionado.id;
    
    return this.validarCamposRequeridos() && 
           this.validarMontos() && 
           this.validarFormatoEmail() &&
           this.validarMetodoPago();
  }

  private validarCamposRequeridos(): boolean {
    const camposRequeridos: { campo: keyof VehicleFormData; nombre: string }[] = [
      { campo: 'firstName', nombre: 'Nombres' },
      { campo: 'lastName', nombre: 'Apellidos' },
      { campo: 'email', nombre: 'Email' },
      { campo: 'phone1', nombre: 'Teléfono 1' },
      { campo: 'identificacion', nombre: 'Identificación' },
      { campo: 'direccion', nombre: 'Dirección' },
      { campo: 'estado', nombre: 'Estado' },
      { campo: 'nacionalidad', nombre: 'Nacionalidad' },
      { campo: 'vehicleModel', nombre: 'Modelo del vehículo' },
      { campo: 'vehicleColor', nombre: 'Color del vehículo' },
      { campo: 'metodoPago', nombre: 'Método de pago' },
      { campo: 'referenciaPago', nombre: 'Número de referencia' },
      { campo: 'fechaPago', nombre: 'Fecha de pago' },
      { campo: 'moneda', nombre: 'Moneda' },
    ];

    for (const { campo, nombre } of camposRequeridos) {
      const valor = this.formData[campo];
      if (!valor || (typeof valor === 'string' && !valor.trim())) {
        this.error = `El campo "${nombre}" es obligatorio`;
        return false;
      }
    }
    
    return true;
  }

  private validarMontos(): boolean {
    const montoTotal = this.formData.montoTotal;
    
    if (!montoTotal || montoTotal <= 0) {
      this.error = 'El monto total debe ser mayor a 0';
      return false;
    }

    if (montoTotal > MAX_MONTO) {
      this.error = `El monto total no puede exceder ${MAX_MONTO.toLocaleString()}`;
      return false;
    }

    const montoInicial = this.formData.montoInicial;
    if (montoInicial !== null && montoInicial !== undefined) {
      if (montoInicial < 0) {
        this.error = 'El monto inicial no puede ser negativo';
        return false;
      }
      
      if (montoInicial > montoTotal) {
        this.error = 'El monto inicial no puede ser mayor al monto total';
        return false;
      }
    }

    return true;
  }

  private validarFormatoEmail(): boolean {
    const email = this.formData.email.trim();
    if (!EMAIL_REGEX.test(email)) {
      this.error = 'El formato del email no es válido';
      return false;
    }
    
    if (email.length > 254) { // Límite RFC 5321
      this.error = 'El email es demasiado largo';
      return false;
    }
    
    return true;
  }

  private validarMetodoPago(): boolean {
    const metodoPago = this.formData.metodoPago;

      if (!this.formData.metodoPago || this.formData.metodoPago === '') {
    this.error = 'Debe seleccionar un método de pago';
    return false;
  }
  
  // Validar campos específicos según método de pago (usando IDs)
  if (this.formData.metodoPago === '2' && !this.formData.numeroCuenta) {
    this.error = 'Debe ingresar el número de cuenta para transferencias';
    return false;
  }

  if ((this.formData.metodoPago === '4' || this.formData.metodoPago === '5') 
      && !this.formData.ultimosDigitosTarjeta) {
    this.error = 'Debe ingresar los últimos 4 dígitos de la tarjeta';
    return false;
  }

    // Validar formato de últimos 4 dígitos
    if (this.formData.ultimosDigitosTarjeta && !/^\d{4}$/.test(this.formData.ultimosDigitosTarjeta)) {
      this.error = 'Los últimos 4 dígitos de la tarjeta deben ser numéricos';
      return false;
    }

    // Validar número de cuenta bancaria
    if (this.formData.numeroCuenta && this.formData.numeroCuenta.length > 20) {
      this.error = 'El número de cuenta es demasiado largo';
      return false;
    }

    return true;
  }

  // Método principal de envío
  async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.error = '';
    this.successMessage = '';

    if (!this.validarFormulario()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const vehiculoId = this.obtenerVehiculoId();
    if (!vehiculoId) {
      this.error = 'Error: No se pudo obtener el ID del vehículo';
      return;
    }

    this.isLoading = true;

    try {
      const payload = this.construirPayload(vehiculoId);
      console.log('📤 Payload:', JSON.stringify(payload));

      const venta = await this.ventasService.crearVenta(payload);
      
      this.procesarVentaExitosa(venta);

    } catch (err) {
      this.manejarErrorVenta(err);
    } finally {
      this.isLoading = false;
      this.detectarCambios();
    }
  }

  private obtenerVehiculoId(): number | null {
    return this.formData.vehiculoId || this.vehiculoSeleccionado?.id || null;
  }

  private construirPayload(vehiculoId: number): CreateVentaPayload {
    return {
      first_name: this.sanitizarString(this.formData.firstName),
      last_name: this.sanitizarString(this.formData.lastName),
      email: this.formData.email.trim().toLowerCase(),
      phone1: this.sanitizarString(this.formData.phone1),
      phone2: this.sanitizarString(this.formData.phone2),
      identificacion: this.sanitizarString(this.formData.identificacion),
      nacionalidad: this.formData.nacionalidad,
      direccion: this.sanitizarString(this.formData.direccion),
      estado: this.formData.estado,
      vehiculo_id: vehiculoId,
      vehicleModel: this.formData.vehicleModel,
      vehicleYear: this.formData.vehicleYear ? parseInt(this.formData.vehicleYear) : undefined,
      vehicleColor: this.formData.vehicleColor,
      price: this.formData.montoTotal || 0,
      moneda: this.formData.moneda,
      monto_inicial: this.formData.montoInicial || 0,
      tasa_cambio: this.formData.tasaCambio || undefined,
      paymentMethod: this.formData.metodoPago,
      entidad_financiera: this.formData.entidadFinanciera,
      reference_number: this.sanitizarString(this.formData.referenciaPago),
      fecha_pago: this.formData.fechaPago,
      numero_cuotas: this.formData.numeroCuotas ? parseInt(this.formData.numeroCuotas) : undefined,
      numero_cuenta: this.formData.numeroCuenta?.trim() || undefined,
      ultimos_digitos_tarjeta: this.formData.ultimosDigitosTarjeta?.trim() || undefined,
      url_comprobante: this.formData.urlComprobante?.trim() || undefined,
      notes: this.formData.notes?.trim() || undefined,
    };
  }

  private procesarVentaExitosa(venta: any): void {
    this.ultimaVentaCreada = {
      referencia: venta.codigo_orden,
      id: venta.id,
      fecha: new Date().toLocaleString()
    };
    
    this.isSubmitted = true;
    this.mostrarConfirmacion = true;
    this.submittedRef = venta.codigo_orden;
    this.successMessage = 'Venta registrada exitosamente';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private manejarErrorVenta(err: unknown): void {
    console.error('❌ Error:', err);
    
    if (err instanceof Error) {
      this.error = err.message;
    } else if (typeof err === 'string') {
      this.error = err;
    } else {
      this.error = 'Error al registrar la venta. Intente nuevamente.';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Métodos de limpieza y navegación
  clearForm(): void {
    if (this.isLoading) return;
    
    const confirmar = confirm('¿Está seguro de que desea limpiar todo el formulario?');
    if (confirmar) {
      this.formData = this.createEmptyForm();
      this.limpiarSeleccion();
      this.error = '';
      this.successMessage = '';
      this.isSubmitted = false;
      this.submittedRef = '';
      this.detectarCambios();
    }
  }

  // En sales.component.ts
getNombreMetodoPago(id: string): string {
  const metodo = this.metodosPago.find(m => m.id.toString() === id);
  return metodo ? metodo.nombre : id;
}

  nuevaVenta(): void {
    this.formData = this.createEmptyForm();
    this.limpiarSeleccion();
    this.isSubmitted = false;
    this.submittedRef = '';
    this.successMessage = '';
    this.mostrarConfirmacion = false;
    this.ultimaVentaCreada = null;
    
    this.cargarInventario().catch(err => {
      console.error('Error al recargar inventario:', err);
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  irAOrdenes(): void {
    this.router.navigate(['/orders']).catch(err => {
      console.error('Error al navegar a órdenes:', err);
    });
  }

  // Método para prevenir inyección en notas
  sanitizeNotes(notes: string): string {
    if (!notes) return '';
    return notes
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .trim();
  }
}