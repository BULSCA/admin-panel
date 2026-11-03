# Working on the member portal

## Scope and release workflow

- This repository is `BULSCA/admin-panel`. The authoritative backend is the sibling `../bulsca-site` checkout (`BULSCA/bulsca-site`); the public Vue website is `../bulsca-frontend`.
- Use `CODEX/` feature branches and PRs into `release/public-site-v1`. Only release branches omit that prefix. Make focused commits; do not merge, force-push or delete branches without explicit instructions.
- The owner has prohibited application/asset builds, container image builds and deployment. Unit tests, lint, type checks and development servers are permitted. Deployment testing belongs to the owner.
- Preserve the retained Laravel/Inertia prototype. The new standalone entrypoint has not replaced the production portal. Do not silently move authentication to the prototype's database.

## Start here

Read README.md for setup, onboarding and deployment boundaries. The organisation feature is paired with backend branch `CODEX/organisation-memberships`; the portal feature branch is `CODEX/organisation-portal`.

| Concern | Source |
| --- | --- |
| Standalone boot, routes, layout | `index.html`, `resources/js/portal.ts`, `resources/js/PortalApp.vue` |
| Dashboard, club/member space, central admin | `resources/js/pages/portal/` |
| Shared notices, cards and error boundary | `resources/js/components/portal/` |
| Session/CSRF requests and safe diagnostics | `resources/js/lib/portalApi.ts`, `portalDiagnostics.ts` |
| Wire-format validation, DTOs and identity state | `resources/js/lib/portalData.ts`, `portalState.ts`, `resources/js/types/portal.ts` |
| Cancelled/stale reads | `resources/js/composables/usePortalResource.ts` |
| Feature/component tests | `resources/js/__tests__/portal*.spec.ts` |
| Standalone / retained prototype configuration | `vite.config.ts` / `vite.inertia.config.ts` |

## Invariants

- Shared Laravel `/api/v1/portal` is the authority. UI permission checks only hide unavailable controls; backend checks must enforce every action.
- Use same-origin sessions and CSRF. Never persist credentials, identity or membership data in local storage or send it through the public website's cookie-stripping proxy.
- A failed widget must leave club access usable. Validate nested DTOs before rendering, cancel stale reads on navigation, preserve failed forms, and never automatically retry writes.
- Ordinary members receive names and role titles; management permissions govern contacts and changes. Signing in grants no memberships or roles.
- Diagnostics contain fixed categories and route templates only, without raw error text, IDs, names, email addresses, queries, tokens or submitted form data.
- Do not bypass denied requests by adding client-only roles or changing the permission catalogue here. Change the backend and its security tests first.

## Verification and handover

Use Node 24. Run `npm run lint:check`, `npm run format:check`, `npm run types:check` and `npm run test:run`. The repository-wide type check also includes retained prototype components: with PHP dependencies installed, generate their ignored helpers using `php artisan wayfinder:generate --with-form --skip-routes`. Prototype checks are `composer lint:check` and `vendor/bin/phpunit` on in-memory SQLite. CI runs these and gates merges through `Required CI` without building assets.

The current feature has unit/component coverage plus backend permission/SSO feature tests. Full browser acceptance against the shared backend, real SSO configuration and the standalone production serving/cutover still need verification. No incomplete browser test runner is shipped. When asked to continue, start with a bounded local browser test of sign-in, role-specific navigation and one complete club-management journey; follow the backend test database guard. This is a verification gap, not permission to deploy.

Email invitation delivery, identity-provider account provisioning, migration of legacy club administrators and new competition/content editing permissions are outside this feature. Do not assume they exist. People must sign in once before a manager adds their registered email.
