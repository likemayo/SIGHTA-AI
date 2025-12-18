# SIGHTA-AI Mobile Development Implementation Roadmap

## Overview

This document outlines the implementation and development steps for the SIGHTA-AI mobile application. The roadmap is organized into 9 phases covering foundation setup through production deployment.

### Cross-Platform Strategy
- Single codebase using React Native for UI and shared logic
- Native modules per platform where needed (BLE, audio, offline ML)
- Strict separation between shared core and platform adapters via TypeScript interfaces

### Shared Core vs Platform Adapters
- Shared Core (cross-platform):
   - `NavigationStateMachine`, `GuidanceGenerator`, `APICache`, `CloudClient`
   - UI screens (accessibility-first), global state, error handling, logging
- Platform Adapters (native bindings):
   - `BleAdapter` → iOS: CoreBluetooth; Android: Bluetooth LE (GATT)
   - `AudioAdapter` → iOS: AVFoundation; Android: ExoPlayer/AudioTrack + AudioFocus
   - `SpeechAdapter` (local fallback) → iOS: Speech/AVSpeechSynthesizer; Android: TextToSpeech
   - `OfflineMlAdapter` → iOS: CoreML; Android: TensorFlow Lite

### Cross-Platform Track Milestones (Parallel to Phases)
1. Define TypeScript adapter interfaces and shared contracts
2. Implement iOS and Android native modules for BLE, audio, (optional) speech, offline ML
3. Wire adapters into shared core and feature modules
4. Validate background execution: iOS background modes; Android foreground service
5. Establish platform-specific CI signing, build pipelines, and beta distribution

### Development Strategy: Hybrid Parallel Approach

**Rationale:**
- Sequential iOS-only then Android approach doubles timeline and misses cross-platform architecture issues early
- Hybrid parallel approach catches platform-specific problems during feature development, not during porting
- Shared core business logic written once; platform adapters developed simultaneously

**Timeline Comparison:**
- **Sequential (iOS → Android)**: 6 months (Months 1-3 iOS, Months 4-6 Android porting)
- **Hybrid Parallel**: 4-5 months (iOS foundation Week 1-2, then both platforms Weeks 3-12)

**Development Phases - Parallel Track:**

| Phase | Duration | iOS | Android | Shared |
|-------|----------|-----|---------|--------|
| Phase 1 | Week 1-2 | ✓ Foundation setup | Setup only | Project init, dependencies |
| Phase 2 | Week 3-4 | ✓ BLE Manager | ✓ BLE Manager | Adapter interfaces, mocks |
| Phase 3 | Week 5-6 | ✓ Cloud Client | ✓ Cloud Client | Shared client lib |
| Phase 4 | Week 7-8 | ✓ State Machine | ✓ State Machine | Shared core logic |
| Phase 5 | Week 9-10 | ✓ Audio Engine | ✓ Audio Engine | Priority queue, TTS client |
| Phase 6 | Week 11 | ✓ UI (iOS) | ✓ UI (Android) | Shared screens, hooks |
| Phase 7 | Week 12 | ✓ Offline/ML | ✓ Offline/ML | Connectivity monitor |
| Phase 8 | Week 13-14 | ✓ Testing + Polish | ✓ Testing + Polish | E2E tests, perf benchmarks |
| Phase 9 | Week 15-16 | ✓ Beta/Release | ✓ Beta/Release | Monitoring, analytics |

**Key Principle:** Once Phase 2 begins (BLE Manager), iOS and Android development happens **simultaneously** with the same feature set. This ensures:
- Platform-specific bugs discovered early (week 3-4 vs. month 5)
- Shared interfaces validated against both platforms
- No duplicate effort porting iOS code to Android
- Better code reuse in `src/core/`

---

## Phase 1: Foundation & Setup

**Duration:** 1-2 weeks 

### Tasks
1. **Project Initialization**
   - Set up React Native or native iOS/Android project structure
   - Configure development environment (Xcode, Android Studio, Node.js)
   - Set up version control and CI/CD pipeline
   - Configure code linting and testing framework

2. **Dependency Management**
   - Install BLE libraries (react-native-ble-plx or CoreBluetooth/Android BLE)
   - Set up networking libraries (WebSocket, REST client)
   - Configure audio libraries (AVFoundation/ExoPlayer)
   - Install ML frameworks (TensorFlow Lite/CoreML) for fallback models

