# Device E2E Checklist

Date: 2026-05-26

## Target

Verify the deployed API with a real microphone instead of the browser fake mic.

| Item | Value |
| --- | --- |
| API mode | `EXPO_PUBLIC_USE_MOCK=false` |
| API URL | `https://d6f9adjh85.execute-api.ap-northeast-2.amazonaws.com` |
| Backend | AWS Lambda + API Gateway |
| Database | Supabase PostgreSQL pooler |
| Audio path | Real device microphone -> app recording -> Lambda ffmpeg -> Azure Speech |

## If Expo Go Shows Incompatible SDK

Expo Go must support the same SDK as the project. This app uses Expo SDK 56.
If Expo Go shows `incompatible SDK version`, use a development build instead.

The project is configured with `expo-dev-client` and `eas.json`.

Build an Android development APK:

```bash
npx eas-cli login
npm run build:android:dev
```

Install the APK from the EAS build link on the phone. Then start the dev server:

```bash
npm run dev-client -- --host lan --port 8085
```

Open the installed `SpeakReadyMY` development app and connect to the dev server.

Latest Android development build:

```text
Build page: https://expo.dev/accounts/hoik/projects/speakready-my/builds/0d84afa2-5b3c-4ad9-b577-5fb74f231378
APK: https://expo.dev/artifacts/eas/2EPw4kkypA1WhgwBuXtWe7.apk
Build version: 3
```

If EAS prints `spawn adb ENOENT`, the build still succeeded but automatic
emulator/device install failed because Android platform-tools are not available
in the shell. Download the APK link on the phone and install it manually, or
install Android Studio/platform-tools and set `ANDROID_HOME` / `ANDROID_SDK_ROOT`
before retrying emulator install.

If Android shows `java.lang.NoClassDefFoundError` for
`expo.modules.kotlin.types.LazyKType` from `expo.modules.av.video.VideoViewModule`,
remove `expo-av`, use `expo-audio` for playback/recording, then rebuild and
reinstall the development APK. This crash means the installed native binary
contains an Expo AV module that is incompatible with the SDK 56 runtime.

## Start App

Use LAN when the phone and development machine are on the same network:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<WINDOWS_WIFI_IP> npm run device -- --port 8085
```

In the current WSL setup, Windows Wi-Fi IP was detected as:

```text
172.30.1.68
```

If the app is served from WSL, Windows must forward the phone's request to the
WSL Expo server. Run this in **Windows PowerShell as Administrator**:

```powershell
netsh interface portproxy delete v4tov4 listenport=8085 listenaddress=0.0.0.0
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8085 connectaddress=<WSL_IP> connectport=8085
netsh interface portproxy show v4tov4
```

In the current WSL setup, WSL IP was detected as:

```text
172.25.155.17
```

So the exact command is:

```powershell
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=8085 connectaddress=172.25.155.17 connectport=8085
```

Use tunnel if LAN discovery does not work or the phone and PC are on different networks:

```bash
npm run dev-client -- --host tunnel --port 8085
```

Tunnel mode requires `@expo/ngrok`. If Expo reports `remote gone away`, use the
LAN + portproxy path above and retry tunnel later.

## Test Steps

1. Open the Expo QR in Expo Go or the development build.
2. Register a new test user.
3. Confirm the home screen loads today's expression.
4. Tap anywhere on the `오늘의 학습` card and confirm it opens the shadowing screen.
5. Allow microphone permission when prompted.
6. Confirm the `녹음 시작` button is a dark blue full-width CTA and is not clipped by Android navigation controls.
7. Record the target sentence with real speech:

```text
I'd like to walk you through our IoT platform briefly.
```

8. Wait for the feedback screen.
9. Confirm the screen shows `저장됨`.
10. Confirm Azure scores are non-zero for clear speech, including `억양`.
11. Tap `듣기` in the shadowing screen and confirm TTS audio plays.
12. Confirm review queue/progress refresh after saving.
13. Open the review tab when an item is due and confirm the card uses real score/date/focus data.
14. Tap `다음 표현` on feedback, or the top-right `다음` fallback button, and confirm it opens the next expression instead of returning to the previous screen.
15. Scroll the `오늘`, `카테고리`, `복습`, and `진도` tabs to the bottom and confirm no content overlaps with Android navigation controls.

## Expected API Calls

| Endpoint | Expected |
| --- | --- |
| `POST /api/v1/auth/register` | `201` |
| `GET /api/v1/auth/me` | `200` |
| `GET /api/v1/expressions/exp-011` | `200` |
| `POST /api/v1/ai/pronunciation` | `200` |
| `POST /api/v1/ai/feedback` | `200` |
| `POST /api/v1/sessions` | `201` |
| `POST /api/v1/review/exp-011/enqueue` | `201` |
| `GET /api/v1/expressions/today` | `200` |

## Record Result

After the run, append the result to `docs/integration-test-log.md`.

```text
Device:
Network:
Recording format:
Pronunciation score:
Feedback status:
Session save status:
Review enqueue status:
Notes:
```

## Latest Device Pass Notes

| Item | Result |
| --- | --- |
| Device pass date | 2026-05-26 |
| Runtime | Android development build v3 with latest JS bundle reload |
| Real Android mic -> feedback | Pass |
| Azure prosody score | Pass, non-zero after prosody enablement |
| TTS listen button | Pass |
| Session save | Pass, UI shows `저장됨` |
| Home/progress reflection | Pass |
| Today's learning card | Pass, card opens the shadowing flow |
| Recording CTA visibility | Pass, dark blue idle state and dark red recording state visible on device |
| Result next-expression action | Pass, dark result dock and blue next button visible; tap routes to the next expression |
| Review tab | Pass, empty queue exposes recent learning data/re-record path |
| Bottom safe-area spacing | Pass after increasing tab/content padding and dark result dock spacing |
| Latest dev build | Build version 3 finished on EAS, APK `2EPw4kkypA1WhgwBuXtWe7.apk` |

## Troubleshooting

- If the app cannot load in Expo Go, try `npm run device:tunnel`.
- If microphone permission is denied, reset app permissions and retry.
- If Android crashes on `LazyKType` / `VideoViewModule`, install the latest APK
  rebuilt after removing `expo-av`; a Metro reload alone cannot fix native
  module changes.
- If `/ai/pronunciation` returns `415`, confirm the Lambda ffmpeg layer is attached and `FFMPEG_BINARY=/opt/bin/ffmpeg`.
- If pronunciation times out, check CloudWatch logs for the Lambda request and Azure SDK error.
