# Google profile linking

The optional **Nanomachine sync** control fills the user's Codec portrait with a Google first name and profile picture. It currently supports the web app. Text chat remains available without linking.

## Configure local testing

1. Create a Google OAuth client of type **Web application** using [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
2. Add `http://localhost:14085` as an authorized JavaScript origin. Add `http://127.0.0.1:14085` separately if using that address. For a later hosted release, add `https://johndtwaldron.github.io` (origins do not include the repository path).
3. Set `GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com` in `apps/edge/.dev.vars`.
4. Run `npm run sync-env`, then restart Expo from `apps/mobile` with `npx expo start --web --port 14085`.

The client ID is public configuration. No client secret is needed. Production builds will also need `EXPO_PUBLIC_GOOGLE_CLIENT_ID` provided at build time; the Pages workflow reads the public `GOOGLE_CLIENT_ID` repository variable.

## Behaviour and boundaries

The first activation opens a Codec-themed sync decision before startup and before mounting chat. **Sync with Google** requests `openid profile` and fetches both the first name and photo in one flow; **Activate Codec Without Sync** continues anonymously. Returning from standby does not repeat the decision in the same page instance. The running Codec has one **Nanomachine sync** button for disconnecting or connecting. On success, the first name replaces the mode label and the Google photo replaces the silhouette. If the photo fails to load, the silhouette remains. Disconnect clears the linked profile and restores the mode label.

Only the first name and photo URL are held in memory for the current page instance. Refreshing or closing the page clears them. Previously saved local profile data is removed. ID tokens, email addresses, and account identifiers are not retained or sent to the chat backend. Photos load from Google-hosted image URLs. The stored profile is cosmetic, editable browser data: it must never authorize accounts, payments, quotas, or other backend access. Any future account system needs server-side ID token verification.

The Pages content security policy permits the Google sign-in frame at `https://accounts.google.com`. Other frame sources remain blocked.

Missing configuration and script-loading failures leave chat usable. OAuth popup errors and account selection are handled by Google's button; the user can close or retry the dialog.

## Validation

Unit tests cover UTF-8 names, unexpected credential claims, unsafe photo URLs, session-only display data, and disconnect. Real Google sign-in must be manually verified with a registered client ID; mocked tests do not establish OAuth configuration validity.

## Missing photo and consent branding

A successful name link can have no `picture` claim. The October 6 instance log reports `photoProvided: false`; that is different from a failed image download. Show an initial and an explanation rather than repeatedly fetching a missing URL. The current single sync flow explicitly requests `openid profile` access and reads Google’s UserInfo endpoint. No client secret or additional API key is needed. The access token is discarded after the request; no refresh token is requested. Fetch uses `no-store`. Google may remember the consent grant, but the Codec stores no profile or token persistently. Disconnect, refresh, closing the page, or entering the back/forward cache clears the in-memory profile. Late responses cannot restore a disconnected profile. If Google supplies a first name without a photo, sync still succeeds and the portrait shows an initial. See [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model).

The consent application name comes from **Google Auth Platform → Branding** in the Cloud project, not the client name in the Clients list. Two OAuth clients in the same project share that branding. If the project also powers Inner Signal, create a separate ChatLaLiLuLeLo Cloud project with its own branding/client and the same allowed origins, then supply the new public client ID. Renaming the existing project's branding also affects Inner Signal. No branding setting was changed by this repository update. See [Google setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Instance diagnostics

Desktop and mobile web debug panels label downloads **LOCAL**, **GITHUB-PAGES**, or **HOSTED**. Filenames include that source (for example `codec-logs-local-<instance>.txt` and `codec-logs-github-pages-<instance>.txt`). The header includes the environment, origin, and page path, excluding query strings and fragments. The bounded in-memory buffer contains the latest 1,000 console/error entries for the current page. Refresh resets it. Common credentials are redacted, but logs can include conversation text; review before sharing. Photo diagnostics report only whether a photo was supplied/accepted and whether loading succeeded.


## Error 400: origin_mismatch

For the current client `35467599270-90t3b8dc2r5c68lcvpbevjnr3rjrioet.apps.googleusercontent.com`, open **Google Auth Platform → Clients → the Web application client → Authorized JavaScript origins** in the **chatlalilulelo** Cloud project. Add both:

- `http://localhost:14085`
- `https://johndtwaldron.github.io`

Save, allow Google configuration changes to propagate, then refresh and retry. The Pages origin must not contain `/ChatLaLiLuLeLo/` or a trailing slash. Adding origins to the old Inner Signal project/client does not authorize this new client. The popup-based flow does not require a redirect URI or client secret. GitHub Pages supports this Google flow; `origin_mismatch` is a client configuration rejection, not a hosting limitation.
