import { useCallback, useMemo, useState } from 'react';
import useSession from './useSession.js';
import useCachedResource from './useCachedResource.js';
import {
  fetchIdentityVerification,
  saveIdentityVerification as saveIdentityVerificationRequest,
  submitIdentityVerification as submitIdentityVerificationRequest,
  reviewIdentityVerification as reviewIdentityVerificationRequest,
  uploadIdentityDocument as uploadIdentityDocumentRequest,
} from '../services/identityVerification.js';

const FALLBACK_IDENTITY = {
  userId: null,
  profileId: null,
  current: {
    status: 'pending',
    submitted: false,
    complianceFlags: ['missing_identity_verification'],
    note: 'Identity verification not yet submitted.',
    documents: { front: null, back: null, selfie: null },
    typeOfId: null,
    nameOnId: null,
    idNumberLast4: null,
    dateOfBirth: null,
    address: {
      line1: null,
      line2: null,
      city: null,
      state: null,
      postalCode: null,
      country: null,
    },
    issuingCountry: null,
    issuedAt: null,
    expiresAt: null,
    submittedAt: null,
    reviewedAt: null,
    reviewerId: null,
    reviewNotes: null,
    declinedReason: null,
    lastUpdated: null,
    metadata: null,
  },
  history: [],
  requirements: {
    acceptedIdTypes: [],
    acceptedIssuingCountries: [],
    requiredDocuments: [],
    reviewSlaHours: 48,
    supportContact: { email: 'trust@gigvora.com' },
  },
  capabilities: {
    canUploadDocuments: true,
    canSubmit: true,
    canReview: false,
  },
  allowedStatuses: ['pending', 'submitted', 'in_review', 'verified', 'rejected', 'expired'],
  nextActions: [],
  lastUpdated: null,
};

function normaliseRoles(session) {
  if (!session) {
    return [];
  }
  const roles = new Set();
  const add = (value) => {
    if (!value) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => add(entry));
      return;
    }
    const normalised = `${value}`.trim().toLowerCase();
    if (normalised) {
      roles.add(normalised);
    }
  };
  add(session.memberships);
  add(session.accountTypes);
  add(session.role);
  add(session.workspace?.role);
  add(session.primaryDashboard);
  return Array.from(roles);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

export default function useIdentityVerification({ userId, profileId, enabled = true } = {}) {
  const { session } = useSession();
  const derivedUserId = userId ?? session?.id ?? session?.userId ?? session?.profileId ?? null;
  const derivedProfileId = profileId ?? session?.profileId ?? session?.primaryProfileId ?? session?.freelancerProfileId ?? null;
  const actorRoles = useMemo(() => normaliseRoles(session), [session]);
  const cacheKey = useMemo(() => `freelancer:identity:${derivedUserId ?? 'guest'}`, [derivedUserId]);
  const [saveState, setSaveState] = useState({ status: 'idle', error: null });
  const [submitState, setSubmitState] = useState({ status: 'idle', error: null });
  const [reviewState, setReviewState] = useState({ status: 'idle', error: null });
  const [uploadState, setUploadState] = useState({ status: 'idle', error: null });

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!derivedUserId) {
        return FALLBACK_IDENTITY;
      }
      try {
        const payload = await fetchIdentityVerification({
          userId: derivedUserId,
          profileId: derivedProfileId,
          includeHistory: true,
          actorRoles,
          signal,
        });
        return payload ?? FALLBACK_IDENTITY;
      } catch (error) {
        if (signal?.aborted) {
          return FALLBACK_IDENTITY;
        }
        throw error;
      }
    },
    [actorRoles, derivedProfileId, derivedUserId],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: enabled !== false,
    dependencies: [cacheKey, derivedProfileId, actorRoles.join(':')],
    ttl: 1000 * 45,
  });

  const refresh = resource.refresh;

  const save = useCallback(
    async (values) => {
      if (!derivedUserId || !derivedProfileId) {
        throw new Error('Identity verification context is not available.');
      }
      setSaveState({ status: 'saving', error: null });
      try {
        const response = await saveIdentityVerificationRequest({
          ...values,
          userId: derivedUserId,
          profileId: derivedProfileId,
          actorRoles,
        });
        await refresh({ force: true });
        setSaveState({ status: 'success', error: null });
        return response;
      } catch (error) {
        setSaveState({ status: 'error', error });
        throw error;
      }
    },
    [actorRoles, derivedProfileId, derivedUserId, refresh],
  );

  const submit = useCallback(
    async (values) => {
      if (!derivedUserId || !derivedProfileId) {
        throw new Error('Identity verification context is not available.');
      }
      setSubmitState({ status: 'submitting', error: null });
      try {
        const response = await submitIdentityVerificationRequest({
          ...values,
          userId: derivedUserId,
          profileId: derivedProfileId,
          actorRoles,
        });
        await refresh({ force: true });
        setSubmitState({ status: 'success', error: null });
        return response;
      } catch (error) {
        setSubmitState({ status: 'error', error });
        throw error;
      }
    },
    [actorRoles, derivedProfileId, derivedUserId, refresh],
  );

  const review = useCallback(
    async (values) => {
      setReviewState({ status: 'reviewing', error: null });
      try {
        const response = await reviewIdentityVerificationRequest({
          ...values,
          actorRoles,
        });
        await refresh({ force: true });
        setReviewState({ status: 'success', error: null });
        return response;
      } catch (error) {
        setReviewState({ status: 'error', error });
        throw error;
      }
    },
    [actorRoles, refresh],
  );

  const uploadDocument = useCallback(
    async (file, { actorId, fileName, contentType } = {}) => {
      if (!file) {
        throw new Error('A file is required to upload identity evidence.');
      }
      setUploadState({ status: 'uploading', error: null });
      try {
        const payload = await fileToBase64(file);
        const response = await uploadIdentityDocumentRequest({
          data: payload,
          fileName: fileName ?? file.name,
          contentType: contentType ?? file.type ?? 'application/octet-stream',
          actorId: actorId ?? derivedUserId ?? undefined,
        });
        setUploadState({ status: 'success', error: null });
        return response;
      } catch (error) {
        setUploadState({ status: 'error', error });
        throw error;
      }
    },
    [derivedUserId],
  );

  return {
    ...resource,
    data: resource.data ?? FALLBACK_IDENTITY,
    save,
    submit,
    review,
    uploadDocument,
    saveState,
    submitState,
    reviewState,
    uploadState,
  };
}
