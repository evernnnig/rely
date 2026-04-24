import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contacto" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Tu próximo vehículo está a un clic de distancia.
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Déjanos tus datos y te asesoraremos.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-orange-600/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="text-orange-600" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Teléfono de contacto</h3>
                  <p className="text-gray-400">+58 (0000) 000-00-00</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-orange-600/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="text-orange-600" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Email</h3>
                  <p className="text-gray-400">soporte@rely.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-orange-600/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-orange-600" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Ubicación</h3>
                  <p className="text-gray-400">Av Francisco de Miranda, Chacao, Caracas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700">
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nombres y Apellidos
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-600 transition-colors"
                  placeholder="Nombres Apellidos"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Correo electronico
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-600 transition-colors"
                  placeholder="correo@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-600 transition-colors"
                  placeholder="+58 (000) 000-00-00"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-600 transition-colors resize-none"
                  placeholder="¿En qué podemos ayudarte?"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                Enviar mensaje
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-800">
        <p className="text-center text-gray-500">
          © 2026 RELY. Todos los derechos reservados.
        </p>
      </div>
    </section>
  );
}
