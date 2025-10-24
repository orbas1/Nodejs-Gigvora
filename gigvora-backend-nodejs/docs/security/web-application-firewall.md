# Web Application Firewall Rule Catalogue

The Gigvora backend ships with a built-in web application firewall (WAF) that
inspects every HTTP request before it hits the routing layer. The middleware is
implemented in [`src/middleware/webApplicationFirewall.js`](../../src/middleware/webApplicationFirewall.js)
and draws on the rule engine defined in
[`src/security/webApplicationFirewall.js`](../../src/security/webApplicationFirewall.js).

## Default Protection Surface

At startup the WAF loads a curated catalogue of detectors that cover the most
common attack classes seen against multi-tenant APIs:

| Rule Identifier | Description | Pattern Source |
| --- | --- | --- |
| `sql.union-select` | Flags SQL injection payloads using `UNION SELECT` chains. | `/union\s+select/i` |
| `sql.boolean-operator` | Detects boolean-based SQL injection expressions that compare literals. | `/(?:['"%][^a-zA-Z0-9]*)?(?:or|and)\s+['"%]?\d+['"%]?\s*=\s*['"%]?\d+/i` |
| `sql.comment` | Catches trailing SQL comment injection probes. | `/(?:--|#|\/\*)\s*[^\n]*$/m` |
| `sql.sleep` | Guards against time-based SQL injection vectors. | `/sleep\s*\(\s*\d+\s*\)/i` |
| `nosql.operator` | Blocks MongoDB-style operator injections such as `$where`. | `/\$where\s*:/i` |
| `xss.script-tag` | Detects inline `<script>` tags in payloads. | `/<\s*script[\s>]/i` |
| `xss.event-handler` | Flags DOM event handler attributes (for example `onerror=`). | `/on(load|error|mouseover|focus|click)\s*=\s*/i` |
| `rce.command-chain` | Intercepts command-injection attempts that chain shell utilities. | `/(;|&&|\|\|)\s*(?:cat|wget|curl|powershell|bash|sh|python|perl)\b/i` |
| `traversal.dotdot` | Captures directory traversal payloads such as `../etc/passwd`. | `/\.\.(?:\/|\\)/` |
| `traversal.sensitive-file` | Rejects direct access to high-value OS files. | `/(etc\/passwd|windows\\system32)/i` |
| `deserialisation.gadget` | Blocks gadget chain references used in Java deserialisation exploits. | `/java\.lang\.runtime/i` |
| `http.smuggling` | Detects conflicting `transfer-encoding` headers used in HTTP smuggling. | `/\btransfer-encoding\s*:\s*chunked/i` |

User-agent filtering is enabled by default for a small set of known scanners
(such as SQLMap, Acunetix, and Burp Suite) which are enumerated in
`DEFAULT_BLOCKED_USER_AGENTS`. Requests that match those expressions are
rejected before rule evaluation.

## Auto-blocking and Telemetry

The firewall tracks suspicious activity in-memory to protect the perimeter:

- **Offender tracking.** Repeated violations within a five-minute window are
  tallied per IP address. Offenders that cross the default threshold (`8`
  events) are automatically placed on a temporary deny list for fifteen
  minutes.【F:gigvora-backend-nodejs/src/security/webApplicationFirewall.js†L57-L87】【F:gigvora-backend-nodejs/src/security/webApplicationFirewall.js†L188-L214】
- **Recent block audit.** Every block entry is serialised with a reference ID,
  request metadata, and matched rule identifiers so operators can correlate WAF
  actions with upstream logs.【F:gigvora-backend-nodejs/src/security/webApplicationFirewall.js†L98-L137】
- **Metrics registry.** The middleware increments counters for evaluated and
  blocked requests, tracks which rules fired, and records the last time an IP
  was blocked so dashboards can surface live perimeter health.【F:gigvora-backend-nodejs/src/security/webApplicationFirewall.js†L62-L94】

These metrics feed into the runtime dependency health snapshots surfaced at
`/health/ready` and the security operations dashboards exposed to platform
administrators.

## Operational Overrides

Runtime configuration allows operators to tailor the firewall without a
redeploy:

- Trusted or blocked IPs, custom user-agent patterns, and bespoke regex rules
  can be injected through persisted platform settings or environment overrides.
- Auto-block thresholds and TTLs are configurable so security teams can align
  enforcement with current incident posture.
- When the firewall is explicitly disabled, the middleware still records a
  telemetry event so that observability tooling highlights the reduced
  protection envelope.

Document updates and change management for the WAF should be recorded alongside
secret rotation events so operators always have an auditable view of the active
rule set.
