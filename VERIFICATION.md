# Verification record

Verified 2026-10-21 UTC, Node.js v24.19.0, Linux. Version 0.1.0.

## Actually executed

- npm run typecheck: tsc --noEmit, exit 0. strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes enabled.
- npm test: 40 tests passed, 0 failed. See test-results.txt.
- npm run demo: offline deterministic fixture. Two synthetic events, simulated acknowledgement, repeat run zero unseen events, failed source throws rather than reporting no changes. See demo-output.txt.
- Persistent file state tested with temporary local files: missing state, atomic write/read, corrupt state fails closed, concurrent lock rejected, lock released after completion.
- Config checks: timezone, clock, GitHub URL allowlist, source count, duplicate sources, unsupported destination/mode, unknown fields.
- Logic checks: duplicate event, future event deferred, late-arriving event retained despite cursor, incorrect approval rejected, failure/uncertain delivery cannot advance state.

## Not executed / not implemented as a connector

- GPT/Responses API: no calls, no model summary, no billing.
- Live GitHub collection: no repository fetched by this kit. A connected Dots performs this according to its actual capabilities; full pagination is a requirement, not an implementation in this repository.
- Slack read or send: absent from this minimal version, not tested.
- Official Dots automation creation, next scheduled run, chat delivery: not performed. Requires the user's exact sources, time, destination and recurring-send permission, plus supported connected capabilities.
- Live installation acceptance: not performed. An independent reviewer reran typecheck, all 40 tests and demo successfully, and reviewed a clearly simulated README-only guided-setup scenario. This is documentation acceptance, not a real installation.

The example formatter is explicitly synthetic and rule-based. It is not evidence that GPT generated a summary. README and INSTALL_FOR_DOTS are a guided configuration protocol, not an autonomous executable installer. Opening a GitHub URL never itself grants installation, data transmission or recurring execution authority.

## Known limitations

The reference state functions require the caller to hold the lock across the entire run. Atomic rename protects a normal write, but a power failure during filesystem metadata commit is not fully covered by this small example. The state history is not pruned, so long-running installations need a retention plan without losing dedup coverage. The helper has no network transport, external scheduler or transactional outbox. Instructions require persisting pending sends and reconciling uncertain delivery; that integration depends on the host and is not implemented here. Exactly-once delivery across a messaging service and a local state file is not guaranteed. Production integration needs transport-specific idempotency or reconciliation.

No actual recurring task, credentials, public deployment or message was created by running these checks. Use the evidence labels above when writing about this project.
