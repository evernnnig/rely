import { useState, useEffect } from 'react';
import { MapPin, Search, Truck, Clock, CheckCircle, AlertCircle, Navigation, Package, Route } from 'lucide-react';

interface TrackingData {
  id: string;
  vehicleId: string;
  customerName: string;
  referenceNumber: string;
  status: 'manufacturing' | 'in_transit' | 'delivered' | 'delayed';
  currentLocation: string;
  estimatedDelivery: string;
  lastUpdate: string;
  progress: number;
  trackingHistory: TrackingEvent[];
}

interface TrackingEvent {
  id: string;
  timestamp: string;
  location: string;
  status: string;
  description: string;
}

const mockTrackingData: TrackingData[] = [
  {
    id: '1',
    vehicleId: 'RELY-T60-2026-001',
    customerName: 'Juan Pérez',
    referenceNumber: '123456789',
    status: 'in_transit',
    currentLocation: 'Centro de Distribución - Ciudad de México',
    estimatedDelivery: '2026-01-15',
    lastUpdate: '2026-01-10T14:30:00Z',
    progress: 75,
    trackingHistory: [
      {
        id: '1',
        timestamp: '2026-01-05T09:00:00Z',
        location: 'Planta de Manufactura',
        status: 'Fabricación Completada',
        description: 'Vehículo terminado y listo para envío'
      },
      {
        id: '2',
        timestamp: '2026-01-07T11:30:00Z',
        location: 'Centro de Distribución',
        status: 'En Tránsito',
        description: 'Vehículo en camino al centro de distribución'
      },
      {
        id: '3',
        timestamp: '2026-01-10T14:30:00Z',
        location: 'Centro de Distribución - CDMX',
        status: 'En Preparación',
        description: 'Preparando para entrega final'
      }
    ]
  },
  {
    id: '2',
    vehicleId: 'RELY-X7-2026-002',
    customerName: 'María González',
    referenceNumber: '987654321',
    status: 'delivered',
    currentLocation: 'Entregado - Guadalajara',
    estimatedDelivery: '2026-01-08',
    lastUpdate: '2026-01-08T16:45:00Z',
    progress: 100,
    trackingHistory: [
      {
        id: '1',
        timestamp: '2026-01-01T08:00:00Z',
        location: 'Planta de Manufactura',
        status: 'Fabricación Completada',
        description: 'Vehículo terminado y listo para envío'
      },
      {
        id: '2',
        timestamp: '2026-01-03T10:00:00Z',
        location: 'En Tránsito',
        status: 'Enviado',
        description: 'Vehículo en camino a destino final'
      },
      {
        id: '3',
        timestamp: '2026-01-08T16:45:00Z',
        location: 'Guadalajara',
        status: 'Entregado',
        description: 'Vehículo entregado exitosamente al cliente'
      }
    ]
  },
  {
    id: '3',
    vehicleId: 'RELY-T80-2026-003',
    customerName: 'Carlos Rodríguez',
    referenceNumber: '456789123',
    status: 'manufacturing',
    currentLocation: 'Planta de Manufactura - Línea 2',
    estimatedDelivery: '2026-01-25',
    lastUpdate: '2026-01-10T08:15:00Z',
    progress: 45,
    trackingHistory: [
      {
        id: '1',
        timestamp: '2026-01-08T07:00:00Z',
        location: 'Planta de Manufactura',
        status: 'Inicio de Producción',
        description: 'Comenzó el proceso de manufactura'
      },
      {
        id: '2',
        timestamp: '2026-01-10T08:15:00Z',
        location: 'Planta de Manufactura - Línea 2',
        status: 'En Producción',
        description: 'Vehículo en proceso de ensamblaje'
      }
    ]
  }
];

const statusConfig = {
  manufacturing: {
    label: 'En Manufactura',
    color: 'bg-blue-600/20 text-blue-500',
    icon: Package
  },
  in_transit: {
    label: 'En Tránsito',
    color: 'bg-yellow-600/20 text-yellow-500',
    icon: Truck
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-green-600/20 text-green-500',
    icon: CheckCircle
  },
  delayed: {
    label: 'Retrasado',
    color: 'bg-red-600/20 text-red-500',
    icon: AlertCircle
  }
};

interface TrackingDetailsModalProps {
  tracking: TrackingData | null;
  isOpen: boolean;
  onClose: () => void;
}

