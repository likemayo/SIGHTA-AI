# UI/UX Implementation Plan
## Audio-First, Visually-Accessible Mobile App

---

## 1. Overview

This plan outlines the implementation strategy for SIGHTA-AI's mobile UI/UX, prioritizing **audio-first interaction** with high-contrast visual design for sighted helpers and partial-sight users.

### Core Principle
**The app must be 100% usable with zero vision.**

---

## 2. MVP Scope (Phase 1)

### Screens (Required)
1. **Home/Idle** — Central action button, status bar, quick access to Emergency/Describe/Settings
2. **Navigation** — Continuous guidance, haptic feedback, optional visual overlays
3. **Emergency** — Fast activation, big call buttons, auto-call countdown
4. **Settings** — Audio-first menu, adjustable voice/haptic/language
5. **Onboarding** — Audio tutorial for commands, gestures, emergency

### Core Features
- **Voice Commands**: Start/stop navigation, where am I, what's ahead/left/right, find [object], help
- **PTT (Press-to-Talk)**: Double-tap-and-hold or main button for speech input
- **TTS (Text-to-Speech)**: Priority queue (Critical > High > Medium > Low) with earcons
- **Haptics**: Mapped patterns (connect, disconnect, error, guidance step, danger, arrival)
- **High-Contrast Visual**: WCAG AAA (7:1+ contrast), 24–48pt fonts, ≥88pt touch targets
- **Accessibility**: Full VoiceOver/TalkBack support (labels, hints, roles, states)
- **Notifications/Errors**: Banner + TTS + earcon (connection, battery, GPS, offline)

### Dependencies
```json
{
  "@react-native-voice/voice": "^3.2.x",
  "react-native-tts": "^5.2.x",
  "react-native-haptic-feedback": "^2.2.x",
  "react-native-sound": "^0.11.x",
  "@react-navigation/native": "^6.x",
  "react-native-keep-awake": "^5.1.x"
}
```

---

## 3. Phase-2 Scope (Nice-to-Have)

### Additional Screens
- **Point-to-Identify/Search**: Tap on camera to identify objects
- **Crosswalk Mode**: Traffic light detection, alignment cues

### Additional Features
- Wake-word always-listening ("Hey Navigator")
- Spatial audio cues for obstacles
- Advanced customization (voice pitch/gender, color presets)
- Continuous point-to-identify with SAM2 integration
- Advanced gesture system (swipe, pinch, long-press contexts)

---

## 4. Component Architecture

### Folder Structure
```
src/
├── screens/
│   ├── HomeScreen.tsx
│   ├── NavigationScreen.tsx
│   ├── EmergencyScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── PointToIdentifyScreen.tsx (Phase 2)
│   └── CrosswalkScreen.tsx (Phase 2)
│
├── components/
│   ├── AccessibleButton.tsx
│   ├── NotificationBanner.tsx
│   ├── StatusBar.tsx
│   ├── VoiceCommandHandler.tsx
│   └── HapticFeedback.tsx
│
├── services/
│   ├── TTSService.ts
│   ├── SpeechRecognitionService.ts
│   ├── HapticService.ts
│   ├── AudioCueService.ts
│   └── WebSocketService.ts (existing)
│
├── hooks/
│   ├── useVoiceCommands.ts
│   ├── useTTS.ts
│   ├── useHaptics.ts
│   ├── useWebSocket.ts (existing)
│   └── useAccessibility.ts
│
├── styles/
│   ├── colors.ts (high-contrast themes)
│   ├── typography.ts
│   └── spacing.ts
│
├── types/
│   ├── ui.types.ts
│   ├── voice.types.ts
│   └── websocket.types.ts (existing)
│
└── navigation/
    └── RootNavigator.tsx
```

---

## 5. Implementation Sequence

### Phase 1: Foundation (Weeks 1–2)
1. **Services Layer**
   - Create TTSService (priority queue, pause/resume, rate/volume control)
   - Create SpeechRecognitionService (PTT, command parsing, confidence checking)
   - Create HapticService (pattern registry, async vibration sequences)
   - Create AudioCueService (earcon bank, priority mixing)

