# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-10-12

### Added

- Pure, tested core module `js/lib/job-utils.js` (formatting, filters, validation, CSV) with JSDoc types.
- Zero-dependency test suite (`node --test`) that loads the browser scripts in a `vm` sandbox.
- JSDoc type-checking via `jsconfig.json` and `tsc --noEmit`.
- CI pipeline (tests + coverage + type check + lint), OpenSSF Scorecard workflow, and Dependabot.
- MIT `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, and issue/PR templates.
- Architecture UML diagrams in `README.md` and `docs/architecture.md`.
- README badges for license, security, status, stack, dependencies, tests, typing, CI, and scorecard.

### Changed

- Refactored `js/job-filters.js` and `js/dashboard.js` to delegate pure rules to `job-utils.js`
  (behavior preserved; verified by smoke tests).
- Typed job data in `js/jobs.js` as `Job[]`.

[Unreleased]: https://github.com/ogc16/simple_job_bank/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ogc16/simple_job_bank/releases/tag/v0.1.0