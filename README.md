# Sunbusters

# Privacy Policy

**Last updated:** July 2026

## Location Data
Sunbusters uses your device's location to find nearby cities with sunny or partly cloudy weather. Your location is sent to OpenWeatherMap to retrieve weather data. Location data is only used while the app is active and is not stored, shared, or transmitted to any other third party.

## Weather Data
Weather information is retrieved from the OpenWeatherMap API. No personal data is sent as part of these requests beyond the city coordinates needed to find weather data.

## Third-Party Services
The app uses Google Maps to open city locations when you tap on a city. Google's privacy policy applies to that interaction.

## Data Storage
Sunbusters does not collect, store, or share any personal information. No account is required to use the app.

## Changes
This policy may be updated occasionally. Continued use of the app constitutes acceptance of the current policy.

## Contact
For questions: alpervanlimburg@icloud.com

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
