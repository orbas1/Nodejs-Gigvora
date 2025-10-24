# Runtime Configuration Precedence & Validation

Gigvora’s backend merges configuration from multiple sources before the server
boots or reloads its runtime settings. Operators should understand the
resolution order so that overrides behave predictably and validation failures
are remediated quickly.

## Source Order

1. **Process environment (`process.env`).** Baseline values provided by the host
   (Kubernetes secrets, Docker environment variables, etc.).
2. **Runtime config file.** When `RUNTIME_CONFIG_FILE` is set the loader parses
   the referenced dotenv file and overlays its keys on top of the base
   environment.【F:gigvora-backend-nodejs/src/config/runtimeConfig.js†L136-L153】
3. **Hot-reload overrides.** Callers of `refreshRuntimeConfig` may supply an
   `overrides` object; these keys take precedence over both the process
   environment and the runtime config file.【F:gigvora-backend-nodejs/src/config/runtimeConfig.js†L321-L332】

The merged environment is converted into a structured config via
`buildRawConfig`, then validated with the Zod schema to produce the final
runtime snapshot.【F:gigvora-backend-nodejs/src/config/runtimeConfig.js†L158-L320】

## Validation & Error Handling

- **Typed schema enforcement.** `runtimeConfigSchema` applies defaults and
  ensures required fields (such as the HTTP port and rate-limit windows) respect
  expected types and bounds. Validation errors throw a
  `RuntimeConfigValidationError` that surfaces every failed path to the caller.
  The server fails to boot when validation fails, preventing silent fallbacks.
  【F:gigvora-backend-nodejs/src/config/runtimeConfig.js†L95-L132】【F:gigvora-backend-nodejs/src/config/runtimeConfig.js†L201-L242】
- **CLI verification.** Run `node scripts/validateRuntimeConfig.js <envFile>` to
  lint proposed changes before deploying. The script prints each failing field
  and exits non-zero on validation errors.【F:gigvora-backend-nodejs/scripts/validateRuntimeConfig.js†L1-L55】
- **Rotation awareness.** The secret rotation script updates persisted platform
  settings and triggers a runtime refresh so new metrics bearer tokens are live
  immediately after rotation.【F:gigvora-backend-nodejs/scripts/rotateSecrets.js†L1-L78】

## Recommended Workflow

1. Update `.env` or the runtime config file with staged changes.
2. Execute `npm run config:validate` (or the script above) locally or in CI.
3. Apply the changes to the deployment environment.
4. If rotating secrets, run `node scripts/rotateSecrets.js` to generate fresh
   credentials and refresh the runtime configuration automatically.

Documenting the precedence ensures operators avoid subtle bugs—for example,
ensuring a runtime override does not appear to “stick” because a config file is
still being watched and re-applied on change.
