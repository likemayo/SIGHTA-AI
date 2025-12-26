# UI/UX Implementation Details
## Updated Execution Plan (Priority)

**Immediate next steps**
- Implement `src/services/TTSService.ts` with priority queue and `initialize/stop/repeatLast`.
- Call `TTSService.initialize()` in `App.tsx` `useEffect` (with cleanup), and add temporary test buttons to validate 5 cases on iOS/Android.
- Commit current Android changes (cleartext traffic + remove stale `android/app/src/main/assets/index.android.bundle`).

**Phase 1: Services (finish before UI)**
- Day 1: TTSService (priority queue, initialize/stop/repeatLast, tests: basic, interrupt, queue order, repeat, stop).
- Day 2: HapticService (named patterns, `setEnabled`, test on both platforms).
- Day 3: AudioCueService placeholder (log-only methods; `setEnabled/setVolume`).
- Day 4: VoiceRecognitionService (wire `@react-native-voice/voice` events, fuzzy matching, confidence threshold, confirmation, failure counter, PTT test button).

**Phase 2: Components & Navigation**
- Day 6: `constants.ts`, `styles.ts`, `accessibility.ts`.
- Day 7: Components (AccessibleButton using services directly, StatusBar, NotificationBanner).
- Day 8: Navigation setup (stack navigator; wrap in App.tsx; remove temp test UI afterward).
- Days 9-10: Screens (Home → Navigation → Emergency → Settings → Onboarding) with voice/haptics/TTS per specs.

**Phase 3: ML & ESP32**
- Add `MLService`, wire to existing `WebSocketService`, add `NavigationGuidanceService` for priority guidance.

**Phase 4: Test & Polish**
- Real-world tests, bugfix, docs, remove test buttons/logs.

## Concrete Code Structure & Service APIs

---

## 1. TTSService - Text-to-Speech with Priority Queue

### File: `src/services/TTSService.ts`

**Purpose**: Manage TTS with priority-based message queueing, preventing overlap and ensuring critical alerts interrupt lower-priority messages.

**API**:
```typescript
class TTSService {
  // Core methods
  speak(text: string, priority: 'critical' | 'high' | 'medium' | 'low'): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<void>
  
  // Settings
  setRate(rate: number): Promise<void>        // 0.5 – 2.0
  setVolume(volume: number): Promise<void>    // 0 – 100
  setLanguage(lang: string): Promise<void>    // 'en-US', 'es-ES', etc.
  
  // Queue management
  getQueueLength(): number
  clearQueue(): void
  
  // Events
  onStart?: () => void
  onFinish?: () => void
  onError?: (error: Error) => void
}

export default new TTSService()
```

**Internal Structure**:
```typescript
interface QueueItem {
  id: string
  text: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  timestamp: number
}

class TTSService {
  private queue: QueueItem[] = []
  private isPlaying: boolean = false
  private currentPriority: 'critical' | 'high' | 'medium' | 'low' | null = null
  private rate: number = 1.0
  private volume: number = 100
  private language: string = 'en-US'

  async speak(text: string, priority: 'critical' | 'high' | 'medium' | 'low'): Promise<void> {
    const item: QueueItem = {
      id: Date.now().toString(),
      text,
      priority,
      timestamp: Date.now(),
    }

    // Critical messages interrupt immediately
    if (priority === 'critical' && this.isPlaying) {
      await Tts.stop()
      this.queue = [] // Clear queue
      this.isPlaying = false
      this.currentPriority = null
    }

    // High interrupts medium/low
    if (priority === 'high' && this.currentPriority === 'medium' || this.currentPriority === 'low') {
      await Tts.stop()
      this.isPlaying = false
      // Keep high/critical in queue, remove low/medium
      this.queue = this.queue.filter(q => q.priority === 'high' || q.priority === 'critical')
    }

    this.queue.push(item)
    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.queue.length === 0) return

    this.queue.sort((a, b) => {
      const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityMap[a.priority] - priorityMap[b.priority]
    })

    const item = this.queue.shift()!
    this.isPlaying = true
    this.currentPriority = item.priority

    try {
      await Tts.speak(item.text)
      this.onFinish?.()
    } catch (error) {
      this.onError?.(error as Error)
    } finally {
      this.isPlaying = false
      this.currentPriority = null
      this.processQueue()
    }
  }

  async setRate(rate: number): Promise<void> {
    this.rate = Math.max(0.5, Math.min(2.0, rate))
    await Tts.setDefaultRate(this.rate)
  }

  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(100, volume))
    // Note: React Native TTS doesn't directly support volume control
    // Use system volume or audio ducking instead
  }

  async setLanguage(lang: string): Promise<void> {
    this.language = lang
    await Tts.setDefaultLanguage(lang)
  }

  getQueueLength(): number {
    return this.queue.length
  }

  clearQueue(): void {
    this.queue = []
  }

  async pause(): Promise<void> {
    await Tts.pause?.() || console.warn('Pause not supported on this platform')
  }

  async resume(): Promise<void> {
    await Tts.resume?.() || console.warn('Resume not supported on this platform')
  }

  async stop(): Promise<void> {
    await Tts.stop()
    this.isPlaying = false
    this.queue = []
  }
}
```

