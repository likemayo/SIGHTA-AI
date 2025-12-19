# WebSocket Networking Setup

Complete WebSocket implementation for real-time communication in SIGHTA-AI mobile app.

## 📦 Installation

Already installed! The following packages are included:
- `socket.io-client`: WebSocket client library with automatic reconnection
- `@types/socket.io-client`: TypeScript type definitions

## 📁 Project Structure

```
src/
├── config/
│   └── websocket.config.ts      # WebSocket configuration and message types
├── types/
│   └── websocket.types.ts       # TypeScript type definitions
├── services/
│   ├── WebSocketService.ts      # Core WebSocket service (singleton)
│   └── index.ts                 # Services export
├── hooks/
│   ├── useWebSocket.ts          # React hook for components
│   └── index.ts                 # Hooks export
├── components/
│   └── WebSocketExample.tsx     # Demo component
└── WebSocketUsageExamples.ts    # Code examples and documentation
```

## 🚀 Quick Start

### 1. Configure Server URL

Update the server URL in `src/config/websocket.config.ts`:

```typescript
export const WebSocketConfig = {
  serverUrl: 'ws://your-server-url:3000',  // Change this
  reconnection: true,
  reconnectionAttempts: 5,
  // ... other settings
};
```

### 2. Use in a Component (with Hook)

```typescript
import React, { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

function MyComponent() {
  const { 
    isConnected, 
    connect, 
    disconnect,
    sendMessage,
    registerListeners 
  } = useWebSocket();

  useEffect(() => {
    connect();
    
    registerListeners({
      onConnect: () => console.log('Connected!'),
      onGuidanceResponse: (response) => {
        console.log('Guidance:', response.guidance);
      },
    });

    return () => disconnect();
  }, []);

  return <Text>{isConnected ? 'Connected' : 'Disconnected'}</Text>;
}
```

### 3. Direct Service Usage

```typescript
import WebSocketService from './services/WebSocketService';

// Connect
WebSocketService.connect();

// Send data
WebSocketService.sendVideoFrame({
  frameData: 'base64-encoded-data',
  frameNumber: 1,
  timestamp: Date.now(),
});

// Disconnect
WebSocketService.disconnect();
```

## 🎯 Features

### ✅ Core Features
- **Auto-reconnection**: Automatically reconnects with exponential backoff
- **Message queueing**: Queues messages when disconnected, sends when reconnected
- **Event-driven**: Subscribe to connection, disconnection, and custom events
- **Type-safe**: Full TypeScript support with comprehensive types
- **Singleton pattern**: Single connection instance across the app
- **React Hook**: Easy integration with React Native components

### 📡 Message Types Supported

1. **Video Frames**: Send camera frames to server
2. **Audio Data**: Stream audio for processing
3. **IMU Data**: Send accelerometer, gyroscope data
4. **Guidance Requests**: Request navigation assistance
5. **Authentication**: Secure authentication with tokens
6. **Custom Messages**: Send any custom message type

## 📚 API Reference

### useWebSocket Hook

```typescript
const {
  connectionStatus,     // Current connection status
  isConnected,         // Boolean connection state
  isAuthenticated,     // Authentication status
  error,              // Last error (if any)
  queuedMessages,     // Number of queued messages
  
  // Methods
  connect,            // Connect to server
  disconnect,         // Disconnect from server
  sendMessage,        // Send generic message
  registerListeners,  // Register event listeners
  
  // Specialized methods
  sendVideoFrame,     // Send video frame
  sendAudio,          // Send audio data
  sendIMUData,        // Send IMU data
  requestGuidance,    // Request guidance
  authenticate,       // Authenticate user
} = useWebSocket(serverUrl?, autoConnect?);
```

### WebSocketService Methods

```typescript
// Connection
connect(serverUrl?: string): void
disconnect(): void
isConnected(): boolean
getConnectionStatus(): ConnectionStatus

// Authentication
authenticate(authData: AuthenticationMessage): void
getAuthenticationStatus(): boolean

// Sending Data
sendMessage(type: string, payload: any): void
sendVideoFrame(frameData: VideoFrameMessage): void
sendAudio(audioData: AudioMessage): void
sendIMUData(imuData: IMUDataMessage): void
requestGuidance(request: GuidanceRequest): void

// Event Management
on(listeners: WebSocketEventListeners): void
off(eventName: keyof WebSocketEventListeners): void

// Queue Management
clearMessageQueue(): void
getQueuedMessageCount(): number
```

## 🎨 Example Component

A full demo component is available at `src/components/WebSocketExample.tsx`. It demonstrates:
- Connection management
- Authentication
- Sending messages
- Receiving responses
- Error handling
- Status indicators

## 🔧 Configuration Options

```typescript
export const WebSocketConfig = {
  serverUrl: 'ws://localhost:3000',        // Server URL
  reconnection: true,                      // Enable auto-reconnect
  reconnectionAttempts: 5,                 // Max reconnect attempts
  reconnectionDelay: 1000,                 // Initial delay (ms)
  reconnectionDelayMax: 5000,              // Max delay (ms)
  timeout: 20000,                          // Connection timeout
  autoConnect: false,                      // Connect on init
  transports: ['websocket', 'polling'],    // Transport methods
  debug: __DEV__,                          // Debug mode
};
```

## 🏗️ Message Types

Predefined message types in `MessageTypes` constant:

```typescript
// Client to Server
CONNECT, DISCONNECT, AUTHENTICATE
SEND_VIDEO_FRAME, SEND_AUDIO, SEND_IMU_DATA
REQUEST_GUIDANCE

// Server to Client
CONNECTION_ACK, GUIDANCE_RESPONSE, ERROR, RECONNECT
```

Add custom types in `src/config/websocket.config.ts`.

## 🛡️ Error Handling

```typescript
registerListeners({
  onError: (error: Error) => {
    console.error('WebSocket error:', error);
    // Handle error (show notification, retry, etc.)
  },
  onDisconnect: (reason: string) => {
    console.log('Disconnected:', reason);
    // Handle disconnection
  },
});
```

## 🔄 Connection States

```typescript
enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}
```

## 📱 Integration with SIGHTA-AI

The WebSocket setup integrates with:
- **BLE Manager**: Stream glasses data to cloud
- **Cloud Client**: Real-time AI processing
- **Navigation State**: Receive guidance updates
- **Audio Engine**: Stream audio for TTS processing

## 🧪 Testing

```bash
# Run tests
npm test

# Test WebSocket connection
# 1. Start your WebSocket server
# 2. Update serverUrl in websocket.config.ts
# 3. Run the app and use WebSocketExample component
```

## 🚨 Production Checklist

- [ ] Update `serverUrl` to production endpoint
- [ ] Implement proper authentication tokens
- [ ] Add SSL/TLS support (wss://)
- [ ] Configure error monitoring
- [ ] Optimize reconnection strategy
- [ ] Add message compression for large payloads
- [ ] Implement rate limiting
- [ ] Add heartbeat/ping mechanism

## 📖 Additional Resources

- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- See `src/WebSocketUsageExamples.ts` for more code examples

## 🐛 Troubleshooting

### Connection Issues
- Check server URL is correct
- Verify server is running and accessible
- Check firewall/network settings
- Enable debug mode: `debug: true` in config

### Messages Not Sending
- Check connection status with `isConnected()`
- Messages are queued when disconnected
- Check queue size with `getQueuedMessageCount()`

### TypeScript Errors
- Ensure all types are imported from `src/types/websocket.types.ts`
- Check payload matches interface definitions