function TrackingDetailsModal({ tracking, isOpen, onClose }: TrackingDetailsModalProps) {
  if (!isOpen || !tracking) return null;

  const StatusIcon = statusConfig[tracking.status].icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Detalles de Tracking</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="text-gray-400 text-xl">×</span>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información General */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Información del Vehículo</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      ID del Vehículo
                    </label>
                    <p className="text-white font-mono">{tracking.vehicleId}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Cliente
                    </label>
                    <p className="text-white">{tracking.customerName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Número de Referencia
                    </label>
                    <p className="text-orange-500 font-mono">{tracking.referenceNumber}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Estado Actual
                    </label>
                    <div className="flex items-center gap-2">
                      <StatusIcon size={20} className={statusConfig[tracking.status].color.split(' ')[1]} />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[tracking.status].color}`}>
                        {statusConfig[tracking.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4">Ubicación y Entrega</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Ubicación Actual
                    </label>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-orange-500" />
                      <p className="text-white">{tracking.currentLocation}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Entrega Estimada
                    </label>
                    <p className="text-white">
                      {new Date(tracking.estimatedDelivery).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Progreso
                    </label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Completado</span>
                        <span className="text-white">{tracking.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${tracking.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de Tracking */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Historial de Tracking</h3>
              <div className="space-y-4">
                {tracking.trackingHistory.map((event, index) => (
                  <div key={event.id} className="relative">
                    {index < tracking.trackingHistory.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-700"></div>
                    )}
                    <div className="flex gap-4">
                      <div className="bg-orange-600/20 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-white">{event.status}</h4>
                            <span className="text-xs text-gray-400">
                              {new Date(event.timestamp).toLocaleDateString('es-ES')} {' '}
                              {new Date(event.timestamp).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-1">{event.location}</p>
                          <p className="text-gray-300 text-sm">{event.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-700">
            <button className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
              <Navigation size={20} />
              Ver en Mapa
            </button>
            <button className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors">
              Notificar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VehicleTracking() {
  const [trackingData, setTrackingData] = useState<TrackingData[]>(mockTrackingData);
  const [filteredData, setFilteredData] = useState<TrackingData[]>(mockTrackingData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<TrackingData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let filtered = trackingData;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.referenceNumber.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredData(filtered);
  }, [searchTerm, statusFilter, trackingData]);

  const handleViewTracking = (tracking: TrackingData) => {
    setSelectedTracking(tracking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTracking(null);
  };

  const getStatusCounts = () => {
    return {
      all: trackingData.length,
      manufacturing: trackingData.filter(item => item.status === 'manufacturing').length,
      in_transit: trackingData.filter(item => item.status === 'in_transit').length,
      delivered: trackingData.filter(item => item.status === 'delivered').length,
      delayed: trackingData.filter(item => item.status === 'delayed').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tracking de Vehículos
          </h1>
          <p className="text-xl text-gray-400">
            Monitorea el estado y ubicación de todos los vehículos
          </p>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Buscar por ID de vehículo, cliente o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Todos ({statusCounts.all})
              </button>
              <button
                onClick={() => setStatusFilter('manufacturing')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  statusFilter === 'manufacturing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Manufactura ({statusCounts.manufacturing})
              </button>
              <button
                onClick={() => setStatusFilter('in_transit')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  statusFilter === 'in_transit'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                En Tránsito ({statusCounts.in_transit})
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  statusFilter === 'delivered'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Entregados ({statusCounts.delivered})
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600/20 p-3 rounded-lg">
                <Package className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">En Manufactura</p>
                <p className="text-2xl font-bold text-white">{statusCounts.manufacturing}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-600/20 p-3 rounded-lg">
                <Truck className="text-yellow-500" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">En Tránsito</p>
                <p className="text-2xl font-bold text-white">{statusCounts.in_transit}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-600/20 p-3 rounded-lg">
                <CheckCircle className="text-green-500" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Entregados</p>
                <p className="text-2xl font-bold text-white">{statusCounts.delivered}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-600/20 p-3 rounded-lg">
                <Route className="text-orange-500" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Activos</p>
                <p className="text-2xl font-bold text-white">{statusCounts.all}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Tracking */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">
              Vehículos en Seguimiento ({filteredData.length})
            </h3>
          </div>

          {filteredData.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="mx-auto text-gray-600 mb-4" size={48} />
              <p className="text-gray-400">No se encontraron vehículos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredData.map((tracking) => {
                const StatusIcon = statusConfig[tracking.status].icon;
                return (
                  <div
                    key={tracking.id}
                    className="bg-gray-900/50 rounded-xl border border-gray-700 p-6 hover:border-orange-600 transition-all cursor-pointer"
                    onClick={() => handleViewTracking(tracking)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-bold text-lg mb-1">
                          {tracking.vehicleId}
                        </h4>
                        <p className="text-gray-400">{tracking.customerName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon size={16} className={statusConfig[tracking.status].color.split(' ')[1]} />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[tracking.status].color}`}>
                          {statusConfig[tracking.status].label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MapPin size={14} />
                        <span className="truncate">{tracking.currentLocation}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock size={14} />
                        <span>
                          Entrega: {new Date(tracking.estimatedDelivery).toLocaleDateString('es-ES')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progreso</span>
                          <span className="text-white">{tracking.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${tracking.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-500">
                        Ref: {tracking.referenceNumber}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TrackingDetailsModal
        tracking={selectedTracking}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}