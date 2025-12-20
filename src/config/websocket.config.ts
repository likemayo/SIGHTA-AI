/**
 * WebSocket Configuration
 * Central configuration for WebSocket connection settings
 */

export const WebSocketConfig = {
  // Server URL - update this to your actual server endpoint
  // For Socket.IO, using http:// is recommended for the handshake
  serverUrl: 'http://localhost:3000',
  
  // Connection settings
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  
  // Auto-connect on initialization
  autoConnect: false,
  
  // Transport options
  transports: ['websocket', 'polling'],
  
  // Enable debug mode for development
  debug: __DEV__,
};

export const MessageTypes = {
  // Client to Server
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  SEND_VIDEO_FRAME: 'send_video_frame',
  SEND_AUDIO: 'send_audio',
  SEND_IMU_DATA: 'send_imu_data',
  REQUEST_GUIDANCE: 'request_guidance',
  
  // Server to Client
  CONNECTION_ACK: 'connection_ack',
  GUIDANCE_RESPONSE: 'guidance_response',
  ERROR: 'error',
  RECONNECT: 'reconnect',
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];
