# Settings Structure – Web Application v1.50

## Top-level Sections
1. **Workspace** – organisation profile, locations, branding assets.
2. **Billing & Plans** – subscription management, invoices, payment methods.
3. **Compliance** – document uploads, verification status, audit logs.
4. **Integrations** – connected apps, API keys, webhooks.
5. **Notifications** – email, SMS, in-app preferences.
6. **Security** – password, 2FA, session management, device approvals.

## Navigation Pattern
- Secondary sidebar within settings for quick navigation; shows completion badges where actions pending.
- Breadcrumb updates to `Settings / Section / Subsection` with inline search.

## Page Templates
- Each section uses consistent header with description, primary CTA (e.g., "Add payment method"), and support link.
- Content area uses cards with forms or tables; save actions anchored bottom-right with sticky bar.

## Permissions
- Only admins see Billing, Compliance, Security.
- Managers can access Integrations and Notifications.
- Display read-only states for restricted users with upgrade prompts.

## Support & Help
- Embed contextual help links and quick connect to account manager for enterprise accounts.
- Provide audit trail view within Compliance to download or share logs.