---

## 2. SpeechRecognitionService - Voice Commands

### File: `src/services/SpeechRecognitionService.ts`

**Purpose**: Handle PTT (Press-to-Talk), speech recognition, command parsing, and confidence-based clarification.

**API**:
```typescript
interface CommandResult {
  command: string
  confidence: number
  recognized: boolean
}

class SpeechRecognitionService {
  // Core methods
  startListening(): Promise<void>
  stopListening(): Promise<void>
  
  // Configuration
  setConfidenceThreshold(threshold: number): void  // 0–1, default 0.7
  registerCommand(keyword: string, handler: () => void): void
  
  // Events
  onCommandRecognized?: (result: CommandResult) => void
  onError?: (error: Error) => void
  onListeningStart?: () => void
  onListeningStop?: () => void
}

export default new SpeechRecognitionService()
```

**Internal Structure**:
```typescript
class SpeechRecognitionService {
  private isListening: boolean = false
  private confidenceThreshold: number = 0.7
  private commands: Map<string, () => void> = new Map()
  private failureCount: number = 0

  // Command registry
  private commandMap = {
    'start navigation': 'START_NAVIGATION',
    'stop navigation': 'STOP_NAVIGATION',
    'where am i': 'DESCRIBE_LOCATION',
    'what\'s ahead': 'WHAT_AHEAD',
    'what\'s on my left': 'WHAT_LEFT',
    'what\'s on my right': 'WHAT_RIGHT',
    'find': 'FIND_OBJECT',
    'help': 'EMERGENCY',
    'repeat': 'REPEAT',
    'settings': 'SETTINGS',
  }

  async startListening(): Promise<void> {
    this.isListening = true
    this.onListeningStart?.()

    try {
      await Voice.start('en-US')
    } catch (error) {
      this.onError?.(error as Error)
      this.isListening = false
    }
  }

  async stopListening(): Promise<void> {
    this.isListening = false
    try {
      await Voice.stop()
    } catch (error) {
      this.onError?.(error as Error)
    }
    this.onListeningStop?.()
  }

  // This gets called by Voice.onSpeechResults
  handleVoiceResults(results: string[]): void {
    if (!results || results.length === 0) {
      this.handleNoMatch()
      return
    }

    const spoken = results[0].toLowerCase()
    const { command, confidence } = this.parseCommand(spoken)

    if (confidence < this.confidenceThreshold) {
      // Ask for confirmation
      this.askForConfirmation(spoken, command)
    } else {
      // Execute immediately
      this.failureCount = 0
      this.onCommandRecognized?.({ command, confidence, recognized: true })
      this.executeCommand(command)
    }
  }

  private parseCommand(spoken: string): { command: string; confidence: number } {
    let bestMatch = ''
    let bestScore = 0

    for (const [keyword, cmd] of Object.entries(this.commandMap)) {
      const score = this.levenshteinSimilarity(spoken, keyword)
      if (score > bestScore) {
        bestScore = score
        bestMatch = cmd
      }
    }

    return { command: bestMatch, confidence: bestScore }
  }

  private levenshteinSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const costs = []
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) costs[j] = j
        else if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
      if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
  }

  private askForConfirmation(spoken: string, interpreted: string): void {
    TTSService.speak(`Did you say "${interpreted}"? Say Yes or No`, 'high')
    // User will respond with Yes/No, handled in next recognition cycle
  }

  private handleNoMatch(): void {
    this.failureCount++
    if (this.failureCount >= 3) {
      TTSService.speak('Having trouble understanding. Try using the tap gesture or say Help', 'medium')
      this.failureCount = 0
    } else {
      TTSService.speak('Sorry, I didn\'t understand. Please try again', 'medium')
    }
  }

  private executeCommand(command: string): void {
    const handler = this.commands.get(command)
    if (handler) {
      handler()
    }
  }

  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold))
  }

  registerCommand(command: string, handler: () => void): void {
    this.commands.set(command, handler)
  }
}
```

