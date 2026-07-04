# Sunbusters

Find sunny and partly cloudy cities near your location.

Built with **Expo (React Native)**. Works on iOS and Android.

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for iOS simulator / `a` for Android emulator.

## Building for iOS (App Store)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Build for production:
   ```bash
   eas build --platform ios --profile production
   ```

4. Submit to App Store:
   ```bash
   eas submit --platform ios --profile production
   ```

> Note: You need an **Apple Developer Account** ($99/year) and an App Store Connect record.

## Building for Android (Play Store)

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

## Configuration

- **OpenWeatherMap API Key**: Set via `EXPO_PUBLIC_WEATHER_API_KEY` in `.env` or in `app.json` under `extra.weatherApiKey`
- **iOS Bundle ID**: `com.aatech.sunbusters`
- **Android Package**: `com.aatech.sunbusters`

## License

MIT