### Deliverables
- Working development environment
- Project structure with build pipelines
- All dependencies integrated and tested

---

## Phase 2: Device Communication Layer

**Duration:** 2-3 weeks | **Dependency:** Phase 1

### 2.1 BLE Manager Implementation
- Device discovery and scanning
- Pairing and connection management
- Auto-reconnect logic with exponential backoff
- Frame reassembly for chunked video data
- Audio stream handling
- IMU data reception and parsing

### 2.2 Data Protocol Definition
- Define BLE message format and serialization
- Implement frame buffering (2-3 frame buffer)
- Handle frame prioritization and dropping
- Create test harness for BLE communication

### Key Components
- `BLEManager.ts/swift/kt` - Main BLE communication handler
- `BLEProtocol.ts` - Message serialization/deserialization
- `FrameBuffer.ts` - Frame management and prioritization

### Deliverables
- Working BLE connection and data streaming
- Frame reassembly and buffering system
- Integration tests with mock device

---

## Phase 3: Cloud Integration

**Duration:** 2-3 weeks | **Dependency:** Phase 1

### 3.1 Cloud Client Implementation
- WebSocket connection pool for streaming endpoints
- REST client for one-off requests
- Request queuing and prioritization
- Response caching mechanism
- Automatic retry logic with exponential backoff
- Error handling and connection recovery

### 3.2 API Integration
- Vision API client (detection, segmentation)
- Speech API client (ASR streaming, TTS synthesis)
- Multimodal LLM client for chat functionality

### Key Components
- `CloudClient.ts` - Connection management and pooling
- `VisionAPI.ts` - Vision endpoints
- `SpeechAPI.ts` - ASR and TTS endpoints
- `LLMClient.ts` - Multimodal chat integration
- `APICache.ts` - Response caching

### Configuration
- API endpoint configuration per environment
- Authentication and token management
- Timeout and retry settings

### Deliverables
- Cloud API client library
- All API endpoints implemented
- Comprehensive error handling
- Unit and integration tests

---

## Phase 4: Navigation & State Management

**Duration:** 2-3 weeks | **Dependency:** Phase 3

### 4.1 Navigation State Machine
- Implement state transitions:
  - IDLE → NAVIGATING → CROSSING → SEARCHING → CHATTING → EMERGENCY
- State persistence and recovery
- Event handling and state-based logic
- Logging and debugging state changes

### 4.2 Navigation Logic
- Path detection and analysis from segmentation results
- Obstacle detection and avoidance
- Guidance generation from detection bounding boxes
- Distance estimation and turn prediction
- Safety thresholds and urgency levels

### Key Components
- `NavigationStateMachine.ts` - State management
- `PathAnalyzer.ts` - Path detection logic
- `ObstacleDetector.ts` - Obstacle processing
- `GuidanceGenerator.ts` - Audio cue generation
- `DistanceEstimator.ts` - Distance calculations

### State Definitions
```
IDLE: Standby mode, listening for wake commands
NAVIGATING: Active path following with real-time guidance
CROSSING: Crosswalk assistance with traffic light detection
SEARCHING: Item search with object tracking
CHATTING: Conversational AI mode
EMERGENCY: Fall detection or user-triggered emergency
```

### Deliverables
- Fully functional state machine
- Navigation logic with safety measures
- State transition logging and analytics
- Unit tests for all state transitions

---

## Phase 5: Audio System

**Duration:** 2-3 weeks | **Dependency:** Phase 3, 4

### 5.1 Audio Engine Implementation
- Priority queue for audio prompts:
  - Level 1: Emergency/urgent alerts
  - Level 2: Navigation guidance
  - Level 3: Informational prompts
  - Level 4: Chat responses
- TTS integration (ElevenLabs, Azure, or OpenAI)
- Audio interruption handling
- Spatial audio positioning for directional cues
- Volume normalization and ambient noise adjustment

### 5.2 Voice Command Processing
- Voice activity detection (VAD)
- Noise filtering and preprocessing
- Command parsing and intent recognition
- Fallback for unrecognized commands

### Key Components
- `AudioEngine.ts` - Main audio management
- `AudioQueue.ts` - Priority-based queuing
- `TTSClient.ts` - TTS service integration
- `VADProcessor.ts` - Voice activity detection
- `SpatialAudioProcessor.ts` - Spatial positioning
- `VoiceCommandParser.ts` - Intent recognition

