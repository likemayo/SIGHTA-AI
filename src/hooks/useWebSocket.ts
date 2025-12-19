/**
 * useWebSocket Hook
 * React hook for managing WebSocket connections in components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import WebSocketService from '../services/WebSocketService';
import {
  ConnectionStatus,
  GuidanceResponse,
  WebSocketEventListeners,
} from '../types/websocket.types';

export const useWebSocket = (serverUrl?: string, autoConnect: boolean = false) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [queuedMessages, setQueuedMessages] = useState(0);
  const hasInitialized = useRef(false);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      WebSocketService.connect(serverUrl);
      setConnectionStatus(WebSocketService.getConnectionStatus());
    } catch (err) {
      setError(err as Error);
    }
  }, [serverUrl]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    WebSocketService.disconnect();
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setIsAuthenticated(false);
  }, []);

  // Send message
  const sendMessage = useCallback((type: string, payload: unknown) => {
    WebSocketService.sendMessage(type, payload);
    setQueuedMessages(WebSocketService.getQueuedMessageCount());
  }, []);

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(WebSocketService.getConnectionStatus());
      setIsAuthenticated(WebSocketService.getAuthenticationStatus());
      setQueuedMessages(WebSocketService.getQueuedMessageCount());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !hasInitialized.current) {
      hasInitialized.current = true;
      connect();
    }

    return () => {
      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  // Register event listeners
  const registerListeners = useCallback((listeners: WebSocketEventListeners) => {
    WebSocketService.on(listeners);
  }, []);

  // Unregister event listener
  const unregisterListener = useCallback((eventName: keyof WebSocketEventListeners) => {
    WebSocketService.off(eventName);
  }, []);

  return {
    // State
    connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    isAuthenticated,
    error,
    queuedMessages,

    // Methods
    connect,
    disconnect,
    sendMessage,
    registerListeners,
    unregisterListener,

    // Service methods
    sendVideoFrame: WebSocketService.sendVideoFrame.bind(WebSocketService),
    sendAudio: WebSocketService.sendAudio.bind(WebSocketService),
    sendIMUData: WebSocketService.sendIMUData.bind(WebSocketService),
    requestGuidance: WebSocketService.requestGuidance.bind(WebSocketService),
    authenticate: WebSocketService.authenticate.bind(WebSocketService),
    clearQueue: WebSocketService.clearMessageQueue.bind(WebSocketService),
  };
};
