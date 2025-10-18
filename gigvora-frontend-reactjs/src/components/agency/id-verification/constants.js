export const STATUS_LABELS = {
  pending: 'Waiting',
  submitted: 'Submitted',
  in_review: 'In review',
  verified: 'Verified',
  rejected: 'Declined',
  expired: 'Expired',
};

export const RISK_LABELS = {
  low: 'Low',
  moderate: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const VERIFICATION_PROVIDERS = [
  { value: 'manual_review', label: 'Manual' },
  { value: 'persona', label: 'Persona' },
  { value: 'onfido', label: 'Onfido' },
  { value: 'sumsub', label: 'Sumsub' },
  { value: 'stripe_identity', label: 'Stripe' },
];

export const DEFAULT_FILTERS = {
  status: [],
  riskLevel: [],
  requiresManualReview: null,
  requiresReverification: null,
  search: '',
};

export const DEFAULT_CREATE_FORM = {
  userId: '',
  profileId: '',
  workspaceId: '',
  status: 'submitted',
  verificationProvider: 'manual_review',
  typeOfId: 'passport',
  idNumberLast4: '',
  issuingCountry: 'US',
  issuedAt: '',
  expiresAt: '',
  documentFrontKey: '',
  documentBackKey: '',
  selfieKey: '',
  fullName: '',
  dateOfBirth: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  reviewNotes: '',
  declinedReason: '',
  reviewerId: '',
  assignedReviewerId: '',
  riskLevel: 'low',
  riskScore: '',
  requiresManualReview: true,
  requiresReverification: false,
  nextReviewAt: '',
  reverificationIntervalDays: '',
  autoReverificationChannel: '',
  assignmentNotes: '',
  tags: '',
  escalationState: '',
  lastReminderSentAt: '',
  escalatedAt: '',
  metadata: '',
};

export const DEFAULT_SETTINGS_FORM = {
  automationEnabled: false,
  requireSelfie: true,
  autoAssignReviewerId: '',
  manualReviewThreshold: 650,
  reminderCadenceHours: 72,
  reminderChannels: 'email',
  escalateAfterHours: 120,
  allowedDocumentTypes: 'passport,driver_license,national_id',
  autoArchiveAfterDays: 730,
  autoReminderTemplateKey: '',
  allowProvisionalPass: false,
};

export const DEFAULT_NOTE_FORM = {
  eventType: 'note',
  notes: '',
  riskLevel: '',
  toStatus: '',
  attachments: '',
};
