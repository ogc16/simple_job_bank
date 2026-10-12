# Security Policy

The Job Portal is a static, client-side-only site. It serves no backend code and
stores no data beyond demo values in the visitor's `localStorage`. Still, we
take security seriously.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

- **Preferred:** use GitHub's private vulnerability reporting on this
  repository (under *Settings → Security → Private vulnerability reporting*)
  or open a draft [security advisory](https://github.com/security/advisories/new).
- **Alternative:** open a GitHub issue **without code, payloads, or exploit
  details** and mark it `security`, and we will follow up privately.

You will receive an acknowledgment within 72 hours. We'll coordinate a fix and
a responsible disclosure timeline before anything is made public.

## What to include

- The page(s) and script(s) affected
- Steps to reproduce (be brief)
- Impact: what an attacker could achieve
- Suggested fix (optional)

## Security notes for end users

This is a demo/portal interface. It is not a substitute for a real
authentication system:

- Login, sign-up, documents, and settings pages are **front-end only**.
- `localStorage` holds only the demo user display name; don't store real
  credentials or documents here.
- The only third-party resource loaded is the Font Awesome stylesheet from a
  public CDN (see below).

## Third-party dependencies

The project has no runtime JavaScript dependencies. The only external resource
is the Font Awesome 5.15.4 CSS from `cdnjs`:

```
https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css
```

For high-integrity deployments, self-host this stylesheet or pin it with a
Subresource Integrity (SRI) hash.

## Reporting a CDN/dependency concern

If you find an issue with a pinned CDN asset, follow the escalation path above.

## Scope

In scope: code and content in this repository.

Out of scope: websites or services that merely *use* this template. Please
report those to the respective site owner.