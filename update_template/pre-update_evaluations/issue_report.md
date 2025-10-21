# Issue Report — ISS-139-003 Credential Storage Encryption

## Summary
During pre-update evaluation we identified that the provider credential storage bucket lacked object-level encryption and detailed access logging, creating compliance risk for sensitive documents.

## Impact Assessment
- **Affected Components:** Credential upload service, provider onboarding flow, admin review tooling.
- **Risk Level:** Medium — potential non-compliance with SOC2/ISO27001 controls and exposure to data exfiltration if IAM compromised.
- **Customer Impact:** No evidence of breach, but audit trail insufficient for external assessments.

## Root Cause
Legacy infrastructure template created before enforcement of KMS-encrypted buckets. Migration backlog not prioritised once credential uploads stabilised.

## Resolution
1. Provisioned new KMS-encrypted bucket with mandatory TLS and bucket-level logging.
2. Implemented signed URL issuance using minimum privilege IAM roles.
3. Migrated historical documents using server-side encryption with customer-managed keys.
4. Added Datadog monitor to alert on ACL changes or access anomalies.

## Validation
- Performed checksum comparison before/after migration; zero mismatches recorded.
- Ran automated upload/download regression tests across supported file types (JPG, PNG, PDF <10MB).
- Security team validated encryption-at-rest controls and access logs meet compliance requirements.

## Follow-up Actions
- Include bucket encryption verification in quarterly security checklist.
- Document migration steps in runbook for future reference.
- Align incident response playbook to reference new logging location.

## Status
**Resolved** on 25 Oct 2024. No further action required beyond scheduled audits.
