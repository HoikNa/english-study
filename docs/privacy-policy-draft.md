# Privacy Policy Draft

Date: 2026-05-26

This draft is for store-review preparation and should be reviewed before public release.

## Service

SpeakReadyMY helps users practice English expressions through listening, recording, pronunciation assessment, AI feedback, review scheduling, and progress tracking.

## Data We Collect

| Data | Purpose |
| --- | --- |
| Email address | Account creation, sign-in, and account recovery support. |
| Nickname/name | Personalizing the learning interface. |
| Learning history | Showing progress, review queue, weekly reports, and recent practice. |
| Pronunciation scores and recognized text | Providing feedback and review scheduling. |
| Microphone recording | Sending a short practice recording to the backend for pronunciation assessment. |
| Device/network metadata | Basic API security, rate limiting, and service reliability. |

## Audio Processing

Microphone recordings are used to generate pronunciation assessment results. The app sends the recording to the backend, where it is converted for Azure Speech pronunciation assessment. The current design does not store raw user recordings permanently in application storage.

## AI Processing

SpeakReadyMY uses AI services to:

- assess pronunciation,
- generate coaching feedback,
- generate text-to-speech listening audio,
- support conversation simulation.

Target sentences, recognized text, scores, and user-entered practice text may be processed by AI providers to provide these features.

## Data Storage

The service stores user account data, learning sessions, review queue data, custom expressions, and report data in the backend database. Generated TTS audio may be cached to reduce repeated generation cost.

## Data Sharing

Data may be processed by the following infrastructure/providers only for operating the app:

- AWS Lambda and API Gateway for backend hosting,
- Supabase PostgreSQL and Storage for app data/cache,
- Azure Speech for pronunciation assessment,
- OpenAI for AI feedback, simulation, and TTS.

## User Controls

The backend supports authenticated data export through `GET /api/v1/auth/me/export`
and account deletion through `DELETE /api/v1/auth/me`.
This removes the user's account, learning sessions, review queue, and refresh tokens.
The mobile app settings screen includes visible data export and account deletion entries.

## Contact

Support contact: `bizhoik@gmail.com`

## Release Checklist

| Status | Item |
| --- | --- |
| ☐ | Review wording with the final data flow. |
| ☐ | Add hosted public privacy-policy URL. |
| ✅ | Confirm account export/deletion process. Backend endpoints and in-app settings entries exist. |
| ☐ | Match Google Play Data Safety answers to this document. |
