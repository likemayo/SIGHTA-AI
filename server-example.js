/**
 * Simple WebSocket Test Server
 * 
 * A minimal Socket.IO server for testing the SIGHTA-AI mobile app WebSocket client
 * 
 * To use:
 * 1. npm install socket.io
 * 2. node server-example.js
 * 3. Update websocket.config.ts serverUrl to 'http://localhost:3000'
 * 4. Run the mobile app and connect
 */

const { Server } = require('socket.io');

const io = new Server(3000, {
  cors: {
    origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

console.log('🚀 WebSocket test server started on port 3000');
console.log('📱 Waiting for mobile app connections...\n');

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  // Send connection acknowledgment
  socket.emit('connection_ack', {
    sessionId: socket.id,
    serverTime: Date.now(),
    message: 'Connected successfully',
  });

  // Handle authentication
  socket.on('authenticate', (data) => {
    console.log('🔐 Authentication received:', data);
    socket.emit('connection_ack', {
      sessionId: socket.id,
      serverTime: Date.now(),
      message: 'Authenticated successfully',
    });
  });

  // Handle video frames
  socket.on('send_video_frame', (data) => {
    console.log(`📹 Video frame received: #${data.frameNumber}`);
    // Process video frame here
  });

  // Handle audio data
  socket.on('send_audio', (data) => {
    console.log(`🎤 Audio received: ${data.duration}ms`);
    // Process audio here
  });

  // Handle IMU data
  socket.on('send_imu_data', (data) => {
    console.log(`📊 IMU data received: accel(${data.accelerometer.x.toFixed(2)}, ${data.accelerometer.y.toFixed(2)}, ${data.accelerometer.z.toFixed(2)})`);
    // Process IMU data here
  });

  // Handle guidance requests
  socket.on('request_guidance', (data) => {
    console.log(`🧭 Guidance requested: ${data.context}`);
    
    // Simulate AI processing delay
    setTimeout(() => {
      socket.emit('guidance_response', {
        guidance: `Turn left and walk 10 meters. Location: ${data.location?.latitude}, ${data.location?.longitude}`,
        confidence: 0.95,
        timestamp: Date.now(),
      });
      console.log('   ↳ Guidance sent');
    }, 1000);
  });

  // Handle custom messages
  socket.on('custom_message', (data) => {
    console.log('💬 Custom message:', data);
    socket.emit('custom_message', {
      echo: data.text,
      timestamp: Date.now(),
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})\n`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('⚠️  Socket error:', error);
  });

  // Catch-all for other events
  socket.onAny((eventName, ...args) => {
    if (!['send_video_frame', 'send_imu_data'].includes(eventName)) {
      console.log(`📨 Event received: ${eventName}`, args);
    }
  });
});

// Handle server errors
io.on('error', (error) => {
  console.error('❌ Server error:', error);
});

console.log('Server ready! Available endpoints:');
console.log('  • WebSocket: ws://localhost:3000');
console.log('  • HTTP: http://localhost:3000');
console.log('\nSupported events:');
console.log('  • authenticate');
console.log('  • send_video_frame');
console.log('  • send_audio');
console.log('  • send_imu_data');
console.log('  • request_guidance');
console.log('  • custom_message\n');
