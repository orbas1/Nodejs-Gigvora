import statusTaxonomy from '@shared-contracts/domain/common/statuses.json';
import { normaliseStatusKey, formatStatusLabel } from './format.js';

const STATUS_TAXONOMY = Object.freeze(statusTaxonomy);

const STATUS_TRANSLATION_NAMESPACES = Object.freeze({
  generic: 'status',
  identityVerification: 'status.identity',
  corporateVerification: 'status.corporate',
  qualificationCredential: 'status.qualification',
  walletAccount: 'status.wallet.account',
  walletLedgerEntry: 'status.wallet.ledger',
  adCampaign: 'status.campaign',
  calendarEvent: 'status.calendar',
  mentoringSession: 'status.mentoring',
  review: 'status.review',
  supportCase: 'status.support',
  runtime: 'status.runtime',
  sync: 'status.sync',
  reference: 'status.reference',
  readiness: 'status.readiness',
});

const GENERIC_APPEARANCE = Object.freeze({
  unknown: { tone: 'slate', variant: 'outline' },
  draft: { tone: 'slate', variant: 'tint' },
  preview: { tone: 'indigo', variant: 'tint' },
  planned: { tone: 'slate', variant: 'outline' },
  tentative: { tone: 'amber', variant: 'outline' },
  confirmed: { tone: 'blue', variant: 'outline' },
  submitted: { tone: 'indigo', variant: 'outline' },
  scheduled: { tone: 'indigo', variant: 'tint' },
  in_progress: { tone: 'blue', variant: 'tint' },
  processing: { tone: 'blue', variant: 'tint' },
  running: { tone: 'blue', variant: 'tint' },
  active: { tone: 'emerald', variant: 'outline' },
  live: { tone: 'emerald', variant: 'tint' },
  published: { tone: 'emerald', variant: 'tint' },
  completed: { tone: 'emerald', variant: 'outline' },
  delivered: { tone: 'emerald', variant: 'outline' },
  success: { tone: 'emerald', variant: 'outline' },
  resolved: { tone: 'emerald', variant: 'outline' },
  available: { tone: 'emerald', variant: 'outline' },
  awaiting: { tone: 'amber', variant: 'outline' },
  pending: { tone: 'amber', variant: 'outline' },
  queued: { tone: 'amber', variant: 'outline' },
  requested: { tone: 'amber', variant: 'outline' },
  review: { tone: 'amber', variant: 'tint' },
  reviewing: { tone: 'amber', variant: 'tint' },
  in_review: { tone: 'amber', variant: 'outline' },
  paused: { tone: 'amber', variant: 'outline' },
  on_hold: { tone: 'amber', variant: 'outline' },
  requires_update: { tone: 'amber', variant: 'outline' },
  needs_attention: { tone: 'amber', variant: 'outline' },
  at_risk: { tone: 'amber', variant: 'outline' },
  watch: { tone: 'amber', variant: 'outline' },
  warning: { tone: 'amber', variant: 'outline' },
  blocked: { tone: 'rose', variant: 'outline' },
  declined: { tone: 'rose', variant: 'outline' },
  rejected: { tone: 'rose', variant: 'outline' },
  failed: { tone: 'rose', variant: 'outline' },
  cancelled: { tone: 'rose', variant: 'outline' },
  canceled: { tone: 'rose', variant: 'outline' },
  expired: { tone: 'rose', variant: 'outline' },
  suspended: { tone: 'rose', variant: 'outline' },
  archived: { tone: 'slate', variant: 'tint' },
  closed: { tone: 'slate', variant: 'outline' },
  error: { tone: 'rose', variant: 'outline' },
  escalated: { tone: 'rose', variant: 'outline' },
  new: { tone: 'blue', variant: 'outline' },
  open: { tone: 'blue', variant: 'outline' },
  no_show: { tone: 'rose', variant: 'outline' },
  checked_in: { tone: 'blue', variant: 'outline' },
  checked_out: { tone: 'slate', variant: 'outline' },
  registered: { tone: 'blue', variant: 'outline' },
  waitlisted: { tone: 'amber', variant: 'outline' },
  engaged: { tone: 'emerald', variant: 'outline' },
  contacted: { tone: 'blue', variant: 'outline' },
  in_delivery: { tone: 'blue', variant: 'tint' },
  in_moderation: { tone: 'amber', variant: 'outline' },
  flagged: { tone: 'rose', variant: 'outline' },
  recalled: { tone: 'amber', variant: 'outline' },
  acknowledged: { tone: 'blue', variant: 'outline' },
  sent: { tone: 'blue', variant: 'outline' },
  approved: { tone: 'emerald', variant: 'outline' },
  invited: { tone: 'indigo', variant: 'outline' },
  accepted: { tone: 'emerald', variant: 'outline' },
  awarded: { tone: 'emerald', variant: 'outline' },
  funded: { tone: 'emerald', variant: 'outline' },
  released: { tone: 'emerald', variant: 'outline' },
  monitoring: { tone: 'indigo', variant: 'outline' },
  needs_review: { tone: 'amber', variant: 'outline' },
  processing_payment: { tone: 'blue', variant: 'tint' },
  payment_requested: { tone: 'amber', variant: 'outline' },
  triage: { tone: 'blue', variant: 'outline' },
  waiting_on_customer: { tone: 'amber', variant: 'outline' },
  healthy: { tone: 'emerald', variant: 'outline' },
  degraded: { tone: 'amber', variant: 'outline' },
  maintenance: { tone: 'indigo', variant: 'tint' },
  updating: { tone: 'blue', variant: 'tint' },
  outage: { tone: 'rose', variant: 'solid' },
  connected: { tone: 'emerald', variant: 'outline' },
  syncing: { tone: 'blue', variant: 'tint' },
  in_sync: { tone: 'emerald', variant: 'outline' },
  out_of_sync: { tone: 'rose', variant: 'outline' },
  disconnected: { tone: 'rose', variant: 'outline' },
  credit: { tone: 'emerald', variant: 'outline' },
  debit: { tone: 'rose', variant: 'outline' },
  hold: { tone: 'amber', variant: 'outline' },
  release: { tone: 'emerald', variant: 'outline' },
  adjustment: { tone: 'indigo', variant: 'outline' },
  unverified: { tone: 'slate', variant: 'outline' },
  pending_review: { tone: 'amber', variant: 'outline' },
  verified: { tone: 'emerald', variant: 'solid' },
});

