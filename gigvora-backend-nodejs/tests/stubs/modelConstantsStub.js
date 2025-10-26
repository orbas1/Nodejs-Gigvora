export const ESCROW_INTEGRATION_PROVIDERS = ['stripe', 'escrow_com'];
export const AD_OBJECTIVES = ['brand', 'acquisition', 'retention'];
export const MENTOR_AVAILABILITY_STATUSES = ['available', 'limited'];
export const MENTOR_AVAILABILITY_DAYS = ['monday', 'tuesday', 'wednesday'];
export const MENTOR_PRICE_TIERS = ['tier_entry', 'tier_growth'];
export const DISPUTE_STATUSES = ['open', 'awaiting_customer', 'under_review', 'settled'];
export const DISPUTE_STAGES = ['intake', 'mediation', 'arbitration', 'resolved'];
export const DISPUTE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const DISPUTE_ACTION_TYPES = ['comment', 'evidence_upload', 'deadline_adjusted', 'stage_advanced', 'status_change'];
export const DISPUTE_ACTOR_TYPES = ['customer', 'provider', 'mediator', 'admin', 'system'];
export const DISPUTE_REASON_CODES = ['quality_issue', 'scope_disagreement', 'communication_breakdown'];

export default {
  ESCROW_INTEGRATION_PROVIDERS,
  AD_OBJECTIVES,
  MENTOR_AVAILABILITY_STATUSES,
  MENTOR_AVAILABILITY_DAYS,
  MENTOR_PRICE_TIERS,
  DISPUTE_STATUSES,
  DISPUTE_STAGES,
  DISPUTE_PRIORITIES,
  DISPUTE_ACTION_TYPES,
  DISPUTE_ACTOR_TYPES,
  DISPUTE_REASON_CODES,
};
