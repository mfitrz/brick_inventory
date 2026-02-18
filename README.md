# Barcode Scanner App (Phone Setup)

This project uses an Expo React Native app in `BarcodeScannerApp`.  
The API is already hosted on Azure, so you only need to run the mobile app locally.

## Prerequisites

- Node.js 18+
- npm
- Expo Go app on your phone (iOS/Android)
- Phone and computer on the same Wi-Fi network

## 2. Start the App

```powershell
cd BarcodeScannerApp
npm install
npx expo start
```

## 3. Open on Your Phone

1. Open Expo Go on your phone.
2. Scan the QR code shown by Expo in the terminal/browser.
3. Sign in or sign up in the app.
4. Allow camera access when prompted.
5. Tap `+ Add Set` and scan a barcode.

## Troubleshooting

- If your phone cannot connect, run:
  - `npx expo start --tunnel`
- If bundling is stale, clear cache:
  - `npx expo start -c`