---

## 3. HapticService - Vibration Patterns

### File: `src/services/HapticService.ts`

**Purpose**: Manage distinct haptic patterns paired with audio feedback for non-visual confirmation.

**API**:
```typescript
class HapticService {
  // Named patterns
  connect(): Promise<void>        // Double pulse
  disconnect(): Promise<void>      // Long pulse
  error(): Promise<void>           // Triple short
  guidanceStep(): Promise<void>    // Light tick
  danger(): Promise<void>          // Triple strong (warning)
  arrival(): Promise<void>         // Celebratory
  understood(): Promise<void>      // Double tap
  
  // Custom pattern
  custom(pattern: number[]): Promise<void>  // [on, off, on, ...] in ms
}

export default new HapticService()
```

**Internal Structure**:
```typescript
class HapticService {
  private patterns = {
    connect: [100, 50, 100],           // Double pulse
    disconnect: [300],                  // Long pulse
    error: [100, 50, 100, 50, 100],     // Triple short
    guidanceStep: [50],                 // Light tick
    danger: [100, 50, 100, 50, 100, 50, 100], // Triple strong
    arrival: [100, 50, 100, 50, 300],   // Celebratory
    understood: [100, 50, 100],         // Double tap
  }

  async connect(): Promise<void> {
    await this.playPattern(this.patterns.connect)
  }

  async disconnect(): Promise<void> {
    await this.playPattern(this.patterns.disconnect)
  }

  async error(): Promise<void> {
    await this.playPattern(this.patterns.error)
  }

  async guidanceStep(): Promise<void> {
    await this.playPattern(this.patterns.guidanceStep)
  }

  async danger(): Promise<void> {
    await this.playPattern(this.patterns.danger)
  }

  async arrival(): Promise<void> {
    await this.playPattern(this.patterns.arrival)
  }

  async understood(): Promise<void> {
    await this.playPattern(this.patterns.understood)
  }

  async custom(pattern: number[]): Promise<void> {
    await this.playPattern(pattern)
  }

  private async playPattern(pattern: number[]): Promise<void> {
    for (let i = 0; i < pattern.length; i++) {
      if (i % 2 === 0) {
        // Even index = vibration on
        ReactNativeHapticFeedback.trigger('impactMedium', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        })
      }
      // Wait for the pattern duration
      await new Promise(resolve => setTimeout(resolve, pattern[i]))
    }
  }
}
```

---

## 4. AudioCueService - Earcons & Sound Effects

### File: `src/services/AudioCueService.ts`

**Purpose**: Manage audio files (earcons) with priority mixing to prevent overlaps.

**API**:
```typescript
class AudioCueService {
  // Earcons
  play(earcon: 'listening' | 'processing' | 'success' | 'error' | 'tick' | 'alert'): Promise<void>
  
  // Settings
  setVolume(volume: number): Promise<void>   // 0–100
  mute(mute: boolean): void
}

export default new AudioCueService()
```

