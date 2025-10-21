import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import IdentityStepNav from './IdentityStepNav.jsx';
import IdentityDetailsForm from './IdentityDetailsForm.jsx';
import IdentityDocumentsBoard from './IdentityDocumentsBoard.jsx';
import IdentityReviewBoard from './IdentityReviewBoard.jsx';
import DocumentPreviewDrawer from './DocumentPreviewDrawer.jsx';
import HistoryDrawer from './HistoryDrawer.jsx';
import { IDENTITY_STEPS } from './constants.js';
import { normaliseIso } from './utils.js';
import useSession from '../../hooks/useSession.js';
import useIdentityVerification from '../../hooks/useIdentityVerification.js';
import DataStatus from '../../components/DataStatus.jsx';
import { downloadIdentityDocument } from '../../services/identityVerification.js';

const INITIAL_FORM = {
  status: 'pending',
  verificationProvider: 'manual_review',
  typeOfId: '',
  idNumberLast4: '',
  issuingCountry: '',
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
  country: '',
  metadata: {},
};

const INITIAL_REVIEW = {
  status: 'in_review',
  reviewNotes: '',
  declinedReason: '',
};

function resolveFieldValue(values, field) {
  if (field.startsWith('metadata.')) {
    const key = field.split('.', 2)[1];
    return values.metadata?.[key] ?? '';
  }
  return values[field] ?? '';
}

