# SIGHTA-AI Mobile Application

A smart necklace navigation system for people with visual impairments using AI-powered segmentation and audio feedback.

## Repository Scope

This repository contains the **mobile application development** for the SIGHTA-AI system. It includes:

- BLE communication with the necklace device
- Cloud API integration for AI inference and services
- Navigation state machine and guidance logic
- Audio feedback system with spatial audio
- Offline fallback capabilities with on-device models
- User interface and configuration tools

## Project Overview

SIGHTA-AI develops a wearable necklace device that provides intelligent assistance to visually impaired users. The system operates in multiple modes tailored to different user needs:

1. **IDLE Mode**: Standby mode with low-frequency scene monitoring, listening for wake commands and alert preparation
2. **NAVIGATING Mode**: Active blind path following with real-time guidance and obstacle detection for autonomous navigation
3. **CROSSING Mode**: Dedicated crosswalk assistance with traffic light detection and alignment guidance
4. **SEARCHING Mode**: Item search mode with object tracking and hand guidance when looking for specific objects
5. **CHATTING Mode**: Conversational AI mode for questions about surroundings or general queries
6. **EMERGENCY Mode**: Triggered by fall detection or user command, immediately alerts emergency contacts

The system uses an integrated camera with the SAM3 segmentation model to understand the environment and delivers all guidance through audio feedback, with the mobile screen supporting sighted helpers and system configuration.


## Design Philosophy

The system follows a three-tier architecture that balances latency requirements with computational capabilities:

- **Necklace Device**: Minimal processing, maximum sensor fidelity
- **Mobile App**: Coordination, state management, user interface
- **Cloud Services**: Heavy ML inference, multimodal AI processing

### Key Design Decisions

- **Cloud-First ML**: All heavy inference (SAM3, segmentation, LLM) runs in cloud to enable sophisticated models without draining mobile battery
- **Mobile as Hub**: The phone acts as an intelligent router between device and cloud, handling connectivity, caching, and graceful degradation
- **Audio-First Feedback**: All navigation guidance delivered via audio; the mobile screen serves sighted helpers and configuration only
- **Graceful Degradation**: System continues basic obstacle alerting even with poor connectivity using on-device fallbacks

## Mobile Architecture Overview

This repository focuses on the mobile application layer, including:

- BLE connectivity and streaming with the necklace device
- Navigation state machine and guidance logic
- Cloud API client integration (Vision, Speech, LLM)
- Audio engine with priority queue and spatial cues
- Offline fallback using on-device models

## API Specifications

### Vision API

#### Detection Request
```
POST /api/v1/vision/detect
```

**Request Body:**
```json
{
  "image": "base64_jpeg_data",
  "mode": "navigation|search|general",
  "target": "optional_search_target",
  "include_depth": false
}
```

**Response:**
```json
{
  "detections": [
    {
      "class": "person",
      "confidence": 0.95,
      "bbox": [x, y, w, h],
      "distance_estimate": 2.5
    }
  ],
  "segmentation": {
    "blind_path": {
      "mask_center": [320, 400],
      "deviation": -15,
      "turn_ahead": "left"
    }
  },
  "processing_time_ms": 87
}
```

#### WebSocket Streaming
```
WSS /api/v1/vision/stream
```
- **Client sends**: Binary JPEG frames
- **Server responds**: JSON detection results per frame
- **Heartbeat**: Ping/pong every 30 seconds

### Speech API

#### ASR Streaming
```
WSS /api/v1/speech/transcribe
```
- **Client sends**: PCM audio chunks (16kHz, 16-bit)
- **Server responds**: 
  - `{ "partial": "text...", "final": false }`
  - `{ "text": "complete", "final": true }`

#### TTS Request
```
POST /api/v1/speech/synthesize
```

**Request:**
```json
{
  "text": "Turn left in 10 meters",
  "voice": "navigation",
  "speed": 1.1
}
```

**Response**: Binary audio stream (MP3/Opus)

### Multimodal LLM API

```
POST /api/v1/chat/multimodal
```

**Request:**
```json
{
  "messages": [...],
  "image": "base64_jpeg",
  "stream": true
}
```

**Response**: Server-sent events with text chunks

## Offline Mode & Fallback Strategy

### Connectivity Detection

The mobile app continuously monitors connectivity quality:
- **Latency Monitoring**: Track round-trip time to cloud services
- **Bandwidth Estimation**: Measure effective throughput
- **Automatic Switching**: Transition to fallback mode if latency > 500ms or connection lost

### On-Device Fallback Models

Lightweight TFLite/CoreML models for basic functionality:

| Model | Size | Capability |
|-------|------|------------|
| MobileNet-SSD | ~5MB | Basic obstacle detection |
| DeepLab Mobile | ~8MB | Path/sidewalk segmentation |
| Whisper Tiny | ~40MB | Basic speech recognition |

### Degraded Mode Features

