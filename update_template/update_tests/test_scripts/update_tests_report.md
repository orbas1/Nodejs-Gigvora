# Test Execution Report Template — Aurora Release

## Metadata
- **Release**: 2024.06 "Aurora"
- **Environment**: {staging|preprod|production}
- **Date**: YYYY-MM-DD
- **Executed by**: <Name>

## Summary Table
| Suite | Command | Status | Log Artifact |
| --- | --- | --- | --- |
| Backend Jest | `npm test` | {Pass|Fail} | `artifacts/aurora/tests/backend-jest.log` |
| Database Integration | `./database_test_script.sh` | {Pass|Fail} | `artifacts/aurora/tests/database-tests.log` |
| Frontend Vitest | `./front_end_test_script.sh` | {Pass|Fail} | `artifacts/aurora/tests/frontend-vitest.log` |
| Frontend Lint | `npm run lint` | {Pass|Fail} | `artifacts/aurora/tests/frontend-eslint.log` |
| Build Verification | `./build_test.sh` | {Pass|Fail} | `artifacts/aurora/tests/frontend-build.log` |
| Mobile UI Tests | `detox test --configuration ios.release` | {Pass|Fail} | `artifacts/aurora/tests/mobile-detox.log` |

## Detailed Findings
### Backend
- Status: {Pass|Fail}
- Notes: …

### Frontend
- Status: {Pass|Fail}
- Notes: …

### Mobile
- Status: {Pass|Fail}
- Notes: …

### Infrastructure
- Status: {Pass|Fail}
- Notes: …

## Blocking Issues
| ID | Description | Severity | Owner | Resolution Target |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Sign-off
- QA Lead: ____________________ Date: ___________
- Release Captain: _____________ Date: ___________
