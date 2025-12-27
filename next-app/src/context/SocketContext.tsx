'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore, useChatStore, useSocketStore } from '@/store';
import { WEBUI_BASE_URL } from '@/lib/constants';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  reconnecting: boolean;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback?: (...args: unknown[]) => void) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const config = useAppStore((s) => s.config);
  const setSocketStore = useSocketStore((s) => s.setSocket);
  const setActiveUserIds = useSocketStore((s) => s.setActiveUserIds);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !config) return;

    const enableWebsocket = config.features?.enable_websocket ?? true;

    const newSocket = io(WEBUI_BASE_URL || undefined, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      path: '/ws/socket.io',
      transports: enableWebsocket ? ['websocket'] : ['polling', 'websocket'],
      auth: { token },
    });

    newSocket.on('connect_error', (err) => {
      console.log('Socket connect_error:', err);
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      setReconnecting(false);

      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        newSocket.emit('user-join', { auth: { token: currentToken } });
      }
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log('Socket reconnect_attempt:', attempt);
      setReconnecting(true);
    });

    newSocket.on('reconnect_failed', () => {
      console.log('Socket reconnect_failed');
      setReconnecting(false);
    });

    newSocket.on('disconnect', (reason, details) => {
      console.log(`Socket ${newSocket.id} disconnected:`, reason);
      if (details) {
        console.log('Disconnect details:', details);
      }
      setConnected(false);
    });

    newSocket.on('user-list', (data: { user_ids: string[] }) => {
      setActiveUserIds(data.user_ids);
    });

    setSocket(newSocket);
    setSocketStore(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setSocketStore(null);
      setConnected(false);
    };
  }, [config, setSocketStore, setActiveUserIds]);

  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (socket?.connected) {
        socket.emit(event, data);
      }
    },
    [socket]
  );

  const on = useCallback(
    (event: string, callback: (...args: unknown[]) => void) => {
      socket?.on(event, callback);
    },
    [socket]
  );

  const off = useCallback(
    (event: string, callback?: (...args: unknown[]) => void) => {
      if (callback) {
        socket?.off(event, callback);
      } else {
        socket?.off(event);
      }
    },
    [socket]
  );

  const value: SocketContextValue = {
    socket,
    connected,
    reconnecting,
    emit,
    on,
    off,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function useSocketOptional() {
  return useContext(SocketContext);
}
