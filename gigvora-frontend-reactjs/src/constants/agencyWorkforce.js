export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'vendor', label: 'Vendor partner' },
];

export const MEMBER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'offboarded', label: 'Offboarded' },
];

export const PAY_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'milestone', label: 'Per milestone' },
];

export const PAY_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'processing', label: 'Processing' },
  { value: 'sent', label: 'Sent' },
  { value: 'paused', label: 'Paused' },
];

export const ASSIGNMENT_TYPES = [
  { value: 'project', label: 'Client project' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'internal', label: 'Internal initiative' },
];

export const ASSIGNMENT_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
];

export const GIG_STATUSES = [
  { value: 'briefing', label: 'Briefing' },
  { value: 'in_delivery', label: 'In delivery' },
  { value: 'review', label: 'In review' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On hold' },
];

export const AVAILABILITY_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'partial', label: 'Partially booked' },
  { value: 'unavailable', label: 'Fully booked' },
  { value: 'on_leave', label: 'On leave' },
];

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
