## Handler Changes

- Extended the domain registry snapshot emitter to attach integrity metadata (version, checksum, expiry) so deployment handlers can verify provenance before refreshing cached context maps.
- Updated the feature flag ingestion handler to persist assignment payloads, access control metadata, and guard-rail definitions, guaranteeing the enriched schema reaches downstream evaluators without manual migrations.
