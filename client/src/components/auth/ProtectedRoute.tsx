import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #6b7280;
  font-size: 16px;
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Mostra loading mentre verifica l'autenticazione
  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingWrapper>
          <LoadingSpinner />
          <LoadingText>Verifica autenticazione...</LoadingText>
        </LoadingWrapper>
      </LoadingContainer>
    );
  }

  // Se non è autenticato, reindirizza al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se richiede admin ma l'utente non è admin, reindirizza alla dashboard
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Se tutto è ok, mostra il contenuto
  return <>{children}</>;
};

export default ProtectedRoute;