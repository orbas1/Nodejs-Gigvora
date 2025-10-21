import { deepFreeze } from './menuSchema.js';

export const GIG_ORDER_STATUSES = deepFreeze([
  { value: 'requirements', label: 'Requirements' },
  { value: 'in_delivery', label: 'In delivery' },
  { value: 'in_revision', label: 'In revision' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]);

export const GIG_ACTIVITY_TYPES = deepFreeze([
  { value: 'order', label: 'Order event' },
  { value: 'requirement', label: 'Requirement' },
  { value: 'revision', label: 'Revision' },
  { value: 'payout', label: 'Payout' },
  { value: 'communication', label: 'Communication' },
  { value: 'note', label: 'Note' },
  { value: 'system', label: 'System' },
]);

export const GIG_ESCROW_STATUSES = deepFreeze([
  { value: 'funded', label: 'Funded' },
  { value: 'pending_release', label: 'Pending release' },
  { value: 'released', label: 'Released' },
  { value: 'held', label: 'Held' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'cancelled', label: 'Cancelled' },
]);

export default {
  GIG_ORDER_STATUSES,
  GIG_ACTIVITY_TYPES,
  GIG_ESCROW_STATUSES,
};
