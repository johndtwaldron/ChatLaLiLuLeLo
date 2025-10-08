# Dev-QA — Continuous QA Improvements

## Scope
- Expand Playwright coverage (themes, modes, lightning)
- Visual regression (per theme) baselines
- Lighthouse CI budgets (perf, PWA, a11y)
- axe-core accessibility checks
- Postman + Newman CI run for API
- Pact (contract) tests (optional phase 2)

## Deliverables
- `tests/e2e-web/visual/*.spec.ts` + baselines
- `tests/perf/lhci.config.js` + budgets
- `tests/a11y/*.spec.ts` (axe)
- `tests/api/*.postman_collection.json` + Newman script
- README updates in `docs/QA_STRATEGY.md`

## Definition of Done
- CI matrix runs fast (<15m combined)
- Flake rate <1% over 10 runs
- Baselines stored & updated via PR reviews
