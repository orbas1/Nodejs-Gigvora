import { deepFreeze } from './menuSchema.js';

const employmentTypes = deepFreeze([
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'vendor', label: 'Vendor partner' },
]);

const memberStatuses = deepFreeze([
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'offboarded', label: 'Offboarded' },
]);

const payFrequencies = deepFreeze([
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'milestone', label: 'Per milestone' },
]);

const payStatuses = deepFreeze([
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'processing', label: 'Processing' },
  { value: 'sent', label: 'Sent' },
  { value: 'paused', label: 'Paused' },
]);

const assignmentTypes = deepFreeze([
  { value: 'project', label: 'Client project' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'internal', label: 'Internal initiative' },
]);

const assignmentStatuses = deepFreeze([
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
]);

const gigStatuses = deepFreeze([
  { value: 'briefing', label: 'Briefing' },
  { value: 'in_delivery', label: 'In delivery' },
  { value: 'review', label: 'In review' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
]);

const availabilityStatuses = deepFreeze([
  { value: 'available', label: 'Available' },
  { value: 'partial', label: 'Partially booked' },
  { value: 'unavailable', label: 'Fully booked' },
  { value: 'on_leave', label: 'On leave' },
]);

export const EMPLOYMENT_TYPES = employmentTypes;
export const MEMBER_STATUSES = memberStatuses;
export const PAY_FREQUENCIES = payFrequencies;
export const PAY_STATUSES = payStatuses;
export const ASSIGNMENT_TYPES = assignmentTypes;
export const ASSIGNMENT_STATUSES = assignmentStatuses;
export const GIG_STATUSES = gigStatuses;
export const AVAILABILITY_STATUSES = availabilityStatuses;

export function resolveOptionLabel(options, value, fallback = value) {
  if (value == null) {
    return fallback ?? '';
  }
  const match = options.find((option) => option.value === value);
  return match ? match.label : fallback ?? value;
}

export default {
  EMPLOYMENT_TYPES,
  MEMBER_STATUSES,
  PAY_FREQUENCIES,
  PAY_STATUSES,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_STATUSES,
  GIG_STATUSES,
  AVAILABILITY_STATUSES,
  resolveOptionLabel,
};
