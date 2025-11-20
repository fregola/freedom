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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
        <Route path="/" element={<Navigate to="/menu" replace />} />
        <Route path="/menu" element={<PublicMenu />} />
        <Route path="/menu/custom" element={<PublicCustomMenu />} />
          <Route path="/menu/category/:categoryId" element={<CategoryProducts />} />
          <Route path="/login" element={<LoginForm />} />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/allergens" element={<Allergens />} />
                    <Route path="/ingredients" element={<Ingredients />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/hall" element={<Hall />} />
                    <Route path="/custom-menus" element={<CustomMenus />} />
                    <Route path="/business" element={<BusinessInfo />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
