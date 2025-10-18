export const DISPUTE_STAGE_OPTIONS = [
  { value: 'intake', label: 'Intake review' },
  { value: 'mediation', label: 'Mediation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'resolved', label: 'Resolved' },
];

export const DISPUTE_STATUS_OPTIONS = [
  { value: 'open', label: 'Open - awaiting triage' },
  { value: 'awaiting_customer', label: 'Waiting for customer' },
  { value: 'under_review', label: 'Under review' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
];

export const DISPUTE_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export const DISPUTE_ACTION_OPTIONS = [
  { value: 'comment', label: 'Comment / update' },
  { value: 'evidence_upload', label: 'Evidence upload' },
  { value: 'deadline_adjusted', label: 'Deadline adjusted' },
  { value: 'stage_advanced', label: 'Stage advanced' },
  { value: 'status_change', label: 'Status change' },
  { value: 'system_notice', label: 'System notice' },
];

export const DISPUTE_REASON_CODES = [
  { value: 'quality_issue', label: 'Quality concern', description: 'Customer disputes the quality or completeness of the deliverable.' },
  { value: 'missed_deadline', label: 'Missed deadline', description: 'Deliverable was late or project milestones were missed.' },
  { value: 'scope_disagreement', label: 'Scope disagreement', description: 'Customer and provider disagree on scope or inclusions.' },
  { value: 'billing_error', label: 'Billing error', description: 'Incorrect invoice amount, duplicate charge, or payment error.' },
  { value: 'fraud_concern', label: 'Fraud or policy concern', description: 'Potential fraud, impersonation, or policy breach.' },
  { value: 'other', label: 'Other', description: 'Use notes to specify the dispute reason.' },
];

export const DISPUTE_TRANSACTION_RESOLUTIONS = [
  { value: 'none', label: 'No fund movement' },
  { value: 'release', label: 'Release funds to provider' },
  { value: 'refund', label: 'Refund customer' },
];

export const DISPUTE_SORT_FIELDS = [
  { value: 'updatedAt', label: 'Last activity' },
  { value: 'openedAt', label: 'Date opened' },
  { value: 'priority', label: 'Priority' },
  { value: 'stage', label: 'Stage' },
  { value: 'status', label: 'Status' },
  { value: 'amount', label: 'Escrow amount' },
  { value: 'reference', label: 'Escrow reference' },
];

export const DISPUTE_SORT_DIRECTIONS = [
  { value: 'DESC', label: 'Descending' },
  { value: 'ASC', label: 'Ascending' },
];

export function findDisputeOption(options, value) {
  if (!Array.isArray(options)) {
    return null;
  }
  return options.find((option) => option.value === value) ?? null;
}

export default {
  DISPUTE_STAGE_OPTIONS,
  DISPUTE_STATUS_OPTIONS,
  DISPUTE_PRIORITY_OPTIONS,
  DISPUTE_ACTION_OPTIONS,
  DISPUTE_REASON_CODES,
  DISPUTE_TRANSACTION_RESOLUTIONS,
  DISPUTE_SORT_FIELDS,
  DISPUTE_SORT_DIRECTIONS,
};
