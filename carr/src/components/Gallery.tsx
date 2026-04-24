export default function Gallery() {
  return (
    <section id="vehiculos" className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Galería
          </h2>
          <p className="text-xl text-gray-400">
            Experimenta la potencia en cada imagen
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative group overflow-hidden rounded-2xl">
            <img
              src="/photo_2026-03-24_07-09-28_(2).jpg"
              alt="RELY Truck Studio"
              className="w-full h-96 object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-8 left-8 right-8">
                <h3 className="text-2xl font-bold text-white mb-2">Diseño Premium</h3>
                <p className="text-gray-300">Elegancia y potencia en perfecta armonía</p>
              </div>
            </div>
          </div>

          <div className="relative group overflow-hidden rounded-2xl">
            <img
              src="/photo_2026-03-24_07-09-28.jpg"
              alt="RELY Truck Action"
              className="w-full h-96 object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-8 left-8 right-8">
                <h3 className="text-2xl font-bold text-white mb-2">Aventura Extrema</h3>
                <p className="text-gray-300">Domina cualquier terreno con confianza</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-orange-700 transition-all transform hover:scale-105">
            Ver Más Imágenes
          </button>
        </div>
      </div>
    </section>
  );
}
