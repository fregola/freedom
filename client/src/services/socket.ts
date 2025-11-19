import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = (typeof window !== 'undefined' ? window.location.origin : ((process.env.REACT_APP_API_URL?.replace('/api', '') as string | undefined) || 'http://localhost:5001'));
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connesso al server Socket.IO:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnesso dal server Socket.IO:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Errore connessione Socket.IO:', error);
    });

    // Gestione eventi prodotti
    this.socket.on('product_added', (data) => {
      console.log('🔌 Prodotto aggiunto:', data);
      this.notifyListeners('product_added', data);
    });

    this.socket.on('product_updated', (data) => {
      console.log('🔌 Prodotto aggiornato:', data);
      this.notifyListeners('product_updated', data);
    });

    this.socket.on('product_deleted', (data) => {
      console.log('🔌 Prodotto eliminato:', data);
      this.notifyListeners('product_deleted', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('🔌 Socket.IO disconnesso');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Metodo per aggiungere listener personalizzati
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  // Metodo per rimuovere listener
  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Notifica tutti i listener di un evento
  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
}

// Istanza singleton
const socketService = new SocketService();

export default socketService;

// Tipi per gli eventi
export interface ProductEvent {
  product?: any;
  productId?: string;
  productName?: string;
  timestamp: string;
}

export type SocketEventType = 'product_added' | 'product_updated' | 'product_deleted';