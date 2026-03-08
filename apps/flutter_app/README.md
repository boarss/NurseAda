# NurseAda (Flutter)

Same gateway as web and React Native. Set base URL for release/emulator:

- **Debug**: Edit `lib/screens/chat_screen.dart` `_gatewayUrl` or use `--dart-define=GATEWAY_URL=http://10.0.2.2:8000` for Android emulator.
- **Release**: Use `--dart-define=GATEWAY_URL=https://api.nurseada.example` when building.

## Run

```bash
flutter pub get
flutter run
```

## Build

```bash
flutter build apk
flutter build ios
```
