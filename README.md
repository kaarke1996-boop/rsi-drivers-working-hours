# RSI Drivers Working Hours Tracker

Mobile-friendly shared timesheet for Alinur and Noshad. Hosted on Netlify with source on GitHub and records in Supabase Postgres. No driver accounts.

## Features

- Historical entries from 1 October 2026 through today (Saudi Arabia time).
- One active shift per driver per day; overnight shifts belong to the start date.
- Exact minute calculations; daily and monthly totals. Maximum shift: 18 hours. No break deduction.
- Monthly dashboard for both drivers; driver filter and Excel-compatible UTF-8 CSV export.
- Shared records refresh on return to the page and every 30 seconds. A network connection is required; failed saves retain the form.

## Database protections

Row-level security and column-level privileges allow anonymous visitors to read active records and insert validated shifts only. They cannot update or delete, alter generated minutes, change timestamps, set the archive flag, or overwrite another entry. A unique index enforces one active entry per driver/date. Database checks enforce driver names, dates, whole minutes and 1–1080 minute duration. Future entries are rejected in the database using Asia/Riyadh time.

The public publishable key in config.js is intended for client applications. It is not a service-role or secret key. Never commit a database password or service-role key.

**No-login limitation:** visitors can view records and submit under either name. This does not verify who actually worked a shift, prevent someone from submitting a false first entry, or provide private payroll records. Keep the URL within the team. For stronger identity protection, use authenticated drivers or separately issued private submission links.

## Supervisor corrections

Use the Supabase Table Editor, signed into the owner account. Correct the mistaken row directly, or set `archived=true` to hide it and permit a replacement for the same driver/date. Archiving is reversible. The public website cannot archive, edit or delete records. Retain archived rows for review.

## Deployment and checks

Source is versioned in this GitHub repository. The current Netlify deployment uses a direct upload of the same website files, without a GitHub account integration. Changes to this repository do not automatically deploy. To update, upload the website files and `_headers` to the existing Netlify project. If a Git integration is enabled later, publish directory is `.` and no build command is needed. `_headers` applies security headers for direct uploads; `netlify.toml` also declares them for Git builds. `setup.sql` documents the deployed schema and is for a fresh database only.

Run calculation/export checks with `node core.test.cjs`. Test database permissions using the Supabase SQL editor under role `anon` in a transaction that is rolled back. Perform browser submission, duplicate, refresh, dashboard and CSV checks on the deployed website; archive test rows afterward so real hours remain empty.
