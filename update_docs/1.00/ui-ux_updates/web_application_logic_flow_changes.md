# Web Application Logic Flow Updates

- Documented the operator workflow: authenticate ➜ request ops token ➜ open Operations Console ➜ stream readiness metrics ➜
  trigger configuration reload or maintenance notice ➜ confirm via audit trail.
- Added sequence diagram linking frontend SSE client, `/health/ready` endpoint, and lifecycle event bus to highlight correlation
  ID propagation.
- Specified fallback UX when SSE disconnects: display cached snapshot with timestamp, show reconnection countdown, and allow
  manual refresh.
