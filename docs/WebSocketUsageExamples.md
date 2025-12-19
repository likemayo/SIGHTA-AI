/**
 * WebSocket Setup Documentation
 * 
 * This file provides usage examples and documentation for the WebSocket implementation
 * 
 * @fileoverview This is a documentation file with code examples - not meant to be imported
 */

/* eslint-disable */
// @ts-nocheck

// ============================================================================
// BASIC USAGE IN A COMPONENT
// ============================================================================

import React, { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

function MyComponent() {
  const {
    connectionStatus,
    isConnected,
    connect,
    disconnect,
    sendMessage,
    registerListeners,
  } = useWebSocket();

  useEffect(() => {
    // Connect when component mounts
    connect();

    // Register event listeners
    registerListeners({
      onConnect: () => console.log('Connected!'),
      onDisconnect: (reason) => console.log('Disconnected:', reason),
      onError: (error) => console.error('Error:', error),
    });

    // Cleanup on unmount
    return () => disconnect();
  }, []);

  return null; // Your UI here
}

// ============================================================================
// DIRECT SERVICE USAGE (WITHOUT HOOKS)
// ============================================================================

import WebSocketService from './services/WebSocketService';

// Connect to server
WebSocketService.connect('ws://your-server-url:3000');

// Register listeners
WebSocketService.on({
  onConnect: () => {
    console.log('Connected to server');
    
    // Authenticate after connection
    WebSocketService.authenticate({
      token: 'your-auth-token',
      userId: 'user-123',
      deviceId: 'device-456',
    });
  },
  onGuidanceResponse: (response) => {
    console.log('Received guidance:', response.guidance);
  },
});

// Send video frame
WebSocketService.sendVideoFrame({
  frameData: 'base64-encoded-image-data',
  frameNumber: 1,
  timestamp: Date.now(),
  metadata: {
    width: 1920,
    height: 1080,
    format: 'jpeg',
  },
});

// Send audio
WebSocketService.sendAudio({
  audioData: 'base64-encoded-audio-data',
  duration: 1000,
  timestamp: Date.now(),
  format: 'pcm',
});

// Send IMU data
WebSocketService.sendIMUData({
  accelerometer: { x: 0.1, y: 0.2, z: 9.8 },
  gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
  timestamp: Date.now(),
});

// Request guidance
WebSocketService.requestGuidance({
  context: 'User needs navigation help',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
  },
  timestamp: Date.now(),
});

// Disconnect
WebSocketService.disconnect();

// ============================================================================
// CONFIGURATION
// ============================================================================

// Update the server URL in src/config/websocket.config.ts:
// 
// export const WebSocketConfig = {
//   serverUrl: 'ws://your-production-server.com:3000',
//   reconnection: true,
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
//   ...
// };

// ============================================================================
// CUSTOM MESSAGE TYPES
// ============================================================================

// Add custom message types in src/config/websocket.config.ts:
// 
// export const MessageTypes = {
//   ...existing types,
//   YOUR_CUSTOM_TYPE: 'your_custom_type',
// } as const;

// Then use it:
// WebSocketService.sendMessage(MessageTypes.YOUR_CUSTOM_TYPE, { your: 'data' });

// ============================================================================
// ERROR HANDLING
// ============================================================================

import { ConnectionStatus } from './types/websocket.types';

function MyComponent() {
  const { connectionStatus, error } = useWebSocket();

  if (connectionStatus === ConnectionStatus.ERROR && error) {
    return <ErrorView error={error} />;
  }

  if (connectionStatus === ConnectionStatus.RECONNECTING) {
    return <ReconnectingView />;
  }

  // ... rest of your component
}

// ============================================================================
// AUTO-CONNECT ON MOUNT
// ============================================================================

function MyComponent() {
  // Auto-connect when component mounts
  const ws = useWebSocket('ws://localhost:3000', true);

  // Component will automatically connect and disconnect
  return null;
}

export {};
