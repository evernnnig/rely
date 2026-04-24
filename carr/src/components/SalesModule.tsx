import { useState } from 'react';
import { Car, DollarSign, User, Phone, Mail, FileText, Check } from 'lucide-react';
import { createOrder } from '../services/ventasService';

interface VehicleFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  price: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
}

interface SubmissionState {
  isSubmitted: boolean;
  referenceNumber: string;
}

const vehicleModels = [
  'RELY T60 Standard',
  'RELY T60 Premium',
  'RELY T80 4x4',
  'RELY T80 Luxury',
  'RELY X7 SUV',
  'RELY X7 Sport',
];

const vehicleColors = [
  'Blanco Perla',
  'Negro Obsidiana',
  'Gris Titanio',
  'Azul Océano',
  'Rojo Carmesí',
  'Plata Metálico',
];

const paymentMethods = [
  'Efectivo',
  'Transferencia Bancaria',
  'Financiamiento',
  'Tarjeta de Crédito',
  'Cheque Certificado',
];

const emptyForm: VehicleFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  vehicleModel: '',
  vehicleYear: new Date().getFullYear().toString(),
  vehicleColor: '',
  price: '',
  paymentMethod: '',
  referenceNumber: '',
  notes: '',
};

export default function SalesModule() {
  const [formData, setFormData] = useState<VehicleFormData>(emptyForm);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ isSubmitted: false, referenceNumber: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const requiredFields: (keyof VehicleFormData)[] = [
      'firstName', 'lastName', 'email', 'phone',
      'vehicleModel', 'vehicleColor', 'price', 'paymentMethod', 'referenceNumber',
    ];
    if (requiredFields.some(f => !formData[f])) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!/^\d+$/.test(formData.referenceNumber)) {
      setError('El número de referencia debe contener solo dígitos');
      return;
    }

    setIsLoading(true);
    try {
      await createOrder({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        reference_number: formData.referenceNumber,
        price: parseFloat(formData.price),
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear ? parseInt(formData.vehicleYear) : undefined,
        vehicleColor: formData.vehicleColor,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      });

      setSubmissionState({ isSubmitted: true, referenceNumber: formData.referenceNumber });

      setTimeout(() => {
        setFormData(emptyForm);
        setSubmissionState({ isSubmitted: false, referenceNumber: '' });
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la venta. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submissionState.isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-500/20 p-6 rounded-full">
                <Check className="text-green-500" size={48} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">¡Venta Registrada Exitosamente!</h2>
            <p className="text-gray-400 mb-6">La venta del vehículo ha sido procesada correctamente</p>
            <div className="bg-gray-900 p-6 rounded-lg mb-6">
              <p className="text-gray-400 mb-2">Número de Referencia:</p>
              <p className="text-3xl font-bold text-orange-500">{submissionState.referenceNumber}</p>
            </div>
            <p className="text-gray-400 text-sm">Redirigiendo al formulario en unos segundos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Módulo de Ventas</h1>
          <p className="text-xl text-gray-400">Registra una nueva venta de vehículo</p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Información del Cliente */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-600/20 p-3 rounded-lg">
                  <User className="text-orange-500" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white">Información del Cliente</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nombre *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Apellido *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Apellido del cliente" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="cliente@ejemplo.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                      placeholder="+58 (0000) 000-00-00" />
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Vehículo */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-600/20 p-3 rounded-lg">
                  <Car className="text-orange-500" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white">Información del Vehículo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Modelo *</label>
                  <select name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors">
                    <option value="">Seleccionar modelo</option>
                    {vehicleModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Año</label>
                  <input type="number" name="vehicleYear" value={formData.vehicleYear} onChange={handleInputChange}
                    min="2020" max="2030"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color *</label>
                  <select name="vehicleColor" value={formData.vehicleColor} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors">
                    <option value="">Seleccionar color</option>
                    {vehicleColors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Información de Pago */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-600/20 p-3 rounded-lg">
                  <DollarSign className="text-orange-500" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white">Información de Pago</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Precio (USD) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange}
                    min="0" step="0.01"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="50000.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pago *</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors">
                    <option value="">Seleccionar método</option>
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Número de Referencia *</label>
                  <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="123456789" />
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-600/20 p-3 rounded-lg">
                  <FileText className="text-orange-500" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white">Notas Adicionales</h3>
              </div>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                placeholder="Observaciones, accesorios incluidos, condiciones especiales..." />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg">{error}</div>
            )}

            <div className="flex gap-4 pt-6">
              <button type="submit" disabled={isLoading}
                className="flex-1 bg-orange-600 text-white py-4 rounded-lg font-medium hover:bg-orange-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isLoading ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Procesando...</>
                ) : (
                  <><Check size={20} />Registrar Venta</>
                )}
              </button>
              <button type="button" onClick={() => { setFormData(emptyForm); setError(''); }}
                className="px-8 bg-gray-700 text-gray-300 py-4 rounded-lg font-medium hover:bg-gray-600 transition-colors">
                Limpiar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
