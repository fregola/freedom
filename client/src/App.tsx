import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginForm from './components/auth/LoginForm';
import PublicMenu from './pages/PublicMenu';
import PublicCustomMenu from './pages/PublicCustomMenu';
import CategoryProducts from './pages/CategoryProducts';
import Dashboard from './pages/Dashboard';
import Allergens from './pages/Allergens';
import Ingredients from './pages/Ingredients';
import Categories from './pages/Categories';
import Products from './pages/Products';
import BusinessInfo from './pages/BusinessInfo';
import CustomMenus from './pages/CustomMenus';
import Hall from './pages/Hall';
import QrCodeManager from './pages/QrCodeManager';
import PopupManager from './pages/PopupManager';
import PopupBuilder from './pages/PopupBuilder';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          
          {/* Rotte pubbliche per il menu */}
          <Route path="/menu" element={<PublicMenu />} />
          <Route path="/menu/custom/:id" element={<PublicCustomMenu />} />
          
          {/* Rotte protette della dashboard */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="allergens" element={<Allergens />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:id/products" element={<CategoryProducts />} />
            <Route path="products" element={<Products />} />
            <Route path="business" element={<BusinessInfo />} />
            <Route path="custom-menus" element={<CustomMenus />} />
            <Route path="hall" element={<Hall />} />
            <Route path="qr-manager" element={<QrCodeManager />} />
            <Route path="popups" element={<PopupManager />} />
            <Route path="popups/new" element={<PopupBuilder />} />
            <Route path="popups/:id" element={<PopupBuilder />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
