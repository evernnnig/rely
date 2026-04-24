import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Features from './components/Features';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import Login from './components/Login';
import SalesModule from './components/SalesModule';
import OrdersInbox from './components/OrdersInbox';
import VehicleTracking from './components/VehicleTracking';
import { isAuthenticated, getCurrentUser, logout } from './services/authService';

export type ViewType = 'home' | 'sales' | 'orders' | 'tracking';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isAuth, setIsAuth] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;

    getCurrentUser().then((user) => {
      if (user) {
        setIsAuth(true);
        setUserEmail(user.email);
      }
    });
  }, []);

  const handleLoginSuccess = (email: string) => {
    setIsAuth(true);
    setUserEmail(email);
    setIsLoginOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsAuth(false);
    setUserEmail('');
    setCurrentView('home');
  };

  const handleViewChange = (view: ViewType) => {
    if (['sales', 'orders', 'tracking'].includes(view) && !isAuth) {
      setIsLoginOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'sales':
        return isAuth ? <SalesModule /> : null;
      case 'orders':
        return isAuth ? <OrdersInbox /> : null;
      case 'tracking':
        return isAuth ? <VehicleTracking /> : null;
      default:
        return (
          <>
            <Hero />
            <Features />
            <Gallery />
            <Contact />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation
        currentView={currentView}
        onViewChange={handleViewChange}
        isAuthenticated={isAuth}
        onLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        userEmail={userEmail}
      />
      {renderView()}
      <Login
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
