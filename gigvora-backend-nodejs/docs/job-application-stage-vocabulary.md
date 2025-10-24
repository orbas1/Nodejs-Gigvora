# Job Application Stage Vocabulary

Gigvora candidate workspaces share a consistent set of stages for tracking job applications. These stages map directly to the
values returned by the `getJobApplicationWorkspace` service and power UI badges, analytics, and automations.

| Status Key     | Label         | Description |
| -------------- | ------------- | ----------- |
| `draft`        | Draft         | Opportunities captured for later without triggering reminders or analytics. |
| `submitted`    | Submitted     | Applications formally sent to employers and awaiting acknowledgement. |
| `under_review` | Under Review  | Hiring teams are actively reviewing your profile, resume, and supporting material. |
| `shortlisted`  | Shortlisted   | You are on a shortlist for next steps such as interviews or assessments. |
| `interview`    | Interview     | Interviews are scheduled or in progress for this opportunity. |
| `offered`      | Offered       | An offer has been extended and may require negotiation or acceptance tracking. |
| `hired`        | Hired         | The opportunity has been won and onboarding or start-date coordination is underway. |
| `rejected`     | Rejected      | The employer has indicated you will not be progressing for this role. |
| `withdrawn`    | Withdrawn     | You have withdrawn or the role has been closed before completion. |

## Usage Guidance

- The stage vocabulary is exported in the `stageVocabulary` field of the workspace payload so frontends can present consistent
  tooltips and helper copy alongside status badges.
- Notes captured on applications, favourites, interviews, or responses should be concise (1-2 sentences) and align with the
  stage descriptions to keep candidate journeys clear for future you or your mentors.
- When introducing new stages, update the shared vocabulary in `jobApplicationService` and reflect the change here so analytics
  dashboards, automations, and docs stay in sync.