const DOMAIN_APPEARANCE = Object.freeze({
  identityVerification: Object.freeze({
    submitted: { tone: 'indigo', variant: 'outline' },
    in_review: { tone: 'amber', variant: 'outline' },
    verified: { tone: 'emerald', variant: 'solid' },
    rejected: { tone: 'rose', variant: 'solid' },
    expired: { tone: 'slate', variant: 'outline' },
  }),
  corporateVerification: Object.freeze({
    verified: { tone: 'emerald', variant: 'solid' },
    requires_update: { tone: 'amber', variant: 'outline' },
    suspended: { tone: 'rose', variant: 'solid' },
  }),
  qualificationCredential: Object.freeze({
    unverified: { tone: 'slate', variant: 'outline' },
    pending_review: { tone: 'amber', variant: 'outline' },
    verified: { tone: 'emerald', variant: 'solid' },
    rejected: { tone: 'rose', variant: 'outline' },
  }),
  walletAccount: Object.freeze({
    pending: { tone: 'amber', variant: 'outline' },
    active: { tone: 'emerald', variant: 'solid' },
    suspended: { tone: 'rose', variant: 'outline' },
    closed: { tone: 'slate', variant: 'outline' },
  }),
  walletLedgerEntry: Object.freeze({
    credit: { tone: 'emerald', variant: 'outline' },
    debit: { tone: 'rose', variant: 'outline' },
    hold: { tone: 'amber', variant: 'outline' },
    release: { tone: 'emerald', variant: 'outline' },
    adjustment: { tone: 'indigo', variant: 'outline' },
  }),
  adCampaign: Object.freeze({
    draft: { tone: 'slate', variant: 'tint' },
    running: { tone: 'blue', variant: 'tint' },
    active: { tone: 'emerald', variant: 'solid' },
    paused: { tone: 'amber', variant: 'outline' },
    completed: { tone: 'emerald', variant: 'outline' },
    cancelled: { tone: 'rose', variant: 'outline' },
    archived: { tone: 'slate', variant: 'outline' },
    expired: { tone: 'slate', variant: 'outline' },
  }),
  calendarEvent: Object.freeze({
    planned: { tone: 'slate', variant: 'outline' },
    tentative: { tone: 'amber', variant: 'outline' },
    confirmed: { tone: 'blue', variant: 'outline' },
    in_progress: { tone: 'blue', variant: 'tint' },
    completed: { tone: 'emerald', variant: 'outline' },
    cancelled: { tone: 'rose', variant: 'outline' },
  }),
  mentoringSession: Object.freeze({
    requested: { tone: 'amber', variant: 'outline' },
    scheduled: { tone: 'blue', variant: 'outline' },
    in_progress: { tone: 'blue', variant: 'tint' },
    completed: { tone: 'emerald', variant: 'outline' },
    cancelled: { tone: 'rose', variant: 'outline' },
    no_show: { tone: 'rose', variant: 'outline' },
  }),
  review: Object.freeze({
    draft: { tone: 'slate', variant: 'tint' },
    pending: { tone: 'amber', variant: 'outline' },
    in_moderation: { tone: 'amber', variant: 'outline' },
    published: { tone: 'emerald', variant: 'outline' },
    recalled: { tone: 'amber', variant: 'outline' },
    archived: { tone: 'slate', variant: 'outline' },
  }),
  supportCase: Object.freeze({
    triage: { tone: 'blue', variant: 'outline' },
    in_progress: { tone: 'blue', variant: 'tint' },
    waiting_on_customer: { tone: 'amber', variant: 'outline' },
    resolved: { tone: 'emerald', variant: 'outline' },
    closed: { tone: 'slate', variant: 'outline' },
    escalated: { tone: 'rose', variant: 'outline' },
  }),
  runtime: Object.freeze({
    healthy: { tone: 'emerald', variant: 'solid' },
    degraded: { tone: 'amber', variant: 'outline' },
    maintenance: { tone: 'indigo', variant: 'tint' },
    updating: { tone: 'blue', variant: 'tint' },
    outage: { tone: 'rose', variant: 'solid' },
    unknown: { tone: 'slate', variant: 'outline' },
  }),
  sync: Object.freeze({
    connected: { tone: 'emerald', variant: 'solid' },
    syncing: { tone: 'blue', variant: 'tint' },
    in_sync: { tone: 'emerald', variant: 'outline' },
    out_of_sync: { tone: 'rose', variant: 'outline' },
    error: { tone: 'rose', variant: 'outline' },
    disconnected: { tone: 'rose', variant: 'outline' },
    needs_attention: { tone: 'amber', variant: 'outline' },
  }),
  reference: Object.freeze({
    published: { tone: 'emerald', variant: 'outline' },
    verified: { tone: 'emerald', variant: 'solid' },
    pending_verification: { tone: 'amber', variant: 'outline' },
    awaiting_feedback: { tone: 'blue', variant: 'outline' },
    draft: { tone: 'slate', variant: 'tint' },
    declined: { tone: 'rose', variant: 'outline' },
  }),
  readiness: Object.freeze({
    healthy: { tone: 'emerald', variant: 'outline' },
    watch: { tone: 'amber', variant: 'outline' },
    at_risk: { tone: 'rose', variant: 'outline' },
    unknown: { tone: 'slate', variant: 'outline' },
  }),
});

