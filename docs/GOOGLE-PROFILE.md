# Google profile linking

The optional **Link Google nanomachines** control fills the user's Codec portrait with a Google first name and profile picture. It currently supports the web app. Text chat remains available without linking.

## Configure local testing

1. Create a Google OAuth client of type **Web application** using [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
2. Add `http://localhost:14085` as an authorized JavaScript origin. Add `http://127.0.0.1:14085` separately if using that address. For a later hosted release, add `https://johndtwaldron.github.io` (origins do not include the repository path).
3. Set `GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com` in `apps/edge/.dev.vars`.
4. Run `npm run sync-env`, then restart Expo from `apps/mobile` with `npx expo start --web --port 14085`.

The client ID is public configuration. No client secret is needed. Production builds will also need `EXPO_PUBLIC_GOOGLE_CLIENT_ID` provided at build time; the Pages workflow reads the public `GOOGLE_CLIENT_ID` repository variable.

## Behaviour and boundaries

Google's official sign-in button appears in a Codec-themed dialog. On success, the first name replaces the mode label and the Google photo replaces the silhouette. If the photo fails to load, the silhouette remains. Disconnect clears the linked profile and restores the mode label.

Only the first name and photo URL are held in memory for the current page instance. Refreshing or closing the page clears them. Previously saved local profile data is removed. ID tokens, email addresses, and account identifiers are not retained or sent to the chat backend. Photos load from Google-hosted image URLs. The stored profile is cosmetic, editable browser data: it must never authorize accounts, payments, quotas, or other backend access. Any future account system needs server-side ID token verification.

The Pages content security policy permits the Google sign-in frame at `https://accounts.google.com`. Other frame sources remain blocked.

Missing configuration and script-loading failures leave chat usable. OAuth popup errors and account selection are handled by Google's button; the user can close or retry the dialog.

## Validation

Unit tests cover UTF-8 names, unexpected credential claims, unsafe photo URLs, session-only display data, and disconnect. Real Google sign-in must be manually verified with a registered client ID; mocked tests do not establish OAuth configuration validity.
