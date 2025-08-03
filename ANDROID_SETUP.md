# Android Development Setup for MetroBus Tracker

## Overview
Since this project uses Mapbox with Expo bare workflow, you need to set up the Android development environment to build and run the app.

## Prerequisites

### 1. Install Java Development Kit (JDK)
- Download and install JDK 17 or later from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://adoptium.net/)
- Set JAVA_HOME environment variable to point to your JDK installation

### 2. Install Android Studio
- Download and install [Android Studio](https://developer.android.com/studio)
- During installation, make sure to install:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device (AVD)

### 3. Configure Android SDK
1. Open Android Studio
2. Go to Tools → SDK Manager
3. Install the following:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools

### 4. Set Environment Variables
Add these to your system environment variables:

```
ANDROID_HOME=C:\Users\[YourUsername]\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Java\jdk-17
```

Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

### 5. Create Android Virtual Device (AVD)
1. Open Android Studio
2. Go to Tools → AVD Manager
3. Click "Create Virtual Device"
4. Select a device (e.g., Pixel 5)
5. Select a system image (e.g., API 34)
6. Complete the setup

## Alternative: Use Expo Development Build

If you prefer not to set up the full Android development environment, you can use Expo's development build:

### Option 1: Use Expo Development Build (Recommended)
```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Create a development build
npx expo build:android

# Or use EAS Build (requires Expo account)
npx eas build --platform android --profile development
```

### Option 2: Use Expo Go (Limited)
Note: Mapbox may not work properly in Expo Go due to native module requirements.

## Testing the Setup

### Check Java Installation
```bash
java -version
```

### Check Android SDK
```bash
adb --version
```

### Check Environment Variables
```bash
echo $ANDROID_HOME
echo $JAVA_HOME
```

## Running the App

Once the environment is set up:

```bash
# Start an Android emulator or connect a device
npx expo run:android
```

## Troubleshooting

### Common Issues:

1. **"JAVA_HOME is not set"**
   - Install JDK and set JAVA_HOME environment variable

2. **"Android SDK not found"**
   - Install Android Studio and configure ANDROID_HOME

3. **"No devices found"**
   - Start an Android emulator or connect a physical device

4. **"Build failed"**
   - Clean the project: `cd android && ./gradlew clean`
   - Rebuild: `npx expo run:android`

## Next Steps

After setting up the Android environment:
1. Run `npx expo run:android` to build and install the app
2. Test the Mapbox integration
3. Verify all map features work correctly

## Resources

- [Expo Android Setup](https://docs.expo.dev/workflow/android-studio-emulator/)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [Android Studio Download](https://developer.android.com/studio) 