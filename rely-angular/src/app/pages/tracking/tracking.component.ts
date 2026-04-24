import { Component, OnInit } from '@angular/core';

export type TrackingStatus = 'manufacturing' | 'in_transit' | 'delivered' | 'delayed';

export interface TrackingEvent {
  id: string;
  timestamp: string;
  location: string;
  status: string;
  description: string;
}

export interface TrackingData {
  id: string;
  vehicleId: string;
  customerName: string;
  referenceNumber: string;
  status: TrackingStatus;
  currentLocation: string;
  estimatedDelivery: string;
  lastUpdate: string;
  progress: number;
  trackingHistory: TrackingEvent[];
}

export const statusConfig: Record<TrackingStatus, { label: string; colorClass: string; textClass: string }> = {
  manufacturing: { label: 'En Manufactura', colorClass: 'bg-blue-600/20', textClass: 'text-blue-500' },
  in_transit: { label: 'En Tránsito', colorClass: 'bg-yellow-600/20', textClass: 'text-yellow-500' },
  delivered: { label: 'Entregado', colorClass: 'bg-green-600/20', textClass: 'text-green-500' },
  delayed: { label: 'Retrasado', colorClass: 'bg-red-600/20', textClass: 'text-red-500' },
};

const mockData: TrackingData[] = [
  {
    id: '1', vehicleId: 'RELY-T60-2026-001', customerName: 'Juan Pérez',
    referenceNumber: '123456789', status: 'in_transit',
    currentLocation: 'Centro de Distribución - Ciudad de México',
    estimatedDelivery: '2026-01-15', lastUpdate: '2026-01-10T14:30:00Z', progress: 75,
    trackingHistory: [
      { id: '1', timestamp: '2026-01-05T09:00:00Z', location: 'Planta de Manufactura', status: 'Fabricación Completada', description: 'Vehículo terminado y listo para envío' },
      { id: '2', timestamp: '2026-01-07T11:30:00Z', location: 'Centro de Distribución', status: 'En Tránsito', description: 'Vehículo en camino al centro de distribución' },
      { id: '3', timestamp: '2026-01-10T14:30:00Z', location: 'Centro de Distribución - CDMX', status: 'En Preparación', description: 'Preparando para entrega final' },
    ],
  },
  {
    id: '2', vehicleId: 'RELY-X7-2026-002', customerName: 'María González',
    referenceNumber: '987654321', status: 'delivered',
    currentLocation: 'Entregado - Guadalajara',
    estimatedDelivery: '2026-01-08', lastUpdate: '2026-01-08T16:45:00Z', progress: 100,
    trackingHistory: [
      { id: '1', timestamp: '2026-01-01T08:00:00Z', location: 'Planta de Manufactura', status: 'Fabricación Completada', description: 'Vehículo terminado y listo para envío' },
      { id: '2', timestamp: '2026-01-03T10:00:00Z', location: 'En Tránsito', status: 'Enviado', description: 'Vehículo en camino a destino final' },
      { id: '3', timestamp: '2026-01-08T16:45:00Z', location: 'Guadalajara', status: 'Entregado', description: 'Vehículo entregado exitosamente al cliente' },
    ],
  },
  {
    id: '3', vehicleId: 'RELY-T80-2026-003', customerName: 'Carlos Rodríguez',
    referenceNumber: '456789123', status: 'manufacturing',
    currentLocation: 'Planta de Manufactura - Línea 2',
    estimatedDelivery: '2026-01-25', lastUpdate: '2026-01-10T08:15:00Z', progress: 45,
    trackingHistory: [
      { id: '1', timestamp: '2026-01-08T07:00:00Z', location: 'Planta de Manufactura', status: 'Inicio de Producción', description: 'Comenzó el proceso de manufactura' },
      { id: '2', timestamp: '2026-01-10T08:15:00Z', location: 'Planta de Manufactura - Línea 2', status: 'En Producción', description: 'Vehículo en proceso de ensamblaje' },
    ],
  },
];

@Component({
  standalone: false,
  selector: 'app-tracking',
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.css'],
})
export class TrackingComponent implements OnInit {
  allData: TrackingData[] = mockData;
  filteredData: TrackingData[] = [];
  searchTerm = '';
  statusFilter = 'all';
  selectedTracking: TrackingData | null = null;
  isModalOpen = false;

  statusConfig = statusConfig;

  statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'manufacturing', label: 'Manufactura' },
    { value: 'in_transit', label: 'En Tránsito' },
    { value: 'delivered', label: 'Entregados' },
    { value: 'delayed', label: 'Retrasados' },
  ];

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allData];
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      result = result.filter(item =>
        item.vehicleId.toLowerCase().includes(t) ||
        item.customerName.toLowerCase().includes(t) ||
        item.referenceNumber.includes(this.searchTerm)
      );
    }
    if (this.statusFilter !== 'all') {
      result = result.filter(item => item.status === this.statusFilter);
    }
    this.filteredData = result;
  }

  setStatusFilter(value: string): void {
    this.statusFilter = value;
    this.applyFilters();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  openModal(tracking: TrackingData): void {
    this.selectedTracking = tracking;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedTracking = null;
  }

  getCount(status: string): number {
    if (status === 'all') return this.allData.length;
    return this.allData.filter(d => d.status === status).length;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES');
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES') + ' ' +
      new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateFull(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
