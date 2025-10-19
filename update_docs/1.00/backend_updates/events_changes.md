## Events & Scheduling Changes

- Enabled websocket-driven event scheduling by exposing `/events` namespace hooks that validate payloads, persist `UserEvent` records, and broadcast announcements to subscribed clients.