### Audio Priorities
- **P0 (Emergency)**: Fall detected, emergency activated (300ms)
- **P1 (Navigation)**: Obstacle warning, turn ahead (500ms)
- **P2 (Guidance)**: Normal navigation instructions (1000ms)
- **P3 (Information)**: Scene description, status updates (2000ms)

### Deliverables
- Audio engine with priority queuing
- TTS integration and voice synthesis
- Voice command recognition
- Spatial audio implementation
- Audio latency monitoring

---

## Phase 6: User Interface

**Duration:** 2-3 weeks | **Dependency:** Phase 4, 5

### 6.1 UI/UX Development
- Main navigation interface (for sighted helpers/debugging)
- Configuration and settings screen
- System status and debugging visualization
- Mode indicator and current state display
- Emergency contact management
- Connection status and battery indicator

### 6.2 Accessibility Features
- Voice-guided setup and configuration
- Screen reader optimization
- Large text and high contrast modes
- Haptic feedback integration

### Key Screens
1. **Home/Dashboard**
   - Current mode indicator
   - Navigation status
   - Quick access to emergency
   - Battery and connection status

2. **Navigation Control**
   - Start/stop navigation
   - Mode selector
   - Destination input
   - Real-time guidance visualization

3. **Settings**
   - Audio preferences (volume, speed, voice)
   - Device pairing and management
   - Cloud service configuration
   - Offline mode settings

4. **Emergency**
   - Emergency contact list
   - Fall detection settings
   - Quick SOS button
   - Alert history

### Deliverables
- Complete mobile UI
- Settings and configuration interface
- Debugging and monitoring dashboard
- Accessibility compliance testing

---

## Phase 7: Offline & Fallback

**Duration:** 2-3 weeks | **Dependency:** Phase 3, 5

### 7.1 Offline Mode Implementation
- Connectivity monitoring:
  - Latency tracking (target < 300ms)
  - Bandwidth estimation
  - Signal strength monitoring
- Automatic fallback triggering (latency > 500ms or connection lost)
- Cache management for previously processed results
- User notification of connectivity state changes

### 7.2 On-Device Models
- Integrate MobileNet-SSD for obstacle detection (~5MB)
- Integrate DeepLab Mobile for path segmentation (~8MB)
- Optional: Whisper Tiny for speech recognition (~40MB)
- Model quantization and optimization for mobile
- Inference pipeline with latency optimization

### Key Components
- `ConnectivityMonitor.ts` - Network quality tracking
- `FallbackManager.ts` - Offline mode orchestration
- `CacheManager.ts` - Local result caching
- `TFLiteInference.ts` - On-device model inference
- `OfflineModeUI.ts` - Offline state notification

### Fallback Models

| Model | Size | Purpose | Latency |
|-------|------|---------|---------|
| MobileNet-SSD | ~5MB | Basic obstacle detection | 50-100ms |
| DeepLab Mobile | ~8MB | Path/sidewalk segmentation | 100-150ms |
| Whisper Tiny | ~40MB | Basic speech recognition | 500-1000ms |

### Degraded Mode Features
- **Available**: Obstacle alerts, basic path detection, predefined voice commands
- **Limited**: Scene description, item search, conversational AI
- **User Notification**: Audio announcement when entering/exiting offline mode

### Deliverables
- Connectivity monitoring system
- Automatic fallback mechanism
- Integrated on-device ML models
- Seamless offline/online transitions
- Cache management and optimization

---

## Phase 8: Testing & Optimization

**Duration:** 2-3 weeks | **Dependency:** Phases 1-7

### 8.1 Testing Suite
- **Unit Tests**: State machine, navigation logic, audio engine
- **Integration Tests**: BLE communication, cloud API, end-to-end workflows
- **Performance Tests**: Latency measurement, memory profiling, battery usage
- **Stress Tests**: Multiple rapid state transitions, high-frequency frame processing
- **User Acceptance Tests**: Real device testing with mock scenarios

### 8.2 Performance Optimization
- Latency optimization to meet 200-430ms target end-to-end
- Memory profiling and optimization
- Network bandwidth optimization
- Battery drain analysis and mitigation
- CPU usage profiling and optimization

### 8.3 Testing Infrastructure
- Mock device simulator for testing
- Mock cloud API server for offline testing
- CI/CD pipeline integration
- Automated regression testing
- Performance baseline tracking