When offline, the system provides reduced but still useful functionality:
- **Available**: Obstacle alerts, basic path detection, predefined voice commands
- **Limited**: Scene description, item search, conversational AI
- **User Notification**: Audio announcement when entering/exiting offline mode

## Technology Recommendations

### Mobile Development

- **Cross-Platform**: React Native with native modules for BLE and audio
- **iOS Native**: Swift with CoreBluetooth, AVFoundation, CoreML
- **Android Native**: Kotlin with Android BLE, ExoPlayer, TFLite

## Data Flow Architecture

### Video Processing Pipeline

The video pipeline is optimized for low latency while maintaining accuracy for navigation-critical detections:

1. **Frame Capture**: ESP32 camera captures JPEG at 640x480, 10-15 FPS
2. **BLE Transfer**: Frames chunked and sent to mobile app via BLE (or WiFi Direct for higher bandwidth)
3. **Frame Buffer**: Mobile app maintains 2-3 frame buffer, drops oldest if backed up
4. **Cloud Upload**: Selected keyframes uploaded to Vision API via WebSocket
5. **ML Inference**: Cloud runs SAM3 detection + segmentation (50-150ms)
6. **Results Return**: Detection results sent back as JSON with bounding boxes, labels, confidence
7. **Guidance Generation**: Navigation engine processes detections into spatial audio cues

### Audio Processing Pipeline

Voice commands flow through a dedicated audio pipeline optimized for natural interaction:

1. **Audio Capture**: I2S microphone captures 16kHz PCM audio on necklace
2. **VAD Detection**: Voice Activity Detection runs on-device to identify speech segments
3. **Stream to Cloud**: Speech segments streamed to ASR service for real-time transcription
4. **Intent Parsing**: Transcribed text parsed for navigation commands or general queries
5. **Response Generation**: LLM generates contextual response if needed
6. **TTS Playback**: Response converted to speech and played through connected audio device

### Latency Budget

Target end-to-end latency for navigation guidance: **300-500ms**

| Stage | Target Latency |
|-------|-----------------|
| Frame capture + encoding | 20-30ms |
| BLE transfer to mobile | 30-50ms |
| Upload to cloud | 50-100ms |
| ML inference (GPU) | 50-150ms |
| Results download | 20-50ms |
| Guidance generation + audio | 30-50ms |
| **TOTAL** | **200-430ms** |

## Mobile Application Architecture

### Technology Stack

- **Framework**: React Native (cross-platform) or Swift/Kotlin (native)
- **BLE Library**: react-native-ble-plx or CoreBluetooth/Android BLE
- **Networking**: WebSocket for streaming, REST for configuration
- **Audio**: AVFoundation (iOS) / ExoPlayer (Android)
- **Local ML (optional)**: TensorFlow Lite / CoreML for fallback inference

### Core Modules

#### BLE Manager
Handles all communication with the necklace device:
- Device discovery and pairing
- Connection state management with auto-reconnect
- Video frame reassembly from BLE chunks
- Audio stream handling
- IMU data reception and processing

#### Navigation State Machine

Central coordinator managing application state and mode transitions:

| State | Description |
|-------|-------------|
| IDLE | Standby mode, listening for wake commands, low-frequency scene monitoring |
| NAVIGATING | Active blind path following with real-time guidance and obstacle detection |
| CROSSING | Crosswalk assistance mode with traffic light detection and alignment |
| SEARCHING | Item search mode with object tracking and hand guidance |
| CHATTING | Conversational AI mode for questions about surroundings or general queries |
| EMERGENCY | Triggered by fall detection or user command, alerts emergency contacts |

#### Cloud Client
Manages all cloud service communication:
- WebSocket connection pool for streaming endpoints
- Automatic retry with exponential backoff
- Request queuing and prioritization
- Response caching for repeated queries

#### Audio Engine
Handles all audio output with intelligent queuing:
- Priority queue for navigation vs. informational prompts
- Interruption handling (urgent alerts preempt ongoing speech)
- Spatial audio positioning for directional cues
- Volume normalization and ambient noise adjustment

## Team Structure

- **Mobile Development Team**: 2-3 developers
  - React Native or native iOS/Android development
  - Cloud API integration
  - Navigation logic and audio engine implementation
  - Testing and deployment

*Hardware/Firmware development is handled by a separate team*

## Getting Started

*(To be added as development progresses)*

## Key Technologies & References

### Segmentation Model
- **SAM3 (Segment Anything Model 3)** - Facebook Research
  - Repository: https://github.com/facebookresearch/sam3
  - Paper: https://arxiv.org/abs/2511.16719

### Benchmark Project
- OpenAIglasses for Navigation: https://github.com/AI-FanGe/OpenAIglasses_for_Navigation

## License

*(To be determined)*

## Acknowledgments

- Benchmark project: [OpenAIglasses for Navigation](https://github.com/AI-FanGe/OpenAIglasses_for_Navigation)
- Segmentation model: [SAM3 by Facebook Research](https://github.com/facebookresearch/sam3)
