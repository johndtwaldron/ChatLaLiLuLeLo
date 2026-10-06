# Codec profile providers: Google, Nostr/Primal, and X

Status: specification only; implementation comes later. Prepared 6 October 2026; recheck provider pricing and requirements before implementation.

## Purpose

Let a user temporarily fill the Codec's user portrait and label from a social profile. Only a username/display name and profile picture are needed. Text chat works without linking. This is cosmetic personalization, not a Codec account, payment identity, or backend authentication system.

Recommended order: finish Google photo diagnostics, add Nostr/Primal public-profile import, then add X if its permission and billing requirements are acceptable.

## Cost and setup comparison

| Provider | Expected provider cost | What the owner must configure |
| --- | --- | --- |
| Google (existing) | Basic Google Identity sign-in does not need a paid profile-lookup service for this design | Existing web OAuth client and allowed origins; already configured locally and as a Pages repository variable |
| Nostr / Primal profile | No mandatory protocol fee or OAuth registration; use public relays that permit free reads. Relay availability/charges depend on the chosen operator | Public test profile and a relay strategy; optionally a NIP-07 browser signer for testing |
| X | Published User Read price: US$0.010 per returned user. Approximate upper estimate: 100 separately billable profile reads = $1; 1,000 = $10. X documents daily deduplication, but do not rely on it as a hard guarantee | Developer app, OAuth client ID, callback URLs, API credit balance, and an owner-selected spending cap |

The Nostr cost is a design estimate for public read access, not a promise about every relay or hosted cache. No Primal Premium membership is required by the proposed Nostr flow. X's price excludes our hosting costs and may change; verify the rate and endpoint access in the developer console. Do not buy credits automatically or enable auto-recharge. Source: [X pricing](https://docs.x.com/x-api/getting-started/pricing).

## Per-instance retention contract

An instance is one live browser page/tab. Separate tabs are independent. Refresh, page close, or Disconnect clears our linked profile. There is no automatic reconnect.

- Final display state contains only `{ provider, label, pictureUrl }` in memory. Username is preferred; Google uses its existing first-name label.
- No profile, public key, user ID, email, credential, or token is written to localStorage, sessionStorage, IndexedDB, application cookies, service-worker caches, database, analytics, or chat history. No profile fields are added to chat requests or model prompts.
- Public keys and OAuth transaction values exist transiently while resolving the profile, then are released. Tokens are used only for the profile request and best-effort revocation, then discarded.
- Disconnect and provider switching clear the old profile, image state, subscriptions, pending callbacks, and temporary object URLs. A cancelled/stale callback must not restore an old profile. Restore the normal mode label and silhouette.
- On a restored back/forward-cache page, clear linked state rather than silently reviving a previous instance. Do not depend on unload handlers to revoke tokens: page termination is unreliable.
- Logs may say provider, phase, success/failure, duration, and a safe error code. They must omit names, handles, npubs, user IDs, avatar URLs, raw metadata, OAuth codes, state/verifiers, tokens, and callback URLs containing query parameters. Audit console interception and downloadable logs before release.
- Any X backend handles profile/token data for the current request only; use `Cache-Control: no-store`, no request-body/authorization logging, no persistent sessions, and no profile cache. Infrastructure logging must also avoid identity-bearing URLs and bodies.

This means **no application persistence**. It does not erase the user's original social profile or control provider consent, signer permissions, relay/image-server access logs, browser HTTP caches/history, or screenshots/downloads the user saves. External servers receive network requests and can see network information. UI copy should say: “Used for this Codec page only. Refresh or disconnect to clear it.” Do not promise zero traces anywhere or that external permissions expire when this tab closes.

## Shared interface and image behaviour

Use one “Link profile” dialog with Google, Nostr / Primal, and X choices. Show the provider, linked label, Retry photo, Switch, and Disconnect. Importing a public profile must be labelled as an import rather than verified sign-in.

Render the label as plain text with a reasonable length limit (40 characters). Do not infer a first name by splitting a social display name. Only HTTPS avatar URLs are accepted; reject credentials in URLs, local/private addresses, and unsupported schemes. Restrict avatar hosts through a reviewed allowlist, expanded using real test profiles; do not implement an arbitrary server-side image proxy.