2. **Core Components**
   - AccessibleButton (base for all interactive elements)
   - NotificationBanner (TTS + earcon + visual)
   - StatusBar (connection, battery, auth status)

3. **Hooks**
   - useVoiceCommands (command parsing, confidence thresholds)
   - useTTS (manage TTS queue, pause/resume, rate adjustments)
   - useHaptics (trigger patterns, async sequences)
   - useAccessibility (screen reader labels, roles, hints)

4. **Styles**
   - High-contrast color themes (white/black, yellow/black presets)
   - Typography scale (24pt–48pt, bold sans-serif)
   - Spacing constants (88pt targets, 32pt min gaps)

### Phase 1: Screens (Weeks 2–3)
1. **Home Screen**
   - Central giant action button (Start Navigation)
   - Status bar (READY, battery, GPS)
   - Bottom quick actions (Emergency, Describe, Settings)
   - Voice commands: start, where am I, settings, help
   - Gestures: tap, double-tap repeat, two-finger swipe emergency

2. **Navigation Screen**
   - Continuous TTS guidance with priority queue
   - Optional low-opacity camera for visual context
   - Haptic pulses per guidance step
   - Bottom controls: Stop Nav, Search, Emergency
   - Voice commands: stop, what's ahead/left/right, find [object], repeat
   - Gestures: tap pause/resume, swipes for directional queries

3. **Emergency Screen**
   - Huge primary button (Call 911/Emergency Contact)
   - Secondary button for emergency contact selection
   - Cancel button
   - Auto-call countdown (5s)
   - Audio: "Emergency activated. Calling in 3... 2... 1..."
   - Haptic: continuous vibration warning pattern

4. **Settings Screen**
   - Audio-first menu (spoken numbered options)
   - Voice speed slider (0.5x–2x)
   - Volume slider (0–100%)
   - Sound effects toggle
   - Vibration toggle + intensity
   - Language selector
   - Emergency contact configuration
   - Save & Return

5. **Onboarding Screen**
   - Step-by-step audio tutorial
   - Teach voice commands, gestures, emergency
   - Practice navigation session
   - Recap at end; option to repeat

### Phase 1: Integration (Week 4)
1. Wire all screens into navigation stack
2. **Integrate ESP32-S3 WebSocket Connection**
   - Connect to necklace via existing WebSocketService
   - Handle camera frame streaming from ESP32
   - Display connection status on all screens
   - Implement reconnection logic with audio feedback
   - Add "Lost connection" → "Reconnecting" → "Connected" flow
3. **Integrate Cloud ML API Connection (HuggingFace/AWS)**
   - Send frames from ESP32 to cloud
   - Receive detection results
   - Convert results to navigation guidance (TTS)
4. Add error/notification flows (connection, battery, GPS, offline)
5. Full accessibility pass (VoiceOver/TalkBack testing)
6. Testing with screen off (audio-only mode)

### Phase 2: Enhancement (Weeks 5–6)
1. Point-to-Identify screen (camera + tap + identify)
2. Crosswalk Mode (traffic light detection, alignment haptics)
3. Wake-word listening
4. Spatial audio cues
5. Advanced customization options

---

## 6. Detailed Component Specs

### 6.1 AccessibleButton Component

**Purpose**: Base button with automatic audio + haptic feedback

**Props**:
- `title: string` — Button label
- `onPress: () => void` — Action
- `accessibilityLabel?: string` — Screen reader label
- `accessibilityHint?: string` — What the button does
- `variant?: 'primary' | 'danger' | 'secondary'` — Style variant
- `disabled?: boolean` — Disabled state

**Behavior**:
- On press: Haptic feedback (medium) + TTS (button title)
- Visual: High contrast, ≥88pt, bold text
- Accessible: Full VoiceOver/TalkBack support

**Example**:
```typescript
<AccessibleButton
  title="START NAVIGATION"
  onPress={startNavigation}
  accessibilityLabel="Start Navigation"
  accessibilityHint="Activates navigation mode"
  variant="primary"
/>
```

---

### 6.2 NotificationBanner Component

**Purpose**: Display notifications with TTS + earcon + visual

