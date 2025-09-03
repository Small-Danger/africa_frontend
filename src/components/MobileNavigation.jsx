import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const MobileNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isClient } = useAuth();
  const { getTotalItems } = useCart();

  // Utiliser le contexte du panier pour obtenir le nombre d'articles
  const cartItemCount = getTotalItems();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/catalog', icon: Grid3X3, label: 'Catalogue' },
    { path: '/cart', icon: ShoppingCart, label: 'Panier', showBadge: true },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          const handleClick = (e) => {
            if (item.path === '/profile') {
              if (!authService.isAuthenticated()) {
                e.preventDefault();
                navigate('/auth/login');
              } else if (isAdmin()) {
                e.preventDefault();
                navigate('/admin');
              }
            }
          };
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleClick}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 relative ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon size={20} className="mb-1" />
                {item.showBadge && cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;
