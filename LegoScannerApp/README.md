# BuildaVault — Mobile App

BuildaVault is a mobile app for tracking your LEGO set collection. Scan barcodes to instantly look up sets, view estimated resale prices, and manage your vault on the go.

## Features

- **Barcode Scanner** — point your camera at a LEGO set box to look it up instantly
- **Set Search** — search by set number or name and add sets to your collection
- **Vault View** — browse all your sets with images, years, and eBay price estimates
- **Profile** — manage your account, delete sets, or remove your account entirely
- **Authentication** — secure login and signup powered by Supabase

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your iOS or Android device (for development)

## Installation

```bash
# Clone the repo
git clone https://github.com/mfitrz/brick_inventory.git
cd brick_inventory/LegoScannerApp

# Install dependencies
npm install
```

## Running the App

```bash
# Start the Expo development server
npm start
```

This opens the Expo dev tools in your browser and displays a QR code. Scan it with:
- **iOS** — the Camera app
- **Android** — the Expo Go app

### Platform-specific

```bash
npm run android   # Launch on Android emulator
npm run ios       # Launch on iOS simulator (Mac only)
npm run web       # Launch in browser
```

## Project Structure

```
LegoScannerApp/
├── app/
│   ├── _layout.tsx     # Root layout and navigation
│   ├── index.tsx       # Home screen (vault / set list)
│   ├── scanner.tsx     # Barcode scanner screen
│   ├── profile.tsx     # Profile and account management
│   ├── login.tsx       # Login screen
│   └── signup.tsx      # Signup screen
├── lib/
│   └── supabase.ts     # Supabase client and API config
├── components/         # Shared UI components
├── assets/             # Images, icons, fonts
└── app.json            # Expo configuration
```

## Backend

The mobile app connects to the BuildaVault .NET backend hosted on Railway:
`https://brickinventory-production.up.railway.app`

The backend handles authentication (via Supabase), set lookups (via Rebrickable), and eBay price estimates.

The web version of BuildaVault is available at [buildavault.vercel.app](https://buildavault.vercel.app).
