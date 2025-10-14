# Dummy Data Requirements — Application v1.50

## Purpose
Provide realistic sample data sets for prototyping, usability testing, and staging environments ensuring accurate representation of user scenarios without exposing sensitive information.

## Data Domains
1. **Providers & Teams**
   - Provider profiles with name, avatar, skills, certifications, ratings, availability, compliance status.
   - Team structures including roles (Admin, Coordinator, Specialist), regions, and permissions.
2. **Gigs & Requests**
   - Gig records with service type, location, schedule, pricing, status (lead, proposal, booked, in-progress, completed).
   - Request metadata (preferred provider, budget range, requirements, attachments).
3. **Messages**
   - Conversation threads with timestamps, participants, message types (text, attachment, system events), read receipts.
4. **Financial Data**
   - Payout schedules, invoice records, transactions, disputes, tax forms.
5. **Analytics Metrics**
   - KPI values, trend data, utilisation rates, funnel conversions.
6. **Support & Alerts**
   - Alert feed entries, SLA breaches, compliance notices, automation logs.

## Data Volume Targets
- Providers: 60 sample profiles with varied regions and service categories.
- Gigs: 250 records covering multiple statuses and service types.
- Messages: 40 threads with realistic lengths and attachments.
- Financial: 12 months of payout history, 30 disputes with outcomes.
- Analytics: 6 months of weekly metrics per key indicator.

## Privacy & Compliance
- Use generated names and addresses (no real customer data).
- Ensure attachments are placeholders (e.g., blurred documents) with no personal information.
- Obfuscate emails, phone numbers, and IDs using consistent but non-realistic formats.
- Document data generation scripts and storage locations.

## Maintenance Strategy
- Version dummy data in repository with semantic versioning (`dummy-data/v1.50.x`).
- Automate refresh via scripts run pre-release to align with schema changes.
- Provide changelog summarising updates to data sets.

## Usage Guidelines
- Tag dummy data clearly in UI (e.g., banner on staging) to avoid confusion with production.
- Provide toggles to switch between scenario sets (e.g., enterprise provider vs. solo provider).
- Ensure data supports edge cases (zero metrics, high load, compliance flags).

## Tools & Scripts
- Use Faker.js / Mockaroo for data generation.
- Store assets in `/assets/dummy/` with CDN fallback for web prototypes.
- Provide JSON and CSV exports for engineering to seed local environments.

## Validation
- Run automated tests verifying data matches schema requirements.
- Conduct manual review to confirm realism and scenario coverage.
- Update documentation when new modules introduce additional data needs.
