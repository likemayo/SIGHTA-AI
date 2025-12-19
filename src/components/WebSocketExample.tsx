/**
 * WebSocket Example Component
 * Demonstrates how to use the WebSocket service in a React Native component
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useWebSocket } from '../hooks/useWebSocket';
import { ConnectionStatus, GuidanceResponse } from '../types/websocket.types';

const WebSocketExample: React.FC = () => {
  const {
    connectionStatus,
    isConnected,
    isAuthenticated,
    error,
    queuedMessages,
    connect,
    disconnect,
    sendMessage,
    registerListeners,
    requestGuidance,
    authenticate,
  } = useWebSocket();

  const [messages, setMessages] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Register WebSocket event listeners
    registerListeners({
      onConnect: () => {
        addMessage('✅ Connected to server');
      },
      onDisconnect: (reason) => {
        addMessage(`❌ Disconnected: ${reason}`);
      },
      onError: (err) => {
        addMessage(`⚠️ Error: ${err.message}`);
      },
      onReconnect: (attemptNumber) => {
        addMessage(`🔄 Reconnected after ${attemptNumber} attempts`);
      },
      onGuidanceResponse: (response: GuidanceResponse) => {
        addMessage(`🗣️ Guidance: ${response.guidance}`);
      },
      onMessage: (message) => {
        addMessage(`📨 Message: ${message.type}`);
      },
    });
  }, [registerListeners]);

  const addMessage = (msg: string) => {
    setMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleAuthenticate = () => {
    authenticate({
      token: 'demo-token-123',
      userId: 'user-001',
      deviceId: 'device-001',
    });
    addMessage('🔐 Authentication sent');
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      sendMessage('custom_message', { text: inputText });
      addMessage(`📤 Sent: ${inputText}`);
      setInputText('');
    }
  };

  const handleRequestGuidance = () => {
    requestGuidance({
      context: 'User requesting navigation assistance',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      timestamp: Date.now(),
    });
    addMessage('🧭 Guidance requested');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return '#4CAF50';
      case ConnectionStatus.CONNECTING:
      case ConnectionStatus.RECONNECTING:
        return '#FF9800';
      case ConnectionStatus.ERROR:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WebSocket Demo</Text>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Status: {connectionStatus}</Text>
        {isAuthenticated && (
          <Text style={styles.authText}>✓ Authenticated</Text>
        )}
        {queuedMessages > 0 && (
          <Text style={styles.queueText}>📬 Queued: {queuedMessages}</Text>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, !isConnected ? styles.buttonPrimary : styles.buttonSecondary]}
          onPress={isConnected ? handleDisconnect : handleConnect}
        >
          <Text style={styles.buttonText}>
            {isConnected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleAuthenticate}
          disabled={!isConnected}
        >
          <Text style={[styles.buttonText, !isConnected && styles.buttonTextDisabled]}>
            Authenticate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleRequestGuidance}
          disabled={!isConnected}
        >
          <Text style={[styles.buttonText, !isConnected && styles.buttonTextDisabled]}>
            Request Guidance
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          editable={isConnected}
        />
        <TouchableOpacity
          style={[styles.sendButton, !isConnected && styles.buttonDisabled]}
          onPress={handleSendMessage}
          disabled={!isConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.messagesContainer}>
        <Text style={styles.messagesTitle}>Messages:</Text>
        <ScrollView style={styles.messagesList}>
          {messages.map((msg, index) => (
            <Text key={index} style={styles.messageText}>
              {msg}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusBar: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 5,
  },
  authText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 5,
  },
  queueText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 5,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    minWidth: '45%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2196F3',
  },
  buttonSecondary: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  messagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  messagesList: {
    flex: 1,
  },
  messageText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default WebSocketExample;
