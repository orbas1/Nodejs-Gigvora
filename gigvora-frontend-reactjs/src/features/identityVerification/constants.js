export const STATUS_TONES = {
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-sky-100 text-sky-700 border-sky-200',
  in_review: 'bg-amber-100 text-amber-700 border-amber-200',
  verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  expired: 'bg-slate-200 text-slate-700 border-slate-300',
};

export const IDENTITY_STEPS = [
  { id: 'details', label: 'Profile' },
  { id: 'documents', label: 'Files' },
  { id: 'review', label: 'Status' },
];

export const DOCUMENT_FIELDS = [
  {
    id: 'front',
    label: 'Front',
    field: 'documentFrontKey',
    helper: 'Front of ID',
    accept: 'image/*,application/pdf',
  },
  {
    id: 'back',
    label: 'Back',
    field: 'documentBackKey',
    helper: 'Back of ID',
    accept: 'image/*,application/pdf',
  },
  {
    id: 'selfie',
    label: 'Selfie',
    field: 'selfieKey',
    helper: 'Live selfie',
    accept: 'image/*',
  },
  {
    id: 'address',
    label: 'Address',
    field: 'metadata.addressProofKey',
    helper: 'Proof of address',
    accept: 'image/*,application/pdf',
  },
];
