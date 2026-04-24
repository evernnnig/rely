import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Purchase from './Purchase';

export default function Hero() {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  return (
    <>
      <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/photo_2026-03-24_07-09-28_(2).jpg"
            alt="RELY Truck"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
            Poder sin límites
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-200 mb-8 font-light">
            Descubre la nueva generación de camionetas RELY
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setIsPurchaseOpen(true)}
              className="bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-orange-700 transition-all transform hover:scale-105">
              Comprar Ahora
            </button>
            <a href="#caracteristicas" className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white/20 transition-all border border-white/30">
              Ver Especificaciones
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="text-white" size={40} />
        </div>
      </section>

      <Purchase isOpen={isPurchaseOpen} onClose={() => setIsPurchaseOpen(false)} />
    </>
  );
}
