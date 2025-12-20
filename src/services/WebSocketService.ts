/**
 * WebSocket Service
 * Manages WebSocket connections, message handling, and reconnection logic
 */

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
  private ws: WebSocket | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private eventListeners: WebSocketEventListeners = {};
  private messageQueue: WebSocketMessage[] = [];
  private isAuthenticated: boolean = false;

  constructor() {
    this.initializeWsListeners = this.initializeWsListeners.bind(this);
  }

  /**
   * Initialize WebSocket connection
   */
  public connect(serverUrl?: string): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connecting/connected');
      return;
    }

    const url = serverUrl || WebSocketConfig.serverUrl;
    this.connectionStatus = ConnectionStatus.CONNECTING;

    try {
      this.ws = new WebSocket(url);
      this.initializeWsListeners();
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      this.connectionStatus = ConnectionStatus.ERROR;
      this.eventListeners.onError?.(error as Error);
    }
  }

  /**
   * Set up Socket.IO event listeners
   */
  private initializeWsListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.reconnectAttempts = 0;
      this.eventListeners.onConnect?.();
      this.processMessageQueue();
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason || 'closed');
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.isAuthenticated = false;
      this.eventListeners.onDisconnect?.(event.reason || 'closed');

      // Reconnect if enabled
      if (WebSocketConfig.reconnection && this.reconnectAttempts < WebSocketConfig.reconnectionAttempts) {
        this.reconnectAttempts++;
        this.connectionStatus = ConnectionStatus.RECONNECTING;
        const delay = Math.min(
          WebSocketConfig.reconnectionDelay * this.reconnectAttempts,
          WebSocketConfig.reconnectionDelayMax
        );
        setTimeout(() => {
          this.eventListeners.onReconnect?.(this.reconnectAttempts);
          this.connect();
        }, delay);
      }
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.connectionStatus = ConnectionStatus.ERROR;
      this.eventListeners.onError?.(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(typeof event.data === 'string' ? event.data : '');
        // Expect JSON envelope: { type, payload, timestamp }
        const { type, payload } = parsed || {};
        if (!type) return;

        // Handle known message types
        if (type === MessageTypes.CONNECTION_ACK) {
          console.log('Connection acknowledged:', payload);
          this.isAuthenticated = true;
        } else if (type === MessageTypes.GUIDANCE_RESPONSE) {
          this.eventListeners.onGuidanceResponse?.(payload as GuidanceResponse);
        } else if (type === MessageTypes.ERROR) {
          const err = payload as ErrorMessage;
          this.eventListeners.onError?.(new Error(err?.message || 'Server error'));
        }

        // Generic dispatch
        const message: WebSocketMessage = {
          type,
          payload,
          timestamp: Date.now(),
        };
        this.eventListeners.onMessage?.(message);
      } catch (e) {
        console.warn('Failed to parse WS message:', e);
      }
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
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

    if (this.isConnected() && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (e) {
        console.warn('WS send failed, queuing:', e);
        this.messageQueue.push(message);
      }
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
    if (!this.isConnected() || !this.ws) return;

    console.log(`Processing ${this.messageQueue.length} queued messages`);
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (e) {
          console.warn('WS send from queue failed:', e);
        }
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
    return this.connectionStatus === ConnectionStatus.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
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
