# Settings Experience – Web Application Version 1.00

## Layout
- Tabs across top: `Account`, `Security`, `Notifications`, `Billing`, `Integrations`.
- Content area 2-column layout: form column (min 640px) + contextual panel (min 320px) with tips.
- Sticky sub-navigation on scroll with indicator showing active section.

## Forms
- Use design tokens defined in `Forms.md`.
- Each tab has summary card at top with status (e.g., MFA enabled) using status banner colours.

## Security Tab
- Sections: Password, Multi-factor authentication, Active sessions.
- MFA card includes QR code area 200×200px, step list, confirm input.
- Active sessions table: device, location, last seen, `End session` button (destructive outline).

## Notifications Tab
- Toggle groups for email, SMS, in-app. Use `Toggle` component height 24px handle 20px.
- Provide digest frequency dropdown (Daily, Weekly, Monthly).
- Include preview card showing sample notification layout.

## Billing Tab
- Card summarising plan, usage metrics, renewal date.
- Payment method card with brand icon (Visa/Mastercard). Buttons `Update card`, `Download invoice`.
- Usage chart uses `recharts` line chart height 240px.

## Integrations
- List of available integrations (Slack, Teams, Jira). Each card includes logo 48px, description, status tag.
- Connect button uses secondary style; when connected show status `Connected` with check icon.

## Accessibility
- Provide `aria-live` for save confirmation banners.
- Use `aria-describedby` for security copy ("We encrypt your credentials...").

## Data States
- Loading skeletons for each tab.
- Empty states encourage setup ("No integrations connected yet. Connect Slack to automate alerts.").

## Analytics
- Log changes via `web.v1.settings.<tab>.update`. Include metadata such as changed fields.