### Testing Checklist
- [ ] BLE connection/disconnection handling
- [ ] Frame loss and recovery
- [ ] Cloud API timeout and retry
- [ ] State transition edge cases
- [ ] Audio priority queue correctness
- [ ] Offline/online transition
- [ ] Memory leaks detection
- [ ] Battery impact analysis
- [ ] 10+ hour continuous operation
- [ ] 100+ reconnection cycles

### Deliverables
- Comprehensive test suite (80%+ code coverage)
- Performance baseline metrics
- Optimization report
- CI/CD pipeline with automated tests
- Performance monitoring dashboard

---

## Phase 9: Deployment & Release

**Duration:** 1-2 weeks | **Dependency:** Phase 8

### 9.1 Build & Deployment
- Staging environment testing
- App store/Play Store submission
- Beta testing with real users (5-10 testers)
- Crash reporting setup (Sentry, Firebase Crashlytics)
- Analytics and monitoring setup
- Update management and rollout strategy

### 9.2 Pre-Release Checklist
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Privacy policy finalized
- [ ] User documentation complete
- [ ] Emergency contact procedures tested
- [ ] Accessibility compliance verified
- [ ] Beta testing feedback incorporated

### 9.3 Release Strategy
- **Phase 1**: Closed beta (5-10 testers)
- **Phase 2**: Open beta (100+ testers)
- **Phase 3**: Limited release (regional or feature-limited)
- **Phase 4**: Full public release

### 9.4 Post-Release
- Monitor crash rates and performance
- Collect user feedback
- Plan maintenance and updates
- Security updates rollout procedure
- Feature enhancement backlog

### Deliverables
- Production build
- App store listings
- User documentation
- Monitoring and alerting setup
- Rollback procedures

---

## Timeline Summary (Hybrid Parallel Approach)

### Compressed Timeline with iOS + Android Parallel Development

| Week | Phase | iOS | Android | Shared | Cumulative |
|------|-------|-----|---------|--------|-----------|
| 1-2 | Phase 1: Foundation | ✓ Setup | Setup | Project init, deps | 2 weeks |
| 3-4 | Phase 2: BLE | ✓ Manager | ✓ Manager | Adapter interface | 4 weeks |
| 5-6 | Phase 3: Cloud | ✓ Client | ✓ Client | Shared client lib | 6 weeks |
| 7-8 | Phase 4: State | ✓ Machine | ✓ Machine | Core logic | 8 weeks |
| 9-10 | Phase 5: Audio | ✓ Engine | ✓ Engine | Priority queue | 10 weeks |
| 11 | Phase 6: UI | ✓ iOS UI | ✓ Android UI | Shared screens | 11 weeks |
| 12 | Phase 7: Offline | ✓ ML/Cache | ✓ ML/Cache | Connectivity mon. | 12 weeks |
| 13-14 | Phase 8: Testing | ✓ Test suite | ✓ Test suite | E2E, perf bench | 14 weeks |
| 15-16 | Phase 9: Deployment | ✓ iOS build/beta | ✓ Android build/beta | Monitoring, analytics | 16 weeks |

**Estimated MVP Timeline: 16 weeks (4 months)**
- Saves 50% time vs. sequential approach (24 weeks)
- Both iOS and Android ready for beta simultaneously

### Sequential Comparison (NOT Recommended)
- Weeks 1-12: iOS complete
- Weeks 13-24: Android porting
- **Total: 24 weeks (6 months)** - Risks architectural rework

---

## Resource Allocation

### Team Structure (Parallel Development)
- **3 Mobile Developers (Recommended)**
  - 1 Lead Developer - Architecture, shared core, adapter patterns
  - 1 iOS Specialist - Native modules, CoreBluetooth, AVFoundation, iOS-specific features
  - 1 Android Specialist - Native modules, Bluetooth LE GATT, audio/TTS, Android-specific features
  - (Optional) 1 QA/DevOps - Testing automation, CI/CD, performance profiling

**Alternative for 2-Developer Team:**
- Week 1-4 (Phase 1-2): Both developers on shared foundation + iOS BLE
- Week 5+ (Phase 3+): Dev 1 leads shared core; Dev 2 starts Android BLE in parallel

### Required Expertise
- Mobile development (React Native or native iOS/Android)
- Real-time systems and latency optimization
- Audio processing and spatial audio
- Machine learning inference optimization
- Cloud API integration
- Accessibility and UX for visually impaired users

---

## Risk Mitigation

