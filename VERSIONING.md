# Codec versioning: V.R.M.F

The product version is recorded once in `version.json`. The initial baseline is
**1.0.0.0**, adopted on 6 October 2026 for the current application. Historical
work is not assigned invented increment counts.

| Component | Meaning | Increment when |
| --- | --- | --- |
| V | Version | A major product generation or incompatible architectural change ships. |
| R | Release | A planned release milestone ships within that generation. |
| M | Modification | A specification is implemented and delivered as a new capability. |
| F | Fix | An iteration corrects defects in existing capabilities. |

Incrementing a component resets the components to its right. For example,
`1.0.0.0` → defect correction `1.0.0.1` → implemented specification `1.0.1.0`.
For a batch containing both a new specification and fixes, increment M once.
Writing a specification alone does not increment M. Do not increment for each
CI rerun, diagnostic export, or documentation edit.

Run `npm run version:vrmf -- F` for fixes, or replace F with M, R, or V.
Commit the resulting `version.json` with the corresponding change and devlog
entry. Rebuild the frontend and deploy the backend so their reported versions
agree. The build commit and timestamp distinguish builds of the same version.

Expo injects this version into the debug panel, diagnostic downloads and
conversation transcripts. Both backend health handlers report the same value.
Package/Expo manifest versions remain three-component SemVer values because
four-component VRMF is not a valid npm version. All app and backend packaging manifests start at 1.0.0, matching the V.R.M
components of the shared 1.0.0.0 baseline. `version.json` remains authoritative;
the bump command synchronises the packaging values while keeping F in product
metadata. There is one product version, not separate app/backend baselines.

Nostr/Primal and X profile synchronisation is a future M increment when
implemented; its existing provider specification is not implementation.
