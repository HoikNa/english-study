# App Store Metadata

Date: 2026-05-26

## App Identity

| Field | Draft |
| --- | --- |
| App name | SpeakReadyMY |
| Subtitle | English shadowing for real situations |
| Category | Education |
| Primary audience | Korean learners practicing spoken English for daily life and business situations |
| Android package | `com.hoik.speakreadymy` |
| iOS bundle identifier | `com.hoik.speakreadymy` |
| URL scheme | `speakready` |
| Latest Android production build | EAS build `267f9b38-fb05-4c6b-8a29-8ebf5e7975b2`, version `1.0.0`, build `4`, AAB `https://expo.dev/artifacts/eas/5KJiwe5kxRDva79WykCfbE.aab` |

## Short Description

Practice real English expressions with listening, recording, AI pronunciation scoring, and review.

## Long Description Draft

SpeakReadyMY helps Korean English learners practice short, useful expressions through a focused daily routine. Listen to a native-style model sentence, record your own voice, and get AI-assisted pronunciation and coaching feedback. The app tracks recent learning and helps you revisit expressions that need more practice.

Core features:

- Daily expression practice
- Listening playback
- Shadowing and microphone recording
- AI pronunciation scoring
- Coach feedback for natural phrasing
- Review queue and recent learning history
- Weekly learning progress

## Privacy Disclosures

| Data | Purpose | Notes |
| --- | --- | --- |
| Email/account | Sign in and sync learning progress | Required for user account. |
| Microphone audio | Pronunciation assessment | Audio is sent to the backend for analysis and should not be stored permanently. |
| Learning scores/history | Progress tracking and review scheduling | Stored per user. |
| AI-generated feedback | Learning guidance | Generated from pronunciation result and target sentence. |

## Permissions Copy

| Permission | User-facing reason |
| --- | --- |
| Microphone | SpeakReadyMY needs microphone access so you can record shadowing practice and receive pronunciation feedback. |

## Screenshot Checklist

| Status | Screen |
| --- | --- |
| ☐ | Onboarding/sign-in |
| ☐ | Today/home |
| ☐ | Shadowing with listening and recording button |
| ☐ | Feedback result with next-expression button |
| ☐ | Review/recent learning |
| ☐ | Weekly progress |

## Store Readiness Notes

- Final screenshots should be captured from the production build, not the development client.
- Privacy policy URL is required before store submission.
- App review notes should explain that microphone input is required for pronunciation feedback.
- Privacy policy draft lives in `docs/privacy-policy-draft.md` and still needs a hosted public URL before submission.