**Props**:
- `message: string` — Text to display and read
- `type: 'info' | 'warning' | 'error' | 'success'` — Notification type
- `priority: 'low' | 'medium' | 'high' | 'critical'` — TTS priority
- `duration?: number` — Auto-dismiss in ms (0 = manual)
- `action?: { label: string; onPress: () => void }` — Optional action button

**Behavior**:
- On mount: Haptic + earcon + TTS (respecting priority queue)
- Visual: High contrast banner, large text (28pt)
- Auto-dismiss or manual close (with haptic feedback)

**Example**:
```typescript
<NotificationBanner
  message="Connection to device lost. Attempting to reconnect..."
  type="warning"
  priority="high"
  duration={5000}
/>
```

---

### 6.3 VoiceCommandHandler Hook

**Purpose**: Parse voice input, execute commands, handle confidence

**Returns**:
```typescript
{
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  lastCommand: string;
  confidence: number;
  error?: Error;
}
```

**Behavior**:
- Parse command with confidence threshold (default 70%)
- If confidence < threshold: Ask for confirmation
- If unrecognized after 3 attempts: Fallback to gesture hint
- Command map: start, stop, where, what, find, help, repeat, settings, etc.

**Example**:
```typescript
const { isListening, startListening, lastCommand } = useVoiceCommands({
  threshold: 0.7,
  commands: ['start navigation', 'where am i', 'help'],
  onCommand: (cmd) => handleCommand(cmd),
});
```

---

### 6.4 TTSService

**Purpose**: Manage text-to-speech with priority queue and customization

**Methods**:
- `speak(text: string, priority: 'low' | 'medium' | 'high' | 'critical'): Promise<void>`
- `pause(): Promise<void>`
- `resume(): Promise<void>`
- `stop(): Promise<void>`
- `setRate(rate: number): Promise<void>` (0.5–2.0)
- `setVolume(volume: number): Promise<void>` (0–100)
- `setLanguage(lang: string): Promise<void>`

**Behavior**:
- Critical messages interrupt queue immediately
- High messages interrupt medium/low
- Medium and low are queued in order
- Auto-pause on user interrupt
- Pair each speak with optional haptic/earcon

---

### 6.5 HapticService

**Purpose**: Manage vibration patterns with async sequencing

**Methods**:
- `connect(): void` — Double pulse
- `disconnect(): void` — Long pulse
- `error(): void` — Triple short
- `guidanceStep(): void` — Light tick
- `danger(): void` — Triple strong (warning)
- `arrival(): void` — Celebratory pattern
- `understood(): void` — Double tap
- `custom(pattern: number[]): Promise<void>` — Custom ms sequence

**Pattern Spec** (array of ms durations):
```typescript
const celebratory = [100, 50, 100, 50, 300]; // 100ms on, 50ms off, etc.
```

---

### 6.6 NavigationScreen ML Pipeline Integration

**Data Flow**:
```
ESP32-S3 Necklace (Camera)
    ↓ [WebSocket: Video frames]
Mobile App (React Native)
    ↓ [REST/WebSocket: Frames + commands]
Cloud ML Service (HuggingFace/AWS)
    ↓ [Response: Detections, segmentation]
Mobile App (Process results)
    ↓ [TTS: Navigation guidance]
User (Earbuds)
```

**Implementation Steps**:
1. Receive frames from ESP32 via WebSocket
2. Buffer frames (keep last 2-3)
3. Send keyframes to cloud ML API (every Nth frame)
4. Parse detection results (obstacles, path, people)
5. Generate navigation guidance based on detections
6. Queue TTS with appropriate priority
7. Update visual overlay (for helpers)

**Guidance Generation Logic**:
```typescript
function generateGuidance(detections: Detection[]): Guidance {
  // Check for critical dangers
  const dangers = detections.filter(d => 
    d.class === 'car' && d.distance < 3
  );
  if (dangers.length > 0) {
    return { text: "STOP! Car approaching!", priority: 'critical' };
  }

  // Check for obstacles
  const obstacles = detections.filter(d => 
    ['person', 'bicycle', 'pole'].includes(d.class) &&
    d.distance < 2
  );
  if (obstacles.length > 0) {
    return { text: `Obstacle ahead, move ${obstacles[0].direction}`, priority: 'high' };
  }

  // Check path deviation
  if (pathSegmentation.deviation > 15) {
    return { text: `Slight ${pathSegmentation.direction} to follow path`, priority: 'medium' };
  }

  // Default
  return { text: "Continue straight", priority: 'low' };
}
```

