## Storage Updates

- Implemented tiered storage policies with per-role buckets (public media, confidential compliance, analytics exports) backed by retention schedules and automated purge jobs enforced by the storage management service.
- Added encryption-at-rest defaults for all object stores, enabling server-side encryption with customer-managed keys and auditing every key rotation event.
- Delivered resumable upload support with chunk integrity verification, malware scanning hooks, and quarantine workflow for flagged files prior to publication.
- Optimised CDN caching headers and signed URL expirations to balance performance and security; media APIs now issue URLs scoped to the requesting persona with single-use tokens for sensitive assets.
- Documented storage disaster recovery: nightly replication to cold storage, checksum verification, and restore runbooks ensuring recovery point objectives remain under five minutes for mission-critical assets.
