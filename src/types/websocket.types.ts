/**
 * WebSocket Type Definitions
 * Type definitions for WebSocket messages and events
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
  messageId?: string;
}

export interface VideoFrameMessage {
  frameData: string; // Base64 encoded frame
  frameNumber: number;
  timestamp: number;
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

export interface AudioMessage {
  audioData: string; // Base64 encoded audio
  duration: number;
  timestamp: number;
  format?: string;
}

export interface IMUDataMessage {
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  magnetometer?: {
    x: number;
    y: number;
    z: number;
  };
  timestamp: number;
}

export interface GuidanceRequest {
  context: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}

export interface GuidanceResponse {
  guidance: string;
  audioUrl?: string;
  confidence?: number;
  timestamp: number;
}

export interface AuthenticationMessage {
  token: string;
  userId: string;
  deviceId: string;
}

export interface ConnectionAckMessage {
  sessionId: string;
  serverTime: number;
  message: string;
}

export interface ErrorMessage {
  code: string;
  message: string;
  details?: unknown;
}

export interface WebSocketEventListeners {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attemptNumber: number) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onGuidanceResponse?: (response: GuidanceResponse) => void;
}
