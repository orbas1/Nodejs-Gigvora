export const POST_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

export const APPLICATION_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In review' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'placed', label: 'Placed' },
  { value: 'declined', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export const RESPONSE_TYPES = [
  { value: 'message', label: 'Message' },
  { value: 'note', label: 'Internal note' },
  { value: 'status_update', label: 'Status update' },
];

export const RESPONSE_VISIBILITY = [
  { value: 'internal', label: 'Internal only' },
  { value: 'candidate', label: 'Shared with candidate' },
];

export const INTERVIEW_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-show' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

export const CONTRACT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const CONTRACT_TYPES = [
  { value: 'fixed_term', label: 'Fixed-term' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'event', label: 'Event-based' },
];
