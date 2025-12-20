This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Development Environment Configuration

## Requirements & Installation

| Component | Version | Status | Command to Verify |
|-----------|---------|--------|-------------------|
| **Node.js** | v20+ | ✅ Verified | `node --version` |
| **npm** | 10+ | ✅ Verified | `npm --version` |
| **Xcode** (iOS) | 15.0+ | ✅ Verified | `xcode-select -p` |
| **CocoaPods** | 1.14+ | ✅ Verified | `pod --version` |
| **Android SDK** | API 33+ | ✅ Verified | `adb version` |
| **Gradle** | 8.0+ | ✅ Verified | `cd android && ./gradlew -v` |
| **Watchman** | 2024+ | ✅ Verified | `watchman -v` |
| **React Native** | 0.73.2 | ✅ Verified | `npx react-native --version` |
| **React** | 18.2.0 | ✅ Verified | `npm list react` |

### One-time Setup

```sh
# macOS command line tools
xcode-select --install

# Install via Homebrew
brew install node@20 watchman

# Install CocoaPods for iOS native deps
sudo gem install cocoapods

# Android environment variables (add to ~/.zshrc, then source ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH

# Verify Android tools
which adb && adb version
```

### Project-specific Setup

```sh
cd /Users/wuyanlin/Documents/SIGHTA-AI
npm install
cd ios && pod install && cd ..
```

**Dependencies include:**
- `react-native-async-storage` - Persist app state
- `ws` - Raw WebSocket server for testing (optional, only for local testing)

# Android/iOS Quick Start

## Prerequisites (one-time)
- macOS tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`
- Node/Watchman: `brew install node@20 watchman`
- Android env (add to `~/.zshrc`, then `source ~/.zshrc`):
	```sh
	export ANDROID_HOME=$HOME/Library/Android/sdk
	export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH
	```
- Verify Android tools: `which adb && adb version`

## Clone and install
```sh
cd /Users/wuyanlin/Documents/SIGHTA-AI
npm install
cd ios && pod install && cd ..   # iOS native deps
```

## Start Metro (required before running iOS/Android)
```sh
# optional: free the port
lsof -nP -iTCP:8081 | awk 'NR>1{print $2}' | xargs -r kill -9

npx react-native start --reset-cache
```

## Run iOS
```sh
cd /Users/wuyanlin/Documents/SIGHTA-AI
npx react-native run-ios
```

## Run Android
```sh
emulator -list-avds             # see available AVDs
emulator -avd Pixel_9_Pro &     # start an AVD (replace name if different)
adb devices                     # confirm device listed
npx react-native run-android
```

## Clean/rebuild (when native deps change)
- iOS: `cd ios && pod install && cd .. && npx react-native run-ios`
- Android: `cd android && ./gradlew clean && cd .. && npx react-native run-android`

## Stop/exit
- Stop app: `adb shell am force-stop com.sightaai`
- Uninstall app: `adb uninstall com.sightaai`
- Stop emulator: `adb emu kill` (or close UI)
- Stop Metro: `Ctrl+C`

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

From the project root `/Users/wuyanlin/Documents/SIGHTA-AI`, start Metro (do this before running iOS/Android):

```sh
# optional: free port 8081
lsof -nP -iTCP:8081 | awk 'NR>1{print $2}' | xargs -r kill -9

npx react-native start --reset-cache
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
cd /Users/wuyanlin/Documents/SIGHTA-AI
npx react-native run-android
```

### iOS

If native deps change, run once: `cd ios && pod install && cd ..`

```sh
cd /Users/wuyanlin/Documents/SIGHTA-AI
npx react-native run-ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Test WebSocket Connectivity

The app includes a WebSocket demo that connects to a local or remote server.

### Option A: Test with Local Mock Server

```sh
# In a new terminal, start the local WebSocket test server
cd /Users/wuyanlin/Documents/SIGHTA-AI
node server-ws-example.js
```

Then in the app's WebSocket demo screen:
- Tap **Connect** → status shows Connected
- Tap **Authenticate** → app shows ✓ Authenticated
- Tap **Request Guidance** → receives guidance response
- Send a custom message → server echoes back

### Option B: Connect to ESP32-S3 Hardware

Update the server URL in `src/config/websocket.config.ts`:

```typescript
export const WebSocketConfig = {
  serverUrl: 'ws://192.168.4.1:3000',  // Replace with your device IP/hostname
  // ... other settings
};
```

Then reload the app and use the same connect/auth/guidance flow.

For details, see [WEBSOCKET_SETUP.md](docs/WEBSOCKET_SETUP.md) and [WEBSOCKET_IMPLEMENTATION_SUMMARY.md](WEBSOCKET_IMPLEMENTATION_SUMMARY.md).

## Step 4: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations!

You've successfully run and modified your React Native App. 🎉

### Now what?

- Check out [WebSocket Networking Setup](WEBSOCKET_IMPLEMENTATION_SUMMARY.md) for cloud/hardware connectivity
- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps)
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started)

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
