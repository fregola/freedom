import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '../types/auth';
import { authService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verifica se l'utente è già autenticato al caricamento dell'app
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');

      if (storedToken && storedUser) {
        try {
          // Verifica se il token è ancora valido
          const response = await authService.me();
          if (response.success && response.data) {
            setToken(storedToken);
            setUser(response.data.user);
          } else {
            // Token non valido, rimuovi i dati
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        } catch (error) {
          // Errore nella verifica del token, rimuovi i dati
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      console.log('🔐 Tentativo di login con:', { username: credentials.username, password: '***' });
      console.log('🌐 API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5001/api');
      
      const response = await authService.login(credentials);
      console.log('📡 Risposta dal server:', response);
      
      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        // Salva i dati nel localStorage
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Aggiorna lo stato
        setToken(authToken);
        setUser(userData);
        
        console.log('✅ Login riuscito per utente:', userData.username);
        return { success: true };
      }
      console.log('❌ Login fallito: risposta non valida');
      return { success: false, message: 'Risposta non valida dal server' };
    } catch (error: any) {
      console.error('❌ Errore durante il login:', error);
      if (error.response) {
        console.error('📄 Dettagli errore:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      const message = error?.response?.data?.message || (error?.response?.status === 404 ? 'Servizio di autenticazione non disponibile' : 'Errore durante il login');
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};