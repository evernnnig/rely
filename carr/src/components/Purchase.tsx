import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Añadimos props para que el componente sea dinámico según el vehículo
  vehicleData?: {
    price: number;
    model: string;
    year?: number;
    color: string;
  };
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reference_number: string;
  paymentMethod: string;
  notes: string;
}

const emptyForm: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  reference_number: '',
  paymentMethod: 'Transferencia', // Valor por defecto
  notes: '',
};

export default function Purchase({ isOpen, onClose, vehicleData }: PurchaseModalProps) {
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // El precio y modelo vienen del componente padre o se fijan aquí
  const currentVehicle = vehicleData || {
    price: 50000.00,
    model: "RELY",
    year: 2024,
    color: "Blanco"
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas de cliente
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.reference_number) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsLoading(true);

    // Mapeo de datos para que coincidan con OrdenVentaCreateSerializer en Django
    const dataToSend = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      reference_number: formData.reference_number,
      price: currentVehicle.price,
      vehicleModel: currentVehicle.model,
      vehicleYear: currentVehicle.year,
      vehicleColor: currentVehicle.color,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes
    };

    try {
      // Reemplaza con tu URL real de producción o desarrollo
      const response = await fetch('http://localhost:8000/api/ordenes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Importante: Si usas IsAuthenticated, necesitas enviar el token
          'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          onClose();
          setFormData(emptyForm);
          setIsSubmitted(false);
        }, 4000);
      } else {
        // Manejo de errores específicos del Serializer (ej. referencia duplicada)
        if (result.reference_number) {
          setError(`Error: ${result.reference_number[0]}`);
        } else if (result.detail) {
          setError("No tienes permiso o tu sesión expiró.");
        } else {
          setError("Hubo un problema al procesar la orden.");
        }
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor de ventas.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-950 rounded-2xl w-full max-w-md shadow-2xl border border-gray-800 my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Finalizar Compra</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/20 p-4 rounded-full">
                  <Check className="text-green-500" size={40} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Orden Guardada!</h3>
              <p className="text-gray-400 mb-4">La referencia {formData.reference_number} ha sido registrada en el sistema.</p>
              <p className="text-orange-500 text-sm font-medium">Cerrando ventana...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Resumen del Vehículo */}
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 mb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Vehículo</p>
                    <p className="text-xl font-bold text-white">{currentVehicle.model} <span className="text-gray-500 text-sm">{currentVehicle.year}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">Precio</p>
                    <p className="text-2xl font-bold text-orange-500">${currentVehicle.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Nombres</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Apellidos</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Teléfono</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Ref. de Pago</label>
                  <input type="text" name="reference_number" value={formData.reference_number} onChange={handleInputChange} required
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Método</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-orange-500 outline-none">
                    <option value="Transferencia">Transferencia</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Crypto">Crypto</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-xs italic">
                  ⚠️ {error}
                </div>
              )}

              <div className="pt-4 space-y-3">
                <button type="submit" disabled={isLoading}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Procesando con el Servidor...
                    </>
                  ) : 'Confirmar y Registrar Venta'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}