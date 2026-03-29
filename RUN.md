# CogniZen Run Guide

## Fastest option for judges

Use the installable Android build:

Open this link on an Android phone, or scan the QR code from the build page:

https://expo.dev/accounts/tokito99/projects/cognizen/builds/5ec36d7e-52ee-4f7d-a5a5-515d81b49e1a

If Android asks for permission:
- Allow installs from unknown sources or "Install unknown apps"
- Download the APK
- Install and open `CogniZen`

## Local run in VS Code with Expo Go

Recommended environment:
- Node 20 LTS
- npm
- Expo Go installed on the Android phone
- Phone and laptop on the same Wi-Fi for LAN mode

### 1. Install dependencies

```bash
npm install
```

### 2. Start the Expo server

If the phone and laptop are on the same network:

```bash
npx expo start --lan -c
```

If LAN does not work:

```bash
npx expo start --tunnel -c
```

### 3. Open the app on Android

- Open Expo Go on the phone
- Scan the QR code shown in the terminal or browser
- Wait for Metro to finish bundling

## Notes

- `--lan` is the preferred mode because it is faster and more stable
- `--tunnel` is a fallback if the network blocks LAN discovery
- If tunnel mode fails on Node 24, switch to Node 20 LTS first
- Expo Go is fine for development and demos, but the APK link above is smoother for judges

## Optional EAS build commands

If you need to create another Android APK:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

That uses the `preview` profile in `eas.json`, which is already configured to output an Android APK for internal distribution.
