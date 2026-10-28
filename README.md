# Laravel + Vue Starter Kit

## Introduction

Our Vue starter kit provides a robust, modern starting point for building Laravel applications with a Vue frontend using [Inertia](https://inertiajs.com).

Inertia allows you to build modern, single-page Vue applications using classic server-side routing and controllers. This lets you enjoy the frontend power of Vue combined with the incredible backend productivity of Laravel and lightning-fast Vite compilation.

This Vue starter kit utilizes Vue, TypeScript, and Tailwind, but **does not include any authentication scaffolding**.

## Official Documentation

Documentation for all Laravel starter kits can be found on the [Laravel website](https://laravel.com/docs/starter-kits).

## Contributing

Thank you for considering contributing to our starter kit! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

All contributions to the Starter Kits from now on should be made through [Maestro](https://github.com/laravel/maestro).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## License

The Laravel + Vue starter kit is open-sourced software licensed under the MIT license.

## Portal pull request checks

`.github/workflows/tests.yml` checks PHP 8.4 Composer validation, syntax, non-mutating Pint and full PHPUnit on in-memory SQLite, plus Node 24 Vue lint, formatting, types and component tests. `Required CI` fails if either job fails, is cancelled or is skipped. All PRs (including drafts and retargeting), main/release pushes and merge queues are covered; JUnit results are retained for seven days.

Install dependencies with `composer install` and `npm ci --ignore-scripts --no-audit --no-fund`. Run `php artisan wayfinder:generate --with-form --skip-routes` to generate ignored runtime/actions while preserving committed route bindings. Then run `composer lint:check`, `vendor/bin/phpunit`, `npm run lint:check`, `npm run format:check`, `npm run types:check` and `npm run test:run`. PHPUnit disables Vite and verifies Inertia JSON without built assets/fonts. Tests must not contact a real identity provider.

The current portal uses Authentik. Unreachable local-profile and two-factor starter screens referenced absent controllers and have been removed. Account features remain in issue #5; standalone migration and full feature parity remain future work.

GitHub rulesets require PRs and an up-to-date `Required CI` from GitHub Actions on default/release branches, including nested release names. No bypass actors or mandatory human approvals; force pushes and deletion are blocked. Settings live in GitHub independently of workflows. Existing PRs missing the gate need updating. CODEX branches remain pushable. Checks do not build assets/containers or deploy.
