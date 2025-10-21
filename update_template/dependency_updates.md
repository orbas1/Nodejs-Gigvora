# Dependency Updates

## Runtime Dependencies
| Package | From | To | Notes |
| ------- | ---- | -- | ----- |
| `express` | 4.18.2 | 4.19.1 | Includes security fixes for path traversal vulnerability |
| `cors` | 2.8.5 | 2.8.6 | Enables fine-grained origin configuration |
| `jsonwebtoken` | 9.0.1 | 9.1.0 | Adds support for Key ID rotation |
| `stripe` | 12.5.0 | 13.2.0 | Required for REST onboarding |
| `opossum` | – | 6.0.0 | Circuit breaker for external providers |

## Dev Dependencies
| Package | From | To | Notes |
| ------- | ---- | -- | ----- |
| `jest` | 29.7.0 | 30.0.1 | Aligns with Node 20 support |
| `supertest` | 6.3.3 | 7.0.0 | Required for HTTP/2 testing |
| `eslint` | 8.56.0 | 9.1.0 | New flat config support |
| `@openapitools/openapi-generator-cli` | 6.6.0 | 7.2.0 | Generates updated API clients |

## Dependency Management
- Added Renovate configuration to auto-detect security patches while respecting maintenance windows.
- Locked transitive dependencies via `npm shrinkwrap` to maintain deterministic builds.
- Performed license review; no new copyleft dependencies introduced.