Load web images without a referrer. Missing or blocked photos retain the label and show the silhouette with Retry. A profile import must not fail just because its photo fails. Do not poll or repeatedly retry image/API requests. CSP changes must be restricted to reviewed relay, provider, and image origins.

## Nostr / Primal

Primal is a Nostr client. Our integration reads the underlying Nostr profile; it does not sign into or copy the user's Primal session. Primal's [official web app repository](https://github.com/PrimalHQ/primal-web-app) describes its Nostr client and configurable cache service.

### Proposed first version

1. User explicitly selects “Import Nostr / Primal profile”. Accept a public `npub` or `nprofile` reference. Reject `nsec` and secret-key formats without logging the input. Do not ask anyone to paste a private key.
2. Decode the public reference locally. Query a small configured set of public `wss://` relays for kind-0 metadata authored by that key, with a bounded timeout and response size.
3. Validate event ID/signature and author, reject malformed/future-dated events, and select the newest valid metadata (deterministic tie-break for equal timestamps). Close the subscription and connections after lookup.
4. Map metadata `name` to the username; use `display_name` if no usable name exists. Read `picture` for the avatar. Discard everything else and release the public key and raw event.
5. A pasted public key can refer to anyone. This imports a profile and does not prove the visitor owns it. It must never grant account/payment access.

Optional convenience: a NIP-07 “Use browser signer” button calls only `window.nostr.getPublicKey()` after a user click, then runs the same lookup. Request no signing, encryption, private-key, wallet, or payment operation. A signer-provided public key is still cosmetic input, not proof of control. NIP-46 remote signing and verified authentication are deferred.

Protocol sources: [NIP-01 metadata and event rules](https://github.com/nostr-protocol/nips/blob/master/01.md), [NIP-07 browser capability](https://github.com/nostr-protocol/nips/blob/master/07.md), [NIP-24 display names](https://github.com/nostr-protocol/nips/blob/master/24.md), [NIP-19 public reference encoding](https://github.com/nostr-protocol/nips/blob/master/19.md).

### Exactly what I need from you

- A **public npub/nprofile copied from your Primal profile**, to test the current username and photo. A public profile link is also useful; the first version need not support every vanity-link format.
- Tell me whether you prefer paste/import only, or paste plus a browser signer. If a signer is wanted, name the extension/browser you actually use; it is optional.
- Any preferred public relay URLs. If you have none, I can choose a small free public relay set during implementation and test availability. No relay subscription purchase is assumed.

No Google-style OAuth client ID, Primal client secret, account password, or private Nostr key is needed. If a Primal-specific cache API is later preferred, first verify its public usage terms and response format; it is not a required dependency here.

## X

### Proposed flow

Use OAuth 2.0 Authorization Code with PKCE (S256), with a popup so the original page keeps transaction state in memory. Use a **Single Page App public client**, avoiding an application client secret. A short-lived Worker request performs token exchange and the profile read if direct browser requests are unsuitable; validate this against X's current CORS and app access during implementation.

The parent stores a random state and PKCE verifier in memory. A dedicated static callback page relays the code/state with `postMessage` to its opener. Validate exact origin, source window, state, and transaction lifetime. Scrub callback query parameters immediately, avoid loading the ordinary app/debug logger there, and never place tokens in URLs. Popup cancellation, refresh, missing opener, or blocked popups ends the transaction with a visible retry option; do not use storage as a workaround.

Fetch only `GET /2/users/me?user.fields=profile_image_url`. Map returned `username` and `profile_image_url` to display state; discard ID and other fields. Revoke the access token after this one-time import where supported, then release it regardless of revocation success. Retaining the display profile does not require retaining its token.

X's documented endpoint mapping requires **`users.read tweet.read`**, despite the narrow feature. Request no write, DM, email, follow, or `offline.access` scope; fetch no posts. The consent UI must explain the broader read permission. If that permission is unacceptable, defer X and use public Nostr import or manual profile entry. Sources: [X authentication mapping](https://docs.x.com/fundamentals/authentication/guides/v2-authentication-mapping), [X PKCE/public clients](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code), [X current-user endpoint](https://docs.x.com/x-api/users/get-my-user).

### Exactly what I need from you

1. Create or identify an app in the [X Developer Console](https://console.x.com/). Enable OAuth 2.0 with app type **Single Page App**. If your account offers different options, report those before configuring credentials.
2. Register these proposed callback URLs **exactly**, including file path:
   - `http://localhost:14085/oauth/x/callback.html`
   - `https://johndtwaldron.github.io/ChatLaLiLuLeLo/oauth/x/callback.html`
   These are proposed files to create during implementation; unlike Google's allowed origins, X callbacks include paths. Confirm localhost is accepted; if not, report the console error so we can choose a supported local callback.
3. Set the application website to the hosted Codec URL. Supply any required owner-approved app description, privacy-policy URL, and terms URL. If policy pages do not exist, I can draft them to reflect the actual no-persistence design before you register them; this spec is not a substitute for a public policy page.
4. Send the **OAuth 2.0 Client ID** and confirmation of the saved app type/callbacks. Do not send API secrets, passwords, access tokens, or a consumer key in place of the client ID.
5. Confirm current `users/me` access/pricing in your console, choose whether to fund credits, and state a **maximum API spend per billing cycle**. You handle any payment. No amount is pre-authorized by this spec.
6. Confirm you accept the documented `tweet.read` permission for profile import. The app will fetch only your profile, but the provider's permission itself is broader.
7. A public X handle for manual testing, and whether Brave desktop is the first target.

Planned public configuration: `X_CLIENT_ID` in the edge configuration source, synced as `EXPO_PUBLIC_X_CLIENT_ID`; callback URLs configured explicitly per environment. If a confidential client becomes necessary, stop and revise the architecture: its secret must stay in Worker secrets and never in Expo's public variables or GitHub Pages.

Cost controls: one profile read per explicit linking operation, no background refresh, no retries on 401/403/429 or billing exhaustion, a server-side request limit, and the owner-selected provider spending cap. Do not expose an unauthenticated endpoint using a persistent app bearer token for arbitrary handle lookups. Cosmetic profiles must never be used to validate paid access.

## Google: what remains needed

The existing public client ID and localhost/Pages origins have already been supplied. No new client registration is needed. Finish the current photo-load test using a fresh link in Brave; if it fails, export the instance diagnostics without adding identity data to logs. Keep Google name/photo in the same shared in-memory display model.

## Acceptance checks before any release

- Provider success changes only the user portrait/label; chat requests contain no identity data.
- Missing photos, denied consent, malformed metadata, offline relays, blocked popup, expired transaction, revoked credentials, and exhausted API credits all leave chat usable and show actionable feedback.
- Refresh, close/reopen, Disconnect, switching providers, and back/forward-cache restore clear identity. Two tabs do not share profile state. A cancelled pending request cannot relink afterward.
- Inspect browser storage and exported instance logs: no identity, credentials, raw provider payloads, or auth query parameters. Check Worker logs and response cache headers too.
- Nostr rejects private keys and invalid signatures, chooses the newest valid metadata, and closes all lookups. No signing or publishing occurs.
- X callback/state/source checks reject replayed or cross-origin messages; tokens and verifiers are absent from storage, URLs, logs, and the exported bundle.
- Validate images and provider flows locally in Brave, then on GitHub Pages. Verify real sign-in/import and photo rendering; mocked tests alone do not establish provider configuration validity.

## Reply template for implementation

```text
Nostr/Primal public npub or nprofile:
Nostr option: paste only / paste + browser signer
Signer and browser, if used:
Preferred relays, or “choose free public relays”:

X OAuth 2.0 Client ID:
X app type and saved callbacks confirmed:
Public website/privacy/terms URLs, or “draft policy pages first”:
X profile endpoint access and current price confirmed:
X credits configured: yes / not yet
Maximum API spend per billing cycle:
Accept users.read + tweet.read for profile-only fetching: yes / defer X
Public X test handle:

First test target: Brave desktop / other
```

Do not provide passwords, private keys, or client secrets in this reply.
