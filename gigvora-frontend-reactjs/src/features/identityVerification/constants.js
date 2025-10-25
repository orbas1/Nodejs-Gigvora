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
