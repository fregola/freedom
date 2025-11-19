import axios from 'axios';
import { LoginCredentials, AuthResponse } from '../types/auth';

const API_BASE_URL = (typeof window !== 'undefined' ? `${window.location.origin}/api` : ((process.env.REACT_APP_API_URL as string | undefined) || '/api'));

// Crea un'istanza di axios con configurazione base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token di autenticazione alle richieste
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire le risposte e gli errori
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token scaduto o non valido, rimuovi dal localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servizi di autenticazione
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  me: async (): Promise<AuthResponse> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Rimuovi i dati dal localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/auth/change-password', payload);
    return response.data;
  },
  changeEmail: async (payload: { email: string }) => {
    const response = await api.put('/auth/change-email', payload);
    return response.data;
  },
};

// Servizi per allergeni
export const allergenService = {
  getAll: async () => {
    const response = await api.get('/allergens');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/allergens/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/allergens', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/allergens/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/allergens/${id}`);
    return response.data;
  },
};

// Servizi per ingredienti
export const ingredientService = {
  getAll: async () => {
    const response = await api.get('/ingredients');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/ingredients/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/ingredients', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/ingredients/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/ingredients/${id}`);
    return response.data;
  },
};

// Servizi per prodotti
export const productService = {
  getAll: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByCategory: async (categoryId: number) => {
    const response = await api.get(`/products/category/${categoryId}`);
    return response.data;
  },

  getByIds: async (ids: number[]) => {
    const response = await api.get(`/products/by-ids`, { params: { ids: ids.join(',') } });
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get(`/products/search/${encodeURIComponent(query)}`);
    return response.data;
  },

  create: async (data: any) => {
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};
    
    const response = await api.post('/products', data, config);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {};
    
    const response = await api.put(`/products/${id}`, data, config);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// Servizi per categorie
export const categoryService = {
  getAll: async (tree = false) => {
    const response = await api.get(`/categories${tree ? '?tree=true' : ''}`);
    return response.data;
  },

  getPublic: async () => {
    const response = await api.get('/categories/public');
    return response.data;
  },

  getConcatenated: async () => {
    const response = await api.get('/categories?concatenated=true');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Servizio per gestire i dati dell'attività
export const businessService = {
  get: async () => {
    const response = await api.get('/business');
    return response.data;
  },

  update: async (data: any) => {
    const response = await api.put('/business', data);
    return response.data;
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/business/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getMenuQr: async (): Promise<Blob> => {
    const response = await api.get('/business/qrcode', { responseType: 'blob' });
    return response.data;
  },
};

// Servizi per utenti (admin)
export const userService = {
  create: async (data: { username: string; email: string; password: string; role?: 'admin' | 'cook' | 'waiter' }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  list: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  setActive: async (id: number, is_active: boolean) => {
    const response = await api.put(`/users/${id}/status`, { is_active });
    return response.data;
  },
  updateEmail: async (id: number, email: string) => {
    const response = await api.put(`/users/${id}/email`, { email });
    return response.data;
  },
  updateRole: async (id: number, role: 'admin' | 'cook' | 'waiter') => {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  },
  updatePassword: async (id: number, newPassword: string) => {
    const response = await api.put(`/users/${id}/password`, { newPassword });
    return response.data;
  },
};

// Servizi per menu personalizzati
export const customMenuService = {
  getAll: async () => {
    const response = await api.get('/custom-menus');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/custom-menus/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/custom-menus', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/custom-menus/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/custom-menus/${id}`);
    return response.data;
  },
};

export default api;