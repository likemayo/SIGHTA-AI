/**
 * WebSocket Service
 * Manages WebSocket connections, message handling, and reconnection logic
 */

import { io, Socket } from 'socket.io-client';
import { WebSocketConfig, MessageTypes } from '../config/websocket.config';
import {
  ConnectionStatus,
  WebSocketMessage,
  VideoFrameMessage,
  AudioMessage,
  IMUDataMessage,
  GuidanceRequest,
  GuidanceResponse,
  AuthenticationMessage,
  WebSocketEventListeners,
  ErrorMessage,
} from '../types/websocket.types';

class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private eventListeners: WebSocketEventListeners = {};
  private messageQueue: WebSocketMessage[] = [];
  private isAuthenticated: boolean = false;

  constructor() {
    this.initializeSocketListeners = this.initializeSocketListeners.bind(this);
  }

  /**
   * Initialize WebSocket connection
   */
  public connect(serverUrl?: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const url = serverUrl || WebSocketConfig.serverUrl;
    this.connectionStatus = ConnectionStatus.CONNECTING;

    this.socket = io(url, {
      reconnection: WebSocketConfig.reconnection,
      reconnectionAttempts: WebSocketConfig.reconnectionAttempts,
      reconnectionDelay: WebSocketConfig.reconnectionDelay,
      reconnectionDelayMax: WebSocketConfig.reconnectionDelayMax,
      timeout: WebSocketConfig.timeout,
      transports: WebSocketConfig.transports,
      autoConnect: true,
    });

    this.initializeSocketListeners();
  }

  /**
   * Set up Socket.IO event listeners
   */
  private initializeSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.reconnectAttempts = 0;
      this.eventListeners.onConnect?.();
      this.processMessageQueue();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.isAuthenticated = false;
      this.eventListeners.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.connectionStatus = ConnectionStatus.ERROR;
      this.eventListeners.onError?.(error);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.eventListeners.onReconnect?.(attemptNumber);
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      this.connectionStatus = ConnectionStatus.RECONNECTING;
      console.log('Reconnection attempt:', this.reconnectAttempts);
    });

    // Custom message handlers
    this.socket.on(MessageTypes.CONNECTION_ACK, (data: unknown) => {
      console.log('Connection acknowledged:', data);
      this.isAuthenticated = true;
    });

    this.socket.on(MessageTypes.GUIDANCE_RESPONSE, (data: GuidanceResponse) => {
      console.log('Guidance response received:', data);
      this.eventListeners.onGuidanceResponse?.(data);
    });

    this.socket.on(MessageTypes.ERROR, (error: ErrorMessage) => {
      console.error('Server error:', error);
      this.eventListeners.onError?.(new Error(error.message));
    });

    // Generic message handler
    this.socket.onAny((eventName: string, ...args: unknown[]) => {
      const message: WebSocketMessage = {
        type: eventName,
        payload: args[0],
        timestamp: Date.now(),
      };
      this.eventListeners.onMessage?.(message);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.isAuthenticated = false;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Authenticate with the server
   */
  public authenticate(authData: AuthenticationMessage): void {
    this.sendMessage(MessageTypes.AUTHENTICATE, authData);
  }

  /**
   * Send a generic message
   */
  public sendMessage(type: string, payload: unknown): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      messageId: this.generateMessageId(),
    };

    if (this.isConnected() && this.socket) {
      this.socket.emit(type, payload);
    } else {
      // Queue message for later delivery
      this.messageQueue.push(message);
      console.log('Message queued (not connected):', type);
    }
  }

  /**
   * Send video frame to server
   */
  public sendVideoFrame(frameData: VideoFrameMessage): void {
    this.sendMessage(MessageTypes.SEND_VIDEO_FRAME, frameData);
  }

  /**
   * Send audio data to server
   */
  public sendAudio(audioData: AudioMessage): void {
    this.sendMessage(MessageTypes.SEND_AUDIO, audioData);
  }

  /**
   * Send IMU data to server
   */
  public sendIMUData(imuData: IMUDataMessage): void {
    this.sendMessage(MessageTypes.SEND_IMU_DATA, imuData);
  }

  /**
   * Request guidance from server
   */
  public requestGuidance(request: GuidanceRequest): void {
    this.sendMessage(MessageTypes.REQUEST_GUIDANCE, request);
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (!this.isConnected() || !this.socket) return;

    console.log(`Processing ${this.messageQueue.length} queued messages`);
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.emit(message.type, message.payload);
      }
    }
  }

  /**
   * Register event listeners
   */
  public on(listeners: WebSocketEventListeners): void {
    this.eventListeners = { ...this.eventListeners, ...listeners };
  }

  /**
   * Remove event listener
   */
  public off(eventName: keyof WebSocketEventListeners): void {
    delete this.eventListeners[eventName];
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionStatus === ConnectionStatus.CONNECTED && this.socket?.connected === true;
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get authentication status
   */
  public getAuthenticationStatus(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear message queue
   */
  public clearMessageQueue(): void {
    this.messageQueue = [];
    console.log('Message queue cleared');
  }

  /**
   * Get queued message count
   */
  public getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }
}

// Export singleton instance
export default new WebSocketService();
