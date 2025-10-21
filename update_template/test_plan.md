# Test Plan — Gigvora November 2024 Feature Pack

## 1. Introduction
This test plan outlines validation activities for the Role Control Center, Provider Credibility Suite, Serviceman Mission Control, and Trust-Focused User Profile. The goal is to ensure a release-ready, secure, and high-performance experience across all personas.

## 2. Scope
- **In Scope:** RBAC management APIs & UI, credential onboarding flow, mission console, user profile experience, preference service, telemetry instrumentation, CORS configuration, localisation.
- **Out of Scope:** Legacy analytics dashboards deprecated in this release, mobile native apps (covered separately).

## 3. Test Objectives
- Validate functional correctness against acceptance criteria.
- Confirm RBAC enforcement and audit logging for every privileged action.
- Ensure CORS policies respond correctly to allowed origins and reject unauthorised domains.
- Verify accessibility (WCAG 2.2 AA), localisation, performance, and security baselines.

## 4. Test Strategy
### 4.1 Test Levels
- **Unit Tests:** Backend (Jest) covering policy diffing, credential validation, mission API rate limiting; Frontend (Vitest) for components and hooks.
- **Integration Tests:** Contract tests using Pact for RBAC and credential services; API tests in Postman/Newman verifying CORS preflight, authentication, and rate limits.
- **End-to-End Tests:** Playwright scenarios across admin, provider, serviceman, and user flows including offline mission control and WebAuthn prompts.
- **Non-Functional Tests:** Load testing with k6 (mission events, credential uploads), security scans (OWASP ZAP, Snyk), accessibility audits (Axe CI + manual), localisation QA.

### 4.2 Test Data
- Synthetic RBAC policies seeded via fixtures with safe redaction.
- Provider credential datasets using anonymised documents.
- Mission assignments covering normal, urgent, and escalated scenarios.
- User profiles representing varying trust levels and locales.

### 4.3 Environments
- **Development:** Feature branches with mocked integrations.
- **Staging:** Full-stack environment mirroring production topology; used for UAT and load tests.
- **Production Canary:** Limited rollout with feature flags for live validation.

## 5. Test Cases Overview
| Area | Key Test Cases |
| --- | --- |
| RBAC | Create/update/delete policies, detect conflicts, enforce dual approval, audit log verification, policy export checksum. |
| Credential Onboarding | Document upload limits, AI validation fallback, manual override workflow, badge issuance, analytics events. |
| Mission Control | Offline checklist sync, SLA countdown accuracy, escalation triggers, rate limit behaviour, push notification acknowledgement. |
| User Profile | Activity timeline filters, recommendation CTA flows, verification banner states, preference centre persistence, accessibility preference propagation. |
| Security | WebAuthn registration/login, session timeout warnings, CSP validation, CORS allowlist enforcement, rate-limit abuse tests. |
| Performance | Lighthouse audits, k6 load tests (RBAC 500 rps, mission events 1k rps), bundle size budgets, offline caching metrics. |

## 6. Entry & Exit Criteria
- **Entry:** Feature code complete, unit test coverage ≥ 90%, test data available, environments stable.
- **Exit:** All P0/P1 defects resolved, P2 defects have mitigation plans; test reports signed off by QA, security, and product; SLIs within thresholds (latency, error rate, availability).

## 7. Roles & Responsibilities
- **QA Lead:** Coordinate execution, maintain defect log, consolidate reports.
- **Backend Engineers:** Own unit/integration tests, support load testing, remediate API defects.
- **Frontend Engineers:** Maintain component/unit tests, execute E2E scripts, fix UI/UX issues.
- **Security Team:** Conduct penetration test, review CORS & RBAC controls, sign security readiness.
- **Product Managers:** Approve UAT results, communicate release readiness to stakeholders.

## 8. Schedule
- Unit & integration test development: 28 Oct – 15 Nov.
- Automated E2E script completion: 8 Nov.
- Regression cycles (manual + automated): 18 Nov – 6 Dec.
- Load & security testing: 25 Nov – 4 Dec.
- Final sign-off: 11 Dec.

## 9. Deliverables
- Test case repository (TestRail) with traceability to user stories.
- Automated test reports (CI artifacts) for unit, integration, E2E suites.
- Load testing dashboards and summary PDF.
- Accessibility & localisation audit reports.
- Final Test Closure Report appended to release checklist.

## 10. Risks & Mitigation
- **Risk:** Late-breaking RBAC changes may invalidate tests. *Mitigation:* nightly contract tests and policy snapshot diffing.
- **Risk:** Offline mission control edge cases uncovered late. *Mitigation:* field pilot program with telemetry instrumentation.
- **Risk:** CORS misconfiguration between staging and production. *Mitigation:* config-as-code with CI validation and runtime health checks.

## 11. Approval
Sign-off required from QA Lead, Engineering Managers, Security Lead, and Product Director prior to launch.
