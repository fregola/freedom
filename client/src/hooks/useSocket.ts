import { useEffect, useCallback } from 'react';
import socketService, { SocketEventType, ProductEvent } from '../services/socket';

interface UseSocketOptions {
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = { autoConnect: true }) => {
  useEffect(() => {
    if (options.autoConnect) {
      socketService.connect();
    }

    return () => {
      if (options.autoConnect) {
        socketService.disconnect();
      }
    };
  }, [options.autoConnect]);

  const addEventListener = useCallback((event: SocketEventType, callback: (data: ProductEvent) => void) => {
    socketService.on(event, callback);
    
    return () => {
      socketService.off(event, callback);
    };
  }, []);

  const isConnected = useCallback(() => {
    return socketService.isConnected();
  }, []);

  const connect = useCallback(() => {
    socketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  return {
    addEventListener,
    isConnected,
    connect,
    disconnect
  };
};

// Hook specifico per gli eventi dei prodotti
export const useProductEvents = (callbacks: {
  onProductAdded?: (data: ProductEvent) => void;
  onProductUpdated?: (data: ProductEvent) => void;
  onProductDeleted?: (data: ProductEvent) => void;
}) => {
  const { addEventListener } = useSocket();

  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    if (callbacks.onProductAdded) {
      const cleanup = addEventListener('product_added', callbacks.onProductAdded);
      cleanupFunctions.push(cleanup);
    }

    if (callbacks.onProductUpdated) {
      const cleanup = addEventListener('product_updated', callbacks.onProductUpdated);
      cleanupFunctions.push(cleanup);
    }

    if (callbacks.onProductDeleted) {
      const cleanup = addEventListener('product_deleted', callbacks.onProductDeleted);
      cleanupFunctions.push(cleanup);
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [addEventListener, callbacks.onProductAdded, callbacks.onProductUpdated, callbacks.onProductDeleted]);
};