---

### 6.7 Press-to-Talk (PTT) Implementation

**User Flow**:
```
User presses and holds main button
    ↓ [Haptic: Double pulse]
    ↓ [Earcon: "Ding" listening tone]
    ↓ [TTS: (optional) "Listening..."]
    ↓ [Start recording audio]
User releases button
    ↓ [Earcon: "Bonk" processing tone]
    ↓ [Stop recording]
    ↓ [Send to ASR service]
    ↓ [Parse command]
    ↓ [Execute action + confirm with TTS]
```

**Implementation**:
```typescript
const PTTButton = () => {
  const [isRecording, setIsRecording] = useState(false);

  const handlePressIn = async () => {
    setIsRecording(true);
    HapticService.doubleTap();
    AudioService.playListening();
    await VoiceRecognitionService.startListening();
  };

  const handlePressOut = async () => {
    setIsRecording(false);
    AudioService.playProcessing();
    await VoiceRecognitionService.stopListening();
    // Command will be processed in VoiceRecognitionService callback
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pttButton}
    >
      <Text>HOLD TO SPEAK</Text>
    </TouchableOpacity>
  );
};
```

**Alternative: Always-Listening (Phase 2)**
- Use wake word detection ("Hey Navigator")
- Lower battery impact with on-device processing
- Continuous listening with privacy considerations

---

## 7. Accessibility Requirements

### All Screens Must Have
- ✅ `accessibilityLabel` on every interactive element
- ✅ `accessibilityHint` explaining action outcome
- ✅ `accessibilityRole` (button, header, text, etc.)
- ✅ `accessibilityState` (selected, disabled, checked)
- ✅ Linear focus order (no jumping around)
- ✅ Min contrast ratio 7:1 (WCAG AAA)
- ✅ Min font size 24pt
- ✅ Min touch target 88pt
- ✅ No time limits or user-controlled
- ✅ VoiceOver/TalkBack fully tested

### Testing Checklist
- [ ] Screen reader enabled (iOS VoiceOver / Android TalkBack)
- [ ] All elements announced clearly
- [ ] No announcements skipped or doubled
- [ ] Focus order logical and predictable
- [ ] Contrast checked with accessibility analyzer
- [ ] Touch targets >= 88pt minimum
- [ ] Tested with screen off (audio-only mode)
- [ ] Tested in real noisy environments
- [ ] Tested by actual blind/VI users

---

## 8. Error Handling & Edge Cases

### Connection Loss
- **TTS**: "Lost connection to device. Reconnecting..."
- **Haptic**: Long pulse warning
- **Visual**: Red banner with retry button
- **Voice command**: "Reconnect device" or "Use phone camera only"

### Low Battery
- **20%**: "Battery at 20%. Consider charging soon."
- **10%**: Auto-enable battery-saving mode (reduced camera/AI, visual off)
- **5%**: "Battery critical. Find safe location to stop."

### No GPS Signal
- **TTS**: "GPS signal weak. Using last known position and device sensors."
- **Visual**: GPS indicator grayed out

### Offline Mode
- **TTS**: "Using offline mode. Basic obstacle detection available."
- **Functionality**: Cache last nav instructions, queue requests for later sync

### Command Not Understood
- **< 70% confidence**: "Did you mean '[interpreted]'? Say Yes or No."
- **Multiple failures**: "Having trouble understanding. Try tap gesture or say 'Help'."

---

## 9. Testing Strategy

### Unit Tests
- TTS priority queue (verify interruption rules)
- Command parsing (confidence, clarification logic)
- Haptic pattern sequences (timing correctness)
- Earcon mixing (no overlaps)

### Integration Tests
- Screen transitions (no audio overlap)
- Voice → haptic → visual synchronization
- WebSocket integration (connection status updates, auth)
- Error recovery flows (reconnect, retry, offline)

### Accessibility Tests
- VoiceOver/TalkBack full navigation
- Zoom/text scaling (200% readable)
- High contrast modes
- Screen-reader-only mode (screen off)

