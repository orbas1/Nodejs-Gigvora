## Profile Engagement Module
- Added new Sequelize models (`ProfileAppreciation`, `ProfileFollower`, `ProfileEngagementJob`) and queue orchestration helpers powering automated likes/followers aggregation for profiles.
- Worker loop with exponential backoff now runs from `server.js`, updating `profiles.engagementRefreshedAt` while keeping tests deterministic via skipped startup in `NODE_ENV=test`.
