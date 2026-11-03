<p align="center"><img src="public/bulsca-logo.png" width="110" alt="BULSCA logo"></p>

# BULSCA member portal

[![Tests](https://github.com/BULSCA/admin-panel/actions/workflows/tests.yml/badge.svg?branch=release/public-site-v1)](https://github.com/BULSCA/admin-panel/actions/workflows/tests.yml)

A standalone Vue and TypeScript portal for organisation members and committees. The shared [Laravel backend](https://github.com/BULSCA/bulsca-site) owns authentication, memberships and permissions. This repository supplies the dashboard, BULSCA administration and club spaces; it does not maintain a separate membership database.

## Included

- Dashboard with the championship campaign, competitions in the next two weeks and quick access to the person's organisations. Public widgets fail independently.
- BULSCA administration: add affiliated clubs, appoint their initial managers and link existing public clubs so uploaded logos can appear on the public website.
- Member spaces: searchable, paginated member lists and current, future and previous committees. Names and role titles are visible to members; contacts and management controls require permission.
- Club/BULSCA committees: dated terms, explicit role appointments, membership activation/deactivation and protected manager handover.
- Organisation roles: create, edit and remove unused custom roles. Delegate only permissions you currently hold. Clubs cannot grant BULSCA-wide or superadmin access.
- Branding: primary and secondary colours, safe preview and PNG/JPEG/WebP logo uploads. Failed saves retain input; uncertain writes are never retried automatically.
- Loading, empty, denied, expired-session, malformed-response and service-error states; stale reads are cancelled when changing organisations. The navigation survives a page rendering error.

## Shared backend and first use

Use the organisation portal API from the paired `BULSCA/bulsca-site` change. Apply its normal migrations to introduce `portal_*` tables; legacy public committee biographies and club administrators are deliberately not imported as permissions. Configure the existing backend's SSO provider and registered callback, then sign in once. An operator explicitly grants the first account access with:

```sh
# Run in the shared Laravel backend checkout.
php artisan portal:bootstrap-superadmin person@example.org
```

The superadmin can add people to BULSCA's member space, create committee roles and appoint members. A club is created with an initial manager who can manage its own members, committees, restricted roles and branding. Everyone must sign in once before their registered email can be added; this release does not provision identity-provider accounts or send invitations. One person may belong to several organisations. BULSCA membership alone grants no authority over clubs: the explicit `clubs.manage` permission does. Only the existing global `super_admin` role grants root access.

Permissions apply during inclusive committee dates in Europe/London, while the membership and appointment remain active. Ending membership revokes appointments. Reactivation requires explicit appointments to restore powers. Appoint a replacement current manager before removing the final manager. Schedule a handover before a term expires; a superadmin can recover access. Protected manager roles cannot be edited, and roles with appointment history cannot be deleted. The backend checks every action independently of the browser controls.

## Local development

Use Node 24 and install the committed dependencies:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run dev
```

Vite serves the portal at `http://127.0.0.1:5176`. Run the shared Laravel backend separately on port 8000 with its `APP_URL` and SSO callback configured for the portal origin. Use a development database and file sessions. Copy the `VITE_*` settings from `.env.example` if overrides are needed:

| Setting | Default |
| --- | --- |
| `VITE_PORTAL_API_URL` | `/api/v1/portal` (same-origin paths only) |
| `VITE_BACKEND_ORIGIN` | `http://127.0.0.1:8000` (development proxy target) |
| `VITE_PUBLIC_SITE_URL` | `https://www.bulsca.co.uk` |

The development proxy forwards `/api/`, `/auth/sso` and its callback, `/storage/` and `/img/` to the shared backend, retaining session cookies and request methods. Vue routes include `/`, `/dashboard`, `/admin` and `/organisations/:id`. Refreshing a deep link must serve the SPA entry point.

The earlier Laravel 13/Inertia prototype remains available through `npm run dev:legacy` and `vite.inertia.config.ts` for reference and compatibility tests. Its Authentik settings and PHP routes do not authenticate the standalone portal. `npm run dev` now selects the standalone entry; production serving of the existing legacy portal is unchanged until an explicit deployment cutover. Do not run two authoritative authentication/membership backends.

## Verification

```sh
npm run lint:check
npm run format:check
npm run types:check
npm run test:run
```

The retained prototype's generated route helpers are needed for the repository-wide type check. With its PHP dependencies installed, run `php artisan wayfinder:generate --with-form --skip-routes` first. `composer lint:check` and `vendor/bin/phpunit` continue to verify that prototype using in-memory SQLite. New permission and SSO tests live in the authoritative backend's guarded MySQL suite; Vue tests here cover API/CSRF behaviour, private navigation, dashboard failures, membership and committee forms, roles, branding and stale responses. External identity providers are faked for tests.

`.github/workflows/tests.yml` runs checks on every PR, default/release push and merge queue. The `Required CI` gate must pass before merging to protected default/release branches. Checks do not build assets or containers, run production migrations or deploy.

## Deployment boundary and privacy

The owner performs deployment verification. The existing release container still serves the legacy portal. To cut over to this SPA, serve its static entry/deep links on the portal hostname and reverse-proxy its API, SSO and media paths to the shared backend. Keep the browser same-origin: do not send private API requests through the public website's cookie-stripping proxy. Configure `APP_URL`/the SSO callback on the portal hostname, `PUBLIC_API_URL` on the public API hostname and secure, host-scoped production cookies. Review and explicitly onboard existing committee members before switching over. Asset/container builds and that cutover have not been performed as part of this change.

The portal uses essential backend session/CSRF cookies, with no analytics or local-storage identity cache. Diagnostic reports use the existing backend endpoint without credentials and contain fixed error categories and route templates, never raw exception text, names, email addresses, queries, tokens or form values. Reports are deduplicated and capped per page. Private responses are not cached; expiry removes private content. Administration audit records retain only action codes, actor/record IDs and permitted change metadata, and are pruned after 90 days by the backend scheduler. Confirm access and retention settings as part of deployment.

## Acknowledgements and licensing

Built for BULSCA's university lifesaving community. The retained prototype originated from the Laravel + Vue starter kit and uses Laravel, Vue, Inertia and Tailwind. Preserve their MIT licence notices and the repository's existing licence when distributing their code.
