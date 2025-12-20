/**
 * Raw WebSocket Test Server (Arduino-style)
 *
 * Start: node server-ws-example.js
 * Client URL: ws://localhost:3000
 */

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

function send(ws, type, payload = {}) {
  ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
}

wss.on('connection', (ws, req) => {
  console.log('✅ Client connected:', req.socket.remoteAddress);
  send(ws, 'connection_ack', { sessionId: Date.now().toString(), serverTime: Date.now(), message: 'Connected successfully' });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type, payload } = msg;
      if (!type) return;

      switch (type) {
        case 'authenticate':
          console.log('🔐 AUTHENTICATE:', payload);
          send(ws, 'connection_ack', { sessionId: Date.now().toString(), serverTime: Date.now(), message: 'Authenticated successfully' });
          break;
        case 'request_guidance':
          console.log('🧭 REQUEST_GUIDANCE:', payload?.context);
          setTimeout(() => {
            send(ws, 'guidance_response', {
              guidance: 'Turn left and walk 10 meters',
              confidence: 0.95,
            });
          }, 800);
          break;
        case 'send_video_frame':
          console.log('📹 VIDEO_FRAME:', payload?.frameNumber);
          break;
        case 'send_audio':
          console.log('🎤 AUDIO duration(ms):', payload?.duration);
          break;
        case 'send_imu_data':
          console.log('📊 IMU accel:', payload?.accelerometer);
          break;
        default:
          console.log('💬 CUSTOM/ECHO:', type, payload);
          // echo back
          send(ws, type, { echo: payload, note: 'echo from server' });
          break;
      }
    } catch (e) {
      console.error('⚠️ Parse error:', e);
      send(ws, 'error', { code: 'PARSE_ERROR', message: 'Invalid JSON' });
    }
  });

  ws.on('close', (code, reason) => {
    console.log('❌ Client disconnected:', code, reason?.toString());
  });

  ws.on('error', (err) => {
    console.error('⚠️ WS error:', err);
  });
});

console.log('🚀 Raw WebSocket server started at ws://localhost:3000');