export default function IdentityVerificationSection({ identityResource = null } = {}) {
  const { session } = useSession();
  const derivedUserId = session?.id ?? session?.userId ?? null;
  const derivedProfileId = session?.profileId ?? session?.primaryProfileId ?? session?.freelancerProfileId ?? null;

  const fallbackResource = useIdentityVerification({
    userId: derivedUserId,
    profileId: derivedProfileId,
    enabled: !identityResource && Boolean(derivedUserId),
  });

  const {
    data,
    loading,
    error,
    fromCache,
    lastUpdated,
    refresh,
    save,
    submit,
    review,
    uploadDocument,
    saveState,
    submitState,
    reviewState,
    uploadState,
  } = identityResource ?? fallbackResource;

  const [activeStep, setActiveStep] = useState(IDENTITY_STEPS[0].id);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [reviewForm, setReviewForm] = useState(INITIAL_REVIEW);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewState, setPreviewState] = useState({ open: false, doc: null, loading: false, data: null, error: null });

  useEffect(() => {
    if (!data?.current) {
      return;
    }
    const { current } = data;
    setFormValues((prev) => ({
      ...prev,
      status: current.status ?? prev.status ?? 'pending',
      verificationProvider: current.verificationProvider ?? prev.verificationProvider ?? 'manual_review',
      typeOfId: current.typeOfId ?? prev.typeOfId ?? '',
      idNumberLast4: current.idNumberLast4 ?? prev.idNumberLast4 ?? '',
      issuingCountry: current.issuingCountry ?? current.address?.country ?? prev.issuingCountry ?? '',
      issuedAt: normaliseIso(current.issuedAt) || prev.issuedAt || '',
      expiresAt: normaliseIso(current.expiresAt) || prev.expiresAt || '',
      documentFrontKey: current.documents?.front ?? prev.documentFrontKey ?? '',
      documentBackKey: current.documents?.back ?? prev.documentBackKey ?? '',
      selfieKey: current.documents?.selfie ?? prev.selfieKey ?? '',
      fullName: current.nameOnId ?? prev.fullName ?? '',
      dateOfBirth: normaliseIso(current.dateOfBirth) || prev.dateOfBirth || '',
      addressLine1: current.address?.line1 ?? prev.addressLine1 ?? '',
      addressLine2: current.address?.line2 ?? prev.addressLine2 ?? '',
      city: current.address?.city ?? prev.city ?? '',
      state: current.address?.state ?? prev.state ?? '',
      postalCode: current.address?.postalCode ?? prev.postalCode ?? '',
      country: current.address?.country ?? prev.country ?? '',
      metadata: { ...prev.metadata, ...(current.metadata ?? {}) },
    }));
    setReviewForm({
      status: current.status && ['verified', 'rejected', 'expired'].includes(current.status) ? current.status : 'in_review',
      reviewNotes: current.reviewNotes ?? '',
      declinedReason: current.declinedReason ?? '',
    });
  }, [data]);

  const handleFieldChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMetadataChange = (key, value) => {
    setFormValues((prev) => ({
      ...prev,
      metadata: {
        ...(prev.metadata ?? {}),
        [key]: value,
      },
    }));
  };

  const handleDocumentUpload = async (field, file) => {
    try {
      const result = await uploadDocument(file, { actorId: derivedUserId });
      if (!result?.key) {
        return;
      }
      if (field.startsWith('metadata.')) {
        const [, key] = field.split('.', 2);
        handleMetadataChange(key, result.key);
      } else {
        handleFieldChange(field, result.key);
      }
    } catch (uploadError) {
      // eslint-disable-next-line no-console
      console.error('Failed to upload identity document', uploadError);
    }
  };

  const handleReviewFieldChange = (field, value) => {
    setReviewForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    await save({ ...formValues, status: formValues.status ?? data?.current?.status ?? 'pending' });
  };

  const handleSubmit = async () => {
    await submit({ ...formValues, status: 'submitted' });
    setActiveStep('review');
  };

  const handleReview = async () => {
    if (!data?.userId || !data?.profileId || !session?.id) {
      return;
    }
    await review({
      ...reviewForm,
      userId: data.userId,
      profileId: data.profileId,
      reviewerId: session.id,
    });
  };

  const openPreview = async (doc) => {
    const key = resolveFieldValue(formValues, doc.field);
    if (!key) {
      return;
    }
    setPreviewState({
      open: true,
      doc: { label: doc.label, key },
      loading: true,
      data: null,
      error: null,
    });
    try {
      const payload = await downloadIdentityDocument({ key });
      setPreviewState((prev) => ({
        ...prev,
        loading: false,
        data: payload,
        error: null,
      }));
    } catch (previewError) {
      setPreviewState((prev) => ({
        ...prev,
        loading: false,
        error: previewError,
      }));
    }
  };

  const closePreview = () => {
    setPreviewState({ open: false, doc: null, loading: false, data: null, error: null });
  };

  const submissionReady = useMemo(() => {
    const requiredFields = [
      'fullName',
      'dateOfBirth',
      'typeOfId',
      'issuingCountry',
      'addressLine1',
      'city',
      'postalCode',
      'country',
      'documentFrontKey',
      'selfieKey',
    ];
    return requiredFields.every((field) => {
      const value = resolveFieldValue(formValues, field);
      return Boolean(value && `${value}`.trim().length);
    });
  }, [formValues]);

  const idOptions = data?.requirements?.acceptedIdTypes ?? [];
  const countryOptions = data?.requirements?.acceptedIssuingCountries ?? [];
  const canSubmit = Boolean(data?.capabilities?.canSubmit);
  const canReview = Boolean(data?.capabilities?.canReview);
  const allowedStatuses = data?.allowedStatuses ?? [];

  const isSaving = saveState?.status === 'saving';
  const isSubmitting = submitState?.status === 'submitting';

  const saveError = saveState?.error ?? null;
  const submitError = submitState?.error ?? null;

  const activeContent = (() => {
    switch (activeStep) {
      case 'documents':
        return (
          <IdentityDocumentsBoard
            formValues={formValues}
            metadata={formValues.metadata}
            onFieldChange={handleFieldChange}
            onMetadataChange={handleMetadataChange}
            onUpload={handleDocumentUpload}
            onPreview={openPreview}
            uploadState={uploadState}
          />
        );
      case 'review':
        return (
          <IdentityReviewBoard
            snapshot={data?.current}
            reviewForm={reviewForm}
            onReviewFieldChange={handleReviewFieldChange}
            onReview={handleReview}
            reviewState={reviewState}
            canReview={canReview}
            allowedStatuses={allowedStatuses}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        );
      case 'details':
      default:
        return (
          <IdentityDetailsForm
            values={formValues}
            onFieldChange={handleFieldChange}
            idOptions={idOptions}
            countryOptions={countryOptions}
          />
        );
    }
  })();

  return (
    <div
      data-testid="identity-verification"
      className="rounded-[40px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-10 shadow-xl"
    >
      <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
        <IdentityStepNav
          activeStep={activeStep}
          onSelect={setActiveStep}
          status={data?.current?.status}
          nextActions={data?.nextActions ?? []}
          onOpenHistory={() => setHistoryOpen(true)}
        />
        <div className="min-h-[520px] space-y-8">
          {activeContent}
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <DataStatus
          loading={loading}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          error={error}
          onRefresh={() => refresh({ force: true })}
          statusLabel="Live sync"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || loading}
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || !submissionReady || isSubmitting}
            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {saveError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-600">{saveError.message}</p>
        ) : null}
        {submitError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-600">{submitError.message}</p>
        ) : null}
      </div>
      <DocumentPreviewDrawer
        open={previewState.open}
        onClose={closePreview}
        document={{
          label: previewState.doc?.label,
          key: previewState.data?.key ?? previewState.doc?.key,
          fileName: previewState.data?.fileName ?? previewState.doc?.fileName,
          data: previewState.data?.data ?? null,
          contentType: previewState.data?.contentType ?? null,
          loading: previewState.loading,
          error: previewState.error,
        }}
      />
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} history={data?.history ?? []} />
    </div>
  );
}

IdentityVerificationSection.propTypes = {
  identityResource: PropTypes.shape({
    data: PropTypes.object,
    loading: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.object]),
    fromCache: PropTypes.bool,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    refresh: PropTypes.func,
    save: PropTypes.func,
    submit: PropTypes.func,
    review: PropTypes.func,
    uploadDocument: PropTypes.func,
    saveState: PropTypes.object,
    submitState: PropTypes.object,
    reviewState: PropTypes.object,
    uploadState: PropTypes.object,
  }),
};