**Internal Structure**:
```typescript
class AudioCueService {
  private soundMap: { [key: string]: Sound } = {}
  private isPlaying: boolean = false
  private volume: number = 100
  private isMuted: boolean = false
  private queue: string[] = []

  constructor() {
    // Load sound files
    this.soundMap = {
      listening: new Sound(require('../assets/sounds/listening.m4a')),
      processing: new Sound(require('../assets/sounds/processing.m4a')),
      success: new Sound(require('../assets/sounds/success.m4a')),
      error: new Sound(require('../assets/sounds/error.m4a')),
      tick: new Sound(require('../assets/sounds/tick.m4a')),
      alert: new Sound(require('../assets/sounds/alert.m4a')),
    }
  }

  async play(earcon: 'listening' | 'processing' | 'success' | 'error' | 'tick' | 'alert'): Promise<void> {
    if (this.isMuted) return

    this.queue.push(earcon)
    await this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.queue.length === 0) return

    const earcon = this.queue.shift()!
    this.isPlaying = true

    try {
      const sound = this.soundMap[earcon]
      sound.setVolume(this.volume / 100)
      await new Promise((resolve, reject) => {
        sound.play((success) => {
          if (success) resolve(undefined)
          else reject(new Error('Sound playback failed'))
        })
      })
    } catch (error) {
      console.warn(`Failed to play earcon: ${earcon}`, error)
    } finally {
      this.isPlaying = false
      if (this.queue.length > 0) {
        this.processQueue()
      }
    }
  }

  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(100, volume))
  }

  mute(mute: boolean): void {
    this.isMuted = mute
  }
}
```

**Sound Assets** (place in `src/assets/sounds/`):
```
listening.m4a    — Short "ding" tone (200ms)
processing.m4a   — "Processing" tone (150ms)
success.m4a      — Success chime (300ms)
error.m4a        — Error buzz (250ms)
tick.m4a         — Light tick (100ms)
alert.m4a        — Alert alarm (400ms)
```

---

## 5. Integration with React Hooks

### File: `src/hooks/useTTS.ts`

```typescript
import { useEffect, useCallback } from 'react'
import TTSService from '../services/TTSService'

export function useTTS() {
  const speak = useCallback(
    async (text: string, priority: 'critical' | 'high' | 'medium' | 'low' = 'medium') => {
      await TTSService.speak(text, priority)
    },
    []
  )

  const setRate = useCallback(async (rate: number) => {
    await TTSService.setRate(rate)
  }, [])

  const setVolume = useCallback(async (volume: number) => {
    await TTSService.setVolume(volume)
  }, [])

  const stop = useCallback(async () => {
    await TTSService.stop()
  }, [])

  return { speak, setRate, setVolume, stop }
}
```

### File: `src/hooks/useVoiceCommands.ts`

```typescript
import { useEffect } from 'react'
import Voice from '@react-native-voice/voice'
import SpeechRecognitionService from '../services/SpeechRecognitionService'

export function useVoiceCommands() {
  useEffect(() => {
    Voice.onSpeechResults = (results: any) => {
      SpeechRecognitionService.handleVoiceResults(results.value)
    }

    Voice.onSpeechError = (error: any) => {
      SpeechRecognitionService.onError?.(error)
    }

    return () => {
      Voice.destroy().then(Voice.removeAllListeners)
    }
  }, [])

  const startListening = async () => {
    await SpeechRecognitionService.startListening()
  }

  const stopListening = async () => {
    await SpeechRecognitionService.stopListening()
  }

  return { startListening, stopListening }
}
```

### File: `src/hooks/useHaptics.ts`

