import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ViewType } from '../App';
import { LogIn, LogOut, User } from 'lucide-react';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export default function Navigation({ 
  currentView, 
  onViewChange, 
  isAuthenticated, 
  onLogin, 
  onLogout, 
  userEmail 
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigation = (view: ViewType, anchor?: string) => {
    if (view === 'home' && anchor) {
      onViewChange('home');
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      onViewChange(view);
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <button onClick={() => handleNavigation('home')}>
              <img
                src="/photo_2026-03-24_07-09-28_(3).jpg"
                alt="RELY"
                className="h-8 w-auto"
              />
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleNavigation('home', 'inicio')}
              className={`transition-colors ${currentView === 'home' ? 'text-orange-500' : 'text-gray-300 hover:text-white'}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => handleNavigation('home', 'vehiculos')}
              className={`transition-colors ${currentView === 'home' ? 'text-gray-300 hover:text-white' : 'text-gray-300 hover:text-white'}`}
            >
              Vehículos
            </button>
            <button 
              onClick={() => handleNavigation('home', 'caracteristicas')}
              className={`transition-colors ${currentView === 'home' ? 'text-gray-300 hover:text-white' : 'text-gray-300 hover:text-white'}`}
            >
              Características
            </button>
            
            {isAuthenticated && (
              <>
                <button 
                  onClick={() => handleNavigation('sales')}
                  className={`transition-colors ${currentView === 'sales' ? 'text-orange-500' : 'text-gray-300 hover:text-white'}`}
                >
                  Ventas
                </button>
                <button 
                  onClick={() => handleNavigation('orders')}
                  className={`transition-colors ${currentView === 'orders' ? 'text-orange-500' : 'text-gray-300 hover:text-white'}`}
                >
                  Órdenes
                </button>
                <button 
                  onClick={() => handleNavigation('tracking')}
                  className={`transition-colors ${currentView === 'tracking' ? 'text-orange-500' : 'text-gray-300 hover:text-white'}`}
                >
                  Tracking
                </button>
              </>
            )}
            
            <button 
              onClick={() => handleNavigation('home', 'contacto')}
              className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors"
            >
              Contacto
            </button>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <User size={16} />
                  <span className="text-sm">{userEmail}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <LogOut size={20} />
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogIn size={20} />
                Iniciar Sesión
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-black/95 border-t border-gray-800">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <button 
              onClick={() => handleNavigation('home', 'inicio')}
              className="block text-gray-300 hover:text-white py-2 w-full text-left"
            >
              Inicio
            </button>
            <button 
              onClick={() => handleNavigation('home', 'vehiculos')}
              className="block text-gray-300 hover:text-white py-2 w-full text-left"
            >
              Vehículos
            </button>
            <button 
              onClick={() => handleNavigation('home', 'caracteristicas')}
              className="block text-gray-300 hover:text-white py-2 w-full text-left"
            >
              Características
            </button>
            
            {isAuthenticated && (
              <>
                <button 
                  onClick={() => handleNavigation('sales')}
                  className="block text-gray-300 hover:text-white py-2 w-full text-left"
                >
                  Ventas
                </button>
                <button 
                  onClick={() => handleNavigation('orders')}
                  className="block text-gray-300 hover:text-white py-2 w-full text-left"
                >
                  Órdenes
                </button>
                <button 
                  onClick={() => handleNavigation('tracking')}
                  className="block text-gray-300 hover:text-white py-2 w-full text-left"
                >
                  Tracking
                </button>
              </>
            )}
            
            <button 
              onClick={() => handleNavigation('home', 'contacto')}
              className="block w-full bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors mt-2"
            >
              Contacto
            </button>
            
            {isAuthenticated ? (
              <div className="pt-4 border-t border-gray-700 mt-4">
                <div className="flex items-center gap-2 text-gray-300 mb-3">
                  <User size={16} />
                  <span className="text-sm">{userEmail}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors w-full"
                >
                  <LogOut size={20} />
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors w-full pt-4 border-t border-gray-700 mt-4"
              >
                <LogIn size={20} />
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