export const STATUS_APPEARANCES = Object.freeze({
  generic: GENERIC_APPEARANCE,
  ...DOMAIN_APPEARANCE,
});

const DOMAIN_LABELS = Object.freeze({
  identityVerification: Object.freeze({
    pending: 'Pending verification',
    submitted: 'Submitted',
    in_review: 'Under review',
    verified: 'Verified',
    rejected: 'Rejected',
    expired: 'Expired',
  }),
  corporateVerification: Object.freeze({
    pending: 'Pending review',
    submitted: 'Submitted',
    in_review: 'Under review',
    verified: 'Verified',
    rejected: 'Rejected',
    requires_update: 'Requires update',
    suspended: 'Suspended',
  }),
  qualificationCredential: Object.freeze({
    unverified: 'Unverified',
    pending_review: 'Pending review',
    verified: 'Verified',
    rejected: 'Rejected',
  }),
  walletAccount: Object.freeze({
    pending: 'Pending activation',
    active: 'Active',
    suspended: 'Suspended',
    closed: 'Closed',
  }),
  walletLedgerEntry: Object.freeze({
    credit: 'Credit',
    debit: 'Debit',
    hold: 'Hold',
    release: 'Release',
    adjustment: 'Adjustment',
  }),
  adCampaign: Object.freeze({
    draft: 'Draft',
    scheduled: 'Scheduled',
    running: 'Running',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
    archived: 'Archived',
    expired: 'Expired',
  }),
  calendarEvent: Object.freeze({
    planned: 'Planned',
    tentative: 'Tentative',
    confirmed: 'Confirmed',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }),
  mentoringSession: Object.freeze({
    requested: 'Requested',
    scheduled: 'Scheduled',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No-show',
  }),
  review: Object.freeze({
    draft: 'Draft',
    pending: 'Queued',
    in_moderation: 'In moderation',
    published: 'Published',
    recalled: 'Recalled',
    archived: 'Archived',
  }),
  supportCase: Object.freeze({
    triage: 'Triage',
    in_progress: 'In progress',
    waiting_on_customer: 'Waiting on customer',
    resolved: 'Resolved',
    closed: 'Closed',
    escalated: 'Escalated',
  }),
  runtime: Object.freeze({
    healthy: 'Healthy',
    degraded: 'Degraded',
    maintenance: 'Maintenance',
    updating: 'Updating',
    outage: 'Outage',
    unknown: 'Unknown',
  }),
  sync: Object.freeze({
    connected: 'Connected',
    syncing: 'Syncing',
    in_sync: 'In sync',
    out_of_sync: 'Out of sync',
    error: 'Error',
    disconnected: 'Disconnected',
    needs_attention: 'Needs attention',
  }),
  reference: Object.freeze({
    published: 'Published',
    verified: 'Verified',
    pending_verification: 'Pending verification',
    awaiting_feedback: 'Awaiting feedback',
    draft: 'Draft',
    declined: 'Declined',
  }),
  readiness: Object.freeze({
    healthy: 'Healthy',
    watch: 'Watch',
    at_risk: 'At risk',
    unknown: 'Unknown',
  }),
});