### Key Risks
1. **Latency exceeding 500ms target** → Start performance optimization early
2. **BLE connectivity issues** → Invest in robust reconnection logic early
3. **Cloud API rate limits** → Implement caching and request queuing
4. **Battery drain** → Profile early, optimize aggressively
5. **Audio interruption timing** → Rigorous testing of priority queue

### Mitigation Strategies (Parallel Development)
- Weekly performance benchmarking on both platforms
- Early prototype BLE adapter on iOS + Android (Week 3-4)
- Load testing with cloud APIs (both platforms)
- Battery drain analysis starting Phase 4 (parallel on both)
- Audio system stress testing in Phase 8 (parallel on both)
- Platform-specific issues caught during feature dev, not porting phase

---

## Dependencies & Prerequisites

### Software Dependencies
- React Native CLI / Xcode / Android Studio
- BLE libraries (react-native-ble-plx, CoreBluetooth, Android BLE)
- WebSocket and HTTP client libraries
- Audio framework (AVFoundation, ExoPlayer)
- ML frameworks (TensorFlow Lite, CoreML)
- Testing frameworks (Jest, Detox, XCTest)

### Hardware Requirements
- Development devices (iOS and Android)
- Mock ESP32 device for testing
- GPU instance for cloud service testing

### External Services
- Cloud platform (AWS/GCP)
- TTS service (ElevenLabs, Azure, OpenAI)
- ASR service (Whisper, Deepgram, AssemblyAI)
- LLM service (Claude, GPT-4V)
- Crash reporting (Sentry, Firebase)
- Analytics (Firebase Analytics, Mixpanel)

---

## Platform Checklists

### iOS Checklist
- [ ] Info.plist privacy keys: `NSBluetoothAlwaysUsageDescription`, `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`
- [ ] Background Modes: Bluetooth LE accessories, Audio
- [ ] Configure `AVAudioSession` (playAndRecord, ducking as needed)
- [ ] CoreBluetooth scanning/connection with reconnection policy
- [ ] Handle app lifecycle (suspend/resume) for BLE and audio
- [ ] Entitlements and signing profiles
- [ ] Test VoiceOver navigation flows

### Android Checklist
- [ ] Permissions (Android 12+): `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_ADVERTISE` (if needed)
- [ ] Legacy location permission for BLE pre-Android 12
- [ ] Foreground Service for continuous BLE/audio; notification channel
- [ ] AudioFocus handling and mixing
- [ ] Bluetooth LE scanning, GATT MTU tuning, reconnection policy
- [ ] Battery optimizations exclusion (Doze/App Standby as needed)
- [ ] Test TalkBack navigation flows

## CI/CD for iOS & Android
- iOS: Fastlane `gym` + TestFlight (`fastlane ios beta`), GitHub Actions macOS runners
- Android: Gradle bundles + Play internal track (`fastlane android beta`)
- Secrets management for signing (App Store Connect API key / Play JSON)
- Env config via `react-native-config` for endpoints/keys per environment
- Crash/analytics wiring validation in pre-release

## Success Metrics

### Performance Metrics
- End-to-end latency: 200-430ms (Phase 4 onwards)
- BLE connection establishment: < 5 seconds
- Cloud API response time: < 200ms (excluding inference)
- TTS latency: < 500ms from request to audio playback
- Memory usage: < 200MB average
- Battery drain: < 10% per hour continuous use

### Quality Metrics
- Test coverage: ≥ 80%
- Crash-free sessions: ≥ 99%
- API success rate: ≥ 99.5%
- State transition accuracy: 100%

### User Metrics
- Time to first guidance: < 2 seconds (NAVIGATING mode)
- Successful obstacle detection rate: ≥ 95%
- User satisfaction (beta): ≥ 4.0/5.0
- Zero critical bugs at release

---

## Notes for Development Team

1. **Start Performance Optimization Early**: Don't wait until Phase 8 to optimize latency
2. **Use Real Hardware Early**: Begin device communication testing with actual ESP32 ASAP
3. **Implement Logging Extensively**: Critical for debugging latency and connectivity issues
4. **Plan for Accessibility**: Don't make UI accessibility an afterthought
5. **Test Offline Scenarios**: Offline mode should be tested continuously, not just Phase 7
6. **Document API Contracts**: Clear documentation of cloud API responses essential for team coordination
7. **Consider Localization**: Audio content and UI should support multiple languages early

---

**Last Updated:** December 18, 2025  
**Status:** Planning Phase  
**Next Review:** Upon completion of Phase 1
