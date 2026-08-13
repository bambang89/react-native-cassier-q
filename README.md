# cassier-Q (React Native / Expo)

POS mobile app for small "toko kelontong" (grocery store) owners and cashiers.
Companion React Native rewrite of the Flutter `cassier_q` app in this repo's
parent folder — same product, different stack.

## Tech stack

| Concern       | Choice                                                         |
|---------------|------------------------------------------------------------------|
| Framework     | Expo SDK 57 (React Native 0.86, New Architecture, TypeScript)   |
| State         | Redux Toolkit + react-redux                                     |
| Navigation    | React Navigation (native-stack + bottom-tabs)                   |
| Networking    | axios, OAuth2 password + refresh_token grant, auto token refresh |
| Token storage | expo-secure-store (Keychain / Keystore)                         |
| SSL pinning   | react-native-ssl-public-key-pinning (pins fetch/XHR/axios automatically) |
| Barcode scan  | react-native-vision-camera + react-native-vision-camera-barcode-scanner |

**This app cannot run in Expo Go** — SSL pinning and the camera/barcode
module are native code, so it always needs a custom dev client or a real
build (`expo prebuild` / `expo run:*` / EAS Build).

## Getting started

```bash
npm install
cp .env.example .env   # adjust EXPO_PUBLIC_API_BASE_URL if needed

# first time only, generates ./ios and ./android (gitignored, regenerated on demand)
npm run prebuild

npm run android   # expo run:android — builds & installs the dev client
npm run ios       # expo run:ios
npm run web       # web is not officially supported (camera/pinning are native-only)
```

After the dev client is installed once, day-to-day iteration is:

```bash
npm start   # expo start --dev-client
```

## Before you ship: SSL pinning

`src/api/sslPinning.ts` ships with **placeholder public-key hashes** — the
app will refuse to talk to the API until you replace them:

```bash
openssl s_client -connect api.caissier.app:443 -servername api.caissier.app </dev/null 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | openssl enc -base64
```

Pin both the leaf certificate and a backup (issuing intermediate or a
pre-provisioned spare key) so a routine cert rotation doesn't lock the app
out of its own API. Update `expirationDate` whenever you rotate pins.

## OAuth2

`src/api/client.ts` implements an OAuth2 **Resource Owner Password
Credentials** grant against the store's own backend (`/oauth/token`), with
automatic `refresh_token` renewal on 401 and a queue so concurrent requests
don't trigger duplicate refreshes. If the backend later moves to a
third-party identity provider, swap `src/api/authApi.ts` for an
Authorization Code + PKCE flow via `expo-auth-session` — the token
storage/refresh plumbing in `client.ts` stays the same.

## Building with EAS

```bash
npm install -g eas-cli
eas login
eas build:configure   # links the project, fills extra.eas.projectId in app.config.ts

npm run build:dev:android      # internal dev-client build
npm run build:dev:ios
npm run build:preview:android  # internal QA build (.apk / ad-hoc)
npm run build:preview:ios
npm run build:prod:android     # store build (.aab)
npm run build:prod:ios         # store build
```

`eas.json` defines `development` / `preview` / `production` profiles, each
setting `APP_VARIANT` so the three builds get distinct bundle IDs/app names
(`com.cassierq.pos.dev`, `.preview`, and `com.cassierq.pos`) and can be
installed side by side on one device — see `app.config.ts`.

## Project structure

```
src/
  api/         axios client, OAuth token storage/refresh, SSL pinning, endpoint calls
  config/      env.ts (reads app.config.ts `extra` via expo-constants)
  navigation/  RootNavigator (auth-gated), AuthNavigator, MainTabNavigator
  screens/     auth/, pos/ (incl. barcode ScannerScreen), products/, orders/, reports/, profile/
  store/       Redux Toolkit store + slices (auth, cart, products)
  types/       shared domain models
```