const KEYWORD_RULES = [
  { pattern: /(success|complete|resolved|verified|delivered|released|funded|active|healthy|in_sync|connected)/, tone: 'emerald', variant: 'outline' },
  { pattern: /(running|process|progress|confirm|schedule|submit|acknowledge|monitor|sync|update|review)/, tone: 'blue', variant: 'tint' },
  { pattern: /(pending|await|queue|request|draft|tentative|hold|watch|need|open|new|register|waitlist)/, tone: 'amber', variant: 'outline' },
  { pattern: /(warning|risk|attention|flag|degrad|moderation)/, tone: 'amber', variant: 'outline' },
  { pattern: /(fail|error|decline|reject|cancel|block|suspend|outage|disconnect|no_show|expired|closed)/, tone: 'rose', variant: 'outline' },
  { pattern: /(archive|unknown|none)/, tone: 'slate', variant: 'outline' },
];

function deriveAppearanceFromKeyword(statusKey) {
  if (!statusKey) {
    return { tone: 'slate', variant: 'outline' };
  }
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(statusKey)) {
      return { tone: rule.tone, variant: rule.variant };
    }
  }
  return { tone: 'slate', variant: 'outline' };
}

export function getStatusNamespace(category) {
  if (category && STATUS_TRANSLATION_NAMESPACES[category]) {
    return STATUS_TRANSLATION_NAMESPACES[category];
  }
  return STATUS_TRANSLATION_NAMESPACES.generic;
}

export function resolveStatusAppearance(category, status) {
  const statusKey = normaliseStatusKey(status);
  const domainMap = category ? DOMAIN_APPEARANCE[category] : null;
  const domainAppearance = domainMap?.[statusKey];
  if (domainAppearance) {
    return domainAppearance;
  }
  const genericAppearance = GENERIC_APPEARANCE[statusKey];
  if (genericAppearance) {
    return genericAppearance;
  }
  return deriveAppearanceFromKeyword(statusKey);
}

export function buildStatusToneMap(category) {
  const statusKeys = new Set(
    [
      ...(STATUS_TAXONOMY.generic?.statuses ?? []),
      ...(category ? STATUS_TAXONOMY[category]?.statuses ?? [] : []),
    ].map((value) => normaliseStatusKey(value)),
  );
  const map = {};
  statusKeys.forEach((key) => {
    map[key] = resolveStatusAppearance(category, key);
  });
  return map;
}

export function isStatusKnown(category, status) {
  const key = normaliseStatusKey(status);
  if (!key) {
    return false;
  }
  const domainSet = new Set((STATUS_TAXONOMY[category]?.statuses ?? []).map(normaliseStatusKey));
  if (domainSet.has(key)) {
    return true;
  }
  return new Set((STATUS_TAXONOMY.generic?.statuses ?? []).map(normaliseStatusKey)).has(key);
}

export function describeStatus(category, status) {
  const key = normaliseStatusKey(status);
  const domainLabel = category ? DOMAIN_LABELS[category]?.[key] : undefined;
  const label = domainLabel ?? formatStatusLabel(status ?? key);
  const namespace = getStatusNamespace(category);
  return { key, label, namespace };
}

export default {
  STATUS_TAXONOMY,
  STATUS_APPEARANCES,
  STATUS_TRANSLATION_NAMESPACES,
  getStatusNamespace,
  resolveStatusAppearance,
  buildStatusToneMap,
  isStatusKnown,
  describeStatus,
};