### Real-World Tests
- Blind/VI user testing (5–10 testers)
- Noisy environment testing (street, traffic)
- Long navigation session (30+ min battery)
- Cold start (first-time user, no familiarity)

---

## 10. Dependencies & Installation

### Install Dependencies
```bash
npm install @react-native-voice/voice
npm install react-native-tts
npm install react-native-haptic-feedback
npm install react-native-sound
npm install @react-navigation/native
npm install @react-navigation/stack
npm install react-native-keep-awake
```

### Native Configuration (iOS)
1. **Microphone Permission** (Info.plist):
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>We need microphone access for voice commands</string>
   ```

2. **Audio Session** (AppDelegate.swift):
   ```swift
   import AVFoundation
   let audioSession = AVAudioSession.sharedInstance()
   try? audioSession.setCategory(.record, mode: .default, options: [.duckOthers])
   ```

### Native Configuration (Android)
1. **Permissions** (AndroidManifest.xml):
   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.CAMERA" />
   ```

2. **Audio Focus** (MainActivity.kt):
   ```kotlin
   val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
   audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
   ```

---

## 11. Performance Considerations

- **TTS Caching**: Pre-generate common prompts (startup, nav steps) for faster playback
- **Voice Recognition**: Process on-device when possible; batch cloud requests
- **Haptics**: Use async patterns to avoid blocking UI
- **Audio Mixing**: Use native audio session controls (ducking, focus)
- **Battery**: Disable screen during audio-only mode; reduce inference frequency

### Performance Benchmarks (Target)

**Latency Targets**:
- Button press → Haptic feedback: <50ms
- Button press → Audio feedback: <100ms
- Voice command → Confirmation: <500ms
- Frame received → ML inference → Guidance: <300ms
- Critical alert → TTS playback: <100ms

**Resource Usage Targets**:
- Battery drain: <10% per hour during navigation
- Memory usage: <200MB average
- CPU usage: <30% average (spikes to 60% during inference)
- Network data: <10MB per hour (excluding camera streaming)

**Monitoring**:
```typescript
// Add performance monitoring
import perf from '@react-native-firebase/perf';

const trace = perf().newTrace('navigation_guidance');
await trace.start();
// ... process ML results ...
await trace.stop();
```

**Why:** Performance targets help developers optimize and debug.

---

## 12. Success Criteria (MVP)

- ✅ All MVP screens complete and accessible
- ✅ Voice commands working at ≥80% accuracy
- ✅ TTS priority queue functioning without overlap
- ✅ Haptic patterns distinct and recognizable
- ✅ VoiceOver/TalkBack fully functional on all elements
- ✅ High-contrast visual design meets WCAG AAA
- ✅ 2+ hours of continuous navigation without crashes
- ✅ Zero-vision usability validated by blind/VI testers
- ✅ Documentation complete for all screens/gestures/commands

---

## 13. Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Foundation (Services/Hooks)** | 1 week | TTS, Speech Recognition, Haptics, Earcons |
| **Core Components** | 3 days | AccessibleButton, Banner, StatusBar |
| **MVP Screens** | 2 weeks | Home, Navigation, Emergency, Settings, Onboarding |
| **Integration & Testing** | 1 week | Navigation stack, error flows, accessibility pass |
| **Phase 2 (Optional)** | 2 weeks | Point-to-Identify, Crosswalk, Wake-word, Customization |

**Total MVP Timeline**: ~4 weeks

---

## 14. Handoff to Design/Development

### Design System Artifacts
- Color palette (high-contrast presets)
- Typography scale (24pt–48pt)
- Component specs (buttons, banners, inputs)
- Screen wireframes (Home, Navigation, Emergency, Settings)
- Gesture guide (with diagrams)
- Accessibility checklist

### Code Artifacts
- Component stubs with accessibility props
- Service skeletons with method signatures
- Hook templates with usage examples
- Styles/theme system
- Navigation structure

### Documentation
- Command reference (all voice commands)
- Haptic pattern guide (timing, use cases)
- Earcon bank (audio files, descriptions)
- Error handling matrix (scenarios, responses)
- Testing checklist