```typescript
import { useCallback } from 'react'
import HapticService from '../services/HapticService'

export function useHaptics() {
  const triggerConnect = useCallback(async () => {
    await HapticService.connect()
  }, [])

  const triggerDisconnect = useCallback(async () => {
    await HapticService.disconnect()
  }, [])

  const triggerError = useCallback(async () => {
    await HapticService.error()
  }, [])

  const triggerGuidanceStep = useCallback(async () => {
    await HapticService.guidanceStep()
  }, [])

  const triggerDanger = useCallback(async () => {
    await HapticService.danger()
  }, [])

  return {
    triggerConnect,
    triggerDisconnect,
    triggerError,
    triggerGuidanceStep,
    triggerDanger,
  }
}
```

---

## 6. Component Example: AccessibleButton

### File: `src/components/AccessibleButton.tsx`

```typescript
import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useTTS } from '../hooks/useTTS'
import { useHaptics } from '../hooks/useHaptics'

interface AccessibleButtonProps {
  title: string
  onPress: () => void
  accessibilityLabel?: string
  accessibilityHint?: string
  variant?: 'primary' | 'danger' | 'secondary'
  disabled?: boolean
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = 'primary',
  disabled = false,
}) => {
  const { speak } = useTTS()
  const { triggerConnect } = useHaptics()

  const handlePress = async () => {
    if (disabled) return

    // Haptic feedback
    await triggerConnect()

    // Audio feedback
    await speak(title, 'high')

    // Execute action
    onPress()
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'danger' && styles.dangerButton,
        variant === 'secondary' && styles.secondaryButton,
        disabled && styles.disabledButton,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 88,
    minWidth: 88,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  dangerButton: {
    backgroundColor: '#FF0000',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#333333',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})
```

---

## 7. Installation & Setup

### Step 1: Install Dependencies
```bash
npm install react-native-tts
npm install @react-native-voice/voice
npm install react-native-haptic-feedback
npm install react-native-sound
```

### Step 2: Create Service Files
Create the four service files in `src/services/`:
- `TTSService.ts`
- `SpeechRecognitionService.ts`
- `HapticService.ts`
- `AudioCueService.ts`

### Step 3: Create Hook Files
Create the three hook files in `src/hooks/`:
- `useTTS.ts`
- `useVoiceCommands.ts`
- `useHaptics.ts`

### Step 4: Create Component Files
Create component files in `src/components/`:
- `AccessibleButton.tsx`

### Step 5: Add Sound Assets
Create `src/assets/sounds/` directory with:
- `listening.m4a` (ding tone)
- `processing.m4a` (processing tone)
- `success.m4a` (success chime)
- `error.m4a` (error buzz)
- `tick.m4a` (light tick)
- `alert.m4a` (alert alarm)

---

## 8. Testing Services Independently

### Test TTS Priority Queue
```typescript
import TTSService from '../services/TTSService'

// Test queue order
await TTSService.speak('This is low priority', 'low')
await TTSService.speak('This is high priority', 'high')
await TTSService.speak('This is critical!', 'critical')
// Should play: critical, high, low
```

### Test Voice Commands
```typescript
import SpeechRecognitionService from '../services/SpeechRecognitionService'

SpeechRecognitionService.onCommandRecognized = (result) => {
  console.log(`Command: ${result.command}, Confidence: ${result.confidence}`)
}

await SpeechRecognitionService.startListening()
// Speak "start navigation" into the microphone
// Should log command with confidence score
```

### Test Haptics
```typescript
import HapticService from '../services/HapticService'

await HapticService.connect()     // Double pulse
await HapticService.danger()      // Triple strong
await HapticService.arrival()     // Celebratory
```

---

## Next Steps

1. ✅ Create the four services (TTS, SpeechRecognition, Haptic, AudioCue)
2. ✅ Create the three hooks (useTTS, useVoiceCommands, useHaptics)
3. ✅ Create AccessibleButton component
4. ✅ Test each service independently
5. Build Home Screen using AccessibleButton + useTTS + useHaptics
6. Build Navigation Screen with TTS priority + haptics
7. Build Emergency, Settings, Onboarding screens
8. Full integration test with ESP32 WebSocket + cloud ML API

---

**Ready to code?** Start with `TTSService.ts` — it's the foundation for everything else.
