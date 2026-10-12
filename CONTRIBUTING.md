# Contributing

Thanks for wanting to contribute to the Job Portal. This is a small, deliberately
zero-dependency project — no package.json, no build step, no bundler — so the
bar for a contribution is low and the review is quick.

## Getting started

1. Fork the repository and clone it locally.
2. Serve the folder (any static server works):

   ```
   npx serve .
   ```

   or just open `index.html` directly in a browser.

3. Make your change in a feature branch.

## Project layout

```
js/lib/job-utils.js   # pure, tested rules (formatting, filters, validation, CSV)
js/jobs.js            # the job data — the single source of truth for listings
js/job-filters.js     # renderer + filter wiring (dashboard.html / jobs.html / index.html)
js/dashboard.js       # dashboard wiring (stats, pipeline, notifications, CSV export)
js/layout.js          # shared sidebar navigation
tests/                # node:test suite that runs the browser scripts in a vm sandbox
jsconfig.json         # JSDoc type-checking config (checkJs)
docs/architecture.md  # UML diagrams (mermaid)
```

## Rules of the road

- **Stay zero-dependency.** No `package.json` bloat, no build step. Tests use
  Node's built-in `node:test` runner; types are JSDoc checked with `tsc`.
- **Keep the browser scripts classic.** The scripts are loaded with plain
  `<script>` tags. Don't introduce `import`/`export` — the test harness loads
  them in a `vm` sandbox exactly as a browser would.
- **Put rules in `job-utils.js`.** Any pure logic (formatting, filtering,
  data validation, CSV) belongs there so it is covered by tests once. Page
  scripts (`job-filters.js`, `dashboard.js`) should only wire DOM to those rules.
- **Annotate with JSDoc.** New or changed functions should carry `@param` /
  `@returns` / `@typedef` so `tsc` can verify them.
- **Match the existing ES5 style.** `var`, function expressions, string
  concatenation — consistent with the rest of the codebase.

## Adding a job

Open `js/jobs.js` and append an object to the `JOBS` array (see the README for
the full field list). The renderer, badges, and filtering update automatically.
If you change the valid values for `type`, `location`, or `level`, update the
validators in `js/lib/job-utils.js` and add a test.

## Running the checks

The suite (no install required):

```
node --test
```

The type check on browser scripts (fetches TypeScript on demand, nothing is
added to the repo):

```
npx --yes -p typescript tsc -p jsconfig.json
```

## Pull requests

- One logical change per PR.
- If you touched `js/`, make sure both commands above pass and add/update tests
  in `tests/` for any behavior change.
- Keep the README's structure and "how the shared pieces work" sections in sync
  if you add or rename files.
- Rebase on the latest `main` rather than merging.

## License

By contributing, you agree that your contributions are licensed under this
project's [MIT License](LICENSE). See also the [Code of Conduct](CODE_OF_CONDUCT.md).