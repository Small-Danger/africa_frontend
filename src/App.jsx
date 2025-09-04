import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ModernHeader from './components/ModernHeader'
import MobileNavigation from './components/MobileNavigation'
import AdminLayout from './components/layout/AdminLayout'
import ModernHome from './pages/public/ModernHome'
import ModernCatalog from './pages/public/ModernCatalog'
import ModernProductDetail from './pages/public/ModernProductDetail'
import ModernCart from './pages/public/ModernCart'
import SearchResults from './pages/public/SearchResults'
import ModernLogin from './pages/auth/ModernLogin'
import Checkout from './pages/public/Checkout'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import UserProfile from './pages/public/UserProfile'
import OrderSuccess from './pages/public/OrderSuccess'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import Categories from './pages/admin/Categories'
import Orders from './pages/admin/Orders'
import Customers from './pages/admin/Customers'
import Banners from './pages/admin/Banners'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Routes publiques avec nouveau design */}
              <Route path="/" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <ModernHome />
                  </main>
                  <MobileNavigation />
                </div>
              } />
              
              <Route path="/catalog" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <ModernCatalog />
                  </main>
                  <MobileNavigation />
                </div>
              } />
              
              <Route path="/catalog/:categorySlug" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <ModernCatalog />
                  </main>
                  <MobileNavigation />
                </div>
              } />
              
              <Route path="/catalog/:categorySlug/:subcategorySlug" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <ModernCatalog />
                  </main>
                  <MobileNavigation />
                </div>
              } />
              
              {/* Route pour les produits par ID */}
              <Route path="/products/:id" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <ModernProductDetail />
                  </main>
                  <MobileNavigation />
                </div>
              } />
              
              {/* Route pour les produits par slug */}
              <Route path="/product/:slug" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <ModernProductDetail />
                  </main>
                  <MobileNavigation />
                </div>
              } />
              
              <Route path="/cart" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <ModernCart />
                  </main>
                  <MobileNavigation />
                </div>
              } />

              <Route path="/search" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <SearchResults />
                  </main>
                  <MobileNavigation />
                </div>
              } />

              <Route path="/profile" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <UserProfile />
                  </main>
                  <MobileNavigation />
                </div>
              } />

              <Route path="/order-success" element={
                <div className="min-h-screen bg-gray-50">
                  <ModernHeader />
                  <main>
                    <OrderSuccess />
                  </main>
                  <MobileNavigation />
                </div>
              } />

              {/* Routes d'authentification modernes */}
              <Route path="/auth/login" element={<ModernLogin />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/quick-register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              
              {/* Routes de compatibilité */}
              <Route path="/login" element={<ModernLogin />} />
              <Route path="/register" element={<Register />} />

              {/* Route de test */}
              <Route path="/test" element={
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">✅ Application Fonctionne !</h1>
                    <p className="text-gray-600 mb-8">L'application React se charge correctement</p>
                    <a href="/auth/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                      Aller à la page de connexion
                    </a>
                  </div>
                </div>
              } />

              {/* Routes d'administration */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout><Dashboard /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute>
                  <AdminLayout><Products /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/categories" element={
                <ProtectedRoute>
                  <AdminLayout><Categories /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute>
                  <AdminLayout><Orders /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/customers" element={
                <ProtectedRoute>
                  <AdminLayout><Customers /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/banners" element={
                <ProtectedRoute>
                  <AdminLayout><Banners /></AdminLayout>
                </ProtectedRoute>
              } />
            </Routes>
           </Router>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}

export default App
