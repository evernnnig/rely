import { Gauge, Shield, Zap, Mountain } from 'lucide-react';

const features = [
  {
    icon: Gauge,
    title: 'Rendimiento Superior',
    description: 'Motor de alta potencia diseñado para cualquier desafío'
  },
  {
    icon: Mountain,
    title: 'Todo Terreno',
    description: 'Capacidad extrema para conquistar cualquier camino'
  },
  {
    icon: Shield,
    title: 'Seguridad Avanzada',
    description: 'Tecnología de protección de última generación'
  },
  {
    icon: Zap,
    title: 'Eficiencia Energética',
    description: 'Optimización de combustible sin sacrificar potencia'
  }
];

export default function Features() {
  return (
    <section id="caracteristicas" className="py-24 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ingeniería de Excelencia
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Cada detalle diseñado para superar tus expectativas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-orange-600 transition-all transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-600/20"
            >
              <div className="bg-orange-600/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <feature.icon className="text-orange-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
