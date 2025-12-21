# WebSocket Networking (Raw WS)

Real-time messaging using the native WebSocket API (no Socket.IO client). Works with raw WS servers such as the ESP32-S3 or the provided local test server.

## 📦 Installation

- Client: uses the built-in `WebSocket` API — no extra client packages required.
- Local test server (optional, already installed): `ws` (`npm install ws`) to run `server-ws-example.js`.

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
└── docs/WebSocketUsageExamples.md  # Code examples and documentation
```

## 🚀 Quick Start

### 1. Configure Server URL

Update `src/config/websocket.config.ts`:

```typescript
export const WebSocketConfig = {
  serverUrl: 'ws://your-server-url:3000', // Change this (use wss:// in prod)
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: false,
  transportMode: 'websocket',
  debug: __DEV__,
};
```

### 2. Use in a Component (hook)

```typescript
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useWebSocket } from './hooks/useWebSocket';

function MyComponent() {
  const {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    registerListeners,
  } = useWebSocket();

  useEffect(() => {
    connect();

    registerListeners({
      onConnect: () => console.log('Connected!'),
      onMessage: (msg) => console.log('Inbound', msg),
      onGuidanceResponse: (response) => {
        console.log('Guidance:', response.guidance);
      },
    });

    return () => disconnect();
  }, [connect, disconnect, registerListeners]);

  return <Text>{isConnected ? 'Connected' : 'Disconnected'}</Text>;
}
```

### 3. Direct Service Usage

```typescript
import WebSocketService from 'src/services/WebSocketService';

// Connect
WebSocketService.connect();

// Send data (JSON envelope under the hood)
WebSocketService.sendVideoFrame({
  frameData: 'base64-encoded-data',
  frameNumber: 1,
  timestamp: Date.now(),
});

// Disconnect
WebSocketService.disconnect();
```

## 📘 Usage Examples

### Component with hook

```typescript
import React, { useEffect } from 'react';
import { useWebSocket } from 'src/hooks/useWebSocket';

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
    connect();

    registerListeners({
      onConnect: () => console.log('Connected!'),
      onDisconnect: (reason) => console.log('Disconnected:', reason),
      onError: (error) => console.error('Error:', error),
    });

    return () => disconnect();
  }, [connect, disconnect, registerListeners]);

  return null; // render your UI
}
```

### Direct service usage

```typescript
import WebSocketService from 'src/services/WebSocketService';

WebSocketService.connect('ws://your-server-url:3000');

WebSocketService.on({
  onConnect: () => {
    console.log('Connected to server');
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

WebSocketService.sendVideoFrame({
  frameData: 'base64-encoded-image-data',
  frameNumber: 1,
  timestamp: Date.now(),
  metadata: { width: 1920, height: 1080, format: 'jpeg' },
});

WebSocketService.sendAudio({
  audioData: 'base64-encoded-audio-data',
  duration: 1000,
  timestamp: Date.now(),
  format: 'pcm',
});

WebSocketService.sendIMUData({
  accelerometer: { x: 0.1, y: 0.2, z: 9.8 },
  gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
  timestamp: Date.now(),
});

WebSocketService.requestGuidance({
  context: 'User needs navigation help',
  location: { latitude: 37.7749, longitude: -122.4194 },
  timestamp: Date.now(),
});

WebSocketService.disconnect();
```

### Custom message types

```typescript
// src/config/websocket.config.ts
export const MessageTypes = {
  // existing types...
  YOUR_CUSTOM_TYPE: 'your_custom_type',
} as const;

// usage
WebSocketService.sendMessage(MessageTypes.YOUR_CUSTOM_TYPE, { your: 'data' });
```

### Error and reconnect states

```typescript
import { ConnectionStatus } from 'src/types/websocket.types';
import { useWebSocket } from 'src/hooks/useWebSocket';

function MyComponent() {
  const { connectionStatus, error } = useWebSocket();

  if (connectionStatus === ConnectionStatus.ERROR && error) {
    return <ErrorView error={error} />;
  }

  if (connectionStatus === ConnectionStatus.RECONNECTING) {
    return <ReconnectingView />;
  }

  return <MainView />;
}
```

### Auto-connect on mount

```typescript
// Auto-connect as soon as the hook initializes
const ws = useWebSocket('ws://localhost:3000', true);
```

## 🎯 Features

- Native WebSocket client (no Socket.IO dependency)
- Auto-reconnection with backoff and max attempts
- Message queueing while offline; flush on reconnect
- Event-driven callbacks (connect, disconnect, reconnect, message, guidance)
- Type-safe envelope and payload interfaces
- Singleton service + convenience React hook

## 📡 Message Protocol

All outbound messages are JSON envelopes:

```json
{
  "type": "send_video_frame",
  "payload": { /* your data */ },
  "timestamp": 1730000000000,
  "messageId": "1730000000000-abc123"
}
```

Server responses should also use `{ type, payload, timestamp }`. Known server `type` values include `connection_ack`, `guidance_response`, and `error`.

## 📚 API Reference

### useWebSocket Hook

```typescript
const {
  connectionStatus,
  isConnected,
  isAuthenticated,
  error,
  queuedMessages,
  // Methods
  connect,
  disconnect,
  sendMessage,
  registerListeners,
  // Specialized helpers
  sendVideoFrame,
  sendAudio,
  sendIMUData,
  requestGuidance,
  authenticate,
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

// Sending Data (JSON envelope: { type, payload, timestamp, messageId })
sendMessage(type: string, payload: unknown): void
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
  transportMode: 'websocket',              // Raw WS transport
  debug: __DEV__,                          // Debug mode
};
```

## 🏗️ Message Types

Predefined in `MessageTypes`:

```typescript
// Client to Server
CONNECT, DISCONNECT, AUTHENTICATE,
SEND_VIDEO_FRAME, SEND_AUDIO, SEND_IMU_DATA,
REQUEST_GUIDANCE

// Server to Client
CONNECTION_ACK, GUIDANCE_RESPONSE, ERROR, RECONNECT
```

Add custom types in `src/config/websocket.config.ts` and handle them on your server.

## 🧪 Testing

```bash
# 1) Start local WS server (optional)
node server-ws-example.js

# 2) Update serverUrl if needed

# 3) Run the app and open WebSocketExample
npx react-native start --reset-cache
npx react-native run-ios   # or run-android
```

## 🚨 Production Checklist

- [ ] Update `serverUrl` to production endpoint (wss://)
- [ ] Use real auth tokens in `authenticate`
- [ ] Enable TLS (wss) and certs on the server
- [ ] Add error/metrics monitoring
- [ ] Tune reconnection/backoff for your infra
- [ ] Compress large payloads if needed
- [ ] Implement rate limiting and input validation on the server
- [ ] Add heartbeat/ping-pong on the server if required

## 📱 Integration Notes

- Single raw WebSocket connection per app; configure the URL for your target (local mock or ESP32-S3).
- Use `WebSocketExample` to verify connect → authenticate → send/receive flows before wiring into other screens.
- Message queueing lets you call send methods even when offline; queued messages flush on reconnect.

## 📖 Additional Resources

- [MDN: WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws (Node) server](https://github.com/websockets/ws)
- See `docs/WebSocketUsageExamples.md` for more code examples
