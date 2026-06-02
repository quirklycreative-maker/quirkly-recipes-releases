# Swasth Rasoi

Android-first Expo app for low-GI Indian meal planning, Hindi/Nepali fridge voice input, recipe suggestions, simple exercise support, and grocery requests between an owner and house-help login.

## Prototype Logins

- Owner: PIN `1234`
- Helper: PIN `1111`

The PINs are local demo gates, not production authentication.

## What Works

- Owner dashboard for HbA1c/weight context, dietary preference, grocery requests, and simple movement plan.
- Helper dashboard with Hindi/Nepali/English speech recognition, fridge item capture, Hindi recipe suggestions, YouTube search links, and grocery requests.
- Persistent local storage with `AsyncStorage`.
- Local notification when a helper sends a grocery request on the same device.
- APK build profile in `eas.json`.

## Run Locally

```bash
npm install
npm run start
```

Speech recognition uses native Android APIs, so use a development build or APK rather than plain Expo Go:

```bash
npx expo run:android
```

## Build APK

```bash
npx eas-cli build -p android --profile preview
```

For true two-phone notifications, connect the grocery request flow to Firebase, Supabase, or another backend and send Expo push notifications to the owner device.
