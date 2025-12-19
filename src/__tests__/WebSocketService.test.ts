/**
 * WebSocket Service Tests
 * Unit tests for WebSocket functionality
 */

import WebSocketService from '../services/WebSocketService';
import { ConnectionStatus } from '../types/websocket.types';

describe('WebSocketService', () => {
  beforeEach(() => {
    // Reset service state before each test
    WebSocketService.disconnect();
  });

  afterEach(() => {
    WebSocketService.disconnect();
  });

  test('should initialize with disconnected status', () => {
    expect(WebSocketService.getConnectionStatus()).toBe(ConnectionStatus.DISCONNECTED);
    expect(WebSocketService.isConnected()).toBe(false);
    expect(WebSocketService.getAuthenticationStatus()).toBe(false);
  });

  test('should queue messages when disconnected', () => {
    WebSocketService.sendMessage('test', { data: 'test' });
    expect(WebSocketService.getQueuedMessageCount()).toBeGreaterThan(0);
  });

  test('should clear message queue', () => {
    WebSocketService.sendMessage('test', { data: 'test' });
    expect(WebSocketService.getQueuedMessageCount()).toBeGreaterThan(0);
    
    WebSocketService.clearMessageQueue();
    expect(WebSocketService.getQueuedMessageCount()).toBe(0);
  });

  test('should handle video frame message structure', () => {
    const videoFrame = {
      frameData: 'base64-encoded-data',
      frameNumber: 1,
      timestamp: Date.now(),
      metadata: {
        width: 1920,
        height: 1080,
        format: 'jpeg',
      },
    };

    // Should not throw error
    expect(() => {
      WebSocketService.sendVideoFrame(videoFrame);
    }).not.toThrow();
    
    expect(WebSocketService.getQueuedMessageCount()).toBe(1);
  });

  test('should handle audio message structure', () => {
    const audioMessage = {
      audioData: 'base64-encoded-audio',
      duration: 1000,
      timestamp: Date.now(),
      format: 'pcm',
    };

    expect(() => {
      WebSocketService.sendAudio(audioMessage);
    }).not.toThrow();
  });

  test('should handle IMU data message structure', () => {
    const imuData = {
      accelerometer: { x: 0.1, y: 0.2, z: 9.8 },
      gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
      timestamp: Date.now(),
    };

    expect(() => {
      WebSocketService.sendIMUData(imuData);
    }).not.toThrow();
  });

  test('should handle guidance request structure', () => {
    const guidanceRequest = {
      context: 'test guidance',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      timestamp: Date.now(),
    };

    expect(() => {
      WebSocketService.requestGuidance(guidanceRequest);
    }).not.toThrow();
  });

  test('should register event listeners', () => {
    const mockListener = jest.fn();
    
    expect(() => {
      WebSocketService.on({
        onConnect: mockListener,
        onDisconnect: mockListener,
        onError: mockListener,
      });
    }).not.toThrow();
  });

  test('should unregister event listeners', () => {
    const mockListener = jest.fn();
    
    WebSocketService.on({ onConnect: mockListener });
    
    expect(() => {
      WebSocketService.off('onConnect');
    }).not.toThrow();
  });
});
