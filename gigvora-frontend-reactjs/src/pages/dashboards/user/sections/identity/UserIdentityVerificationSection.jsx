import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useIdentityVerification from '../../../../../hooks/useIdentityVerification.js';
import { IdentityVerificationSection, StatusBadge } from '../../../../../features/identityVerification/index.js';
import { formatAbsolute, formatRelativeTime } from '../../../../../utils/date.js';

function formatList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'None listed';
  }
  return items
    .filter(Boolean)
    .map((item) => (typeof item === 'string' ? item : item?.label ?? item?.name))
    .filter(Boolean)
    .join(', ');
}

export default function UserIdentityVerificationSection() {
  const identity = useIdentityVerification();
  const { data, lastUpdated } = identity;
  const current = data?.current ?? {};
  const requirements = data?.requirements ?? {};
  const rawNextActions = data?.nextActions;
  const nextActions = useMemo(() => (Array.isArray(rawNextActions) ? rawNextActions : []), [rawNextActions]);
  const requiredDocuments = useMemo(
    () => (Array.isArray(requirements.requiredDocuments) ? requirements.requiredDocuments : []),
    [requirements.requiredDocuments],
  );

  const actionSummary = useMemo(() => {
    if (!nextActions.length) {
      return 'No immediate tasks';
    }
    const actionable = nextActions.find((action) => action?.status !== 'done');
    if (!actionable) {
      return 'All steps complete';
    }
    return actionable?.label ?? actionable?.name ?? 'Review pending steps';
  }, [nextActions]);

  const complianceNotes = current?.note ?? current?.reviewNotes ?? '';
  const status = current?.status ?? 'pending';
  const lastUpdatedLabel = lastUpdated ? formatRelativeTime(lastUpdated) : 'Not yet synced';
  const lastUpdatedExact = lastUpdated ? formatAbsolute(lastUpdated) : null;
  const nextReview = current?.nextReviewAt ? formatAbsolute(current.nextReviewAt) : 'Not scheduled';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Verify your identity</h2>
          <p className="text-sm text-slate-600">
            Upload your official documents and selfie to unlock contracts, payments, and marketplace trust signals.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              {actionSummary}
            </span>
            <span className="rounded-full bg-slate-50 px-3 py-1" title={lastUpdatedExact ?? undefined}>
              Last synced {lastUpdatedLabel}
            </span>
            <span className="rounded-full bg-slate-50 px-3 py-1">Next review {nextReview}</span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm">
          <StatusBadge status={status} />
          <p className="max-w-xs text-xs text-slate-500">
            {complianceNotes || 'Keep your verification current so clients can trust and engage quickly.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/trust-center"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              View policy
            </Link>
            <Link
              to="/dashboard/user/profile"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Open profile hub
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Documents we need</h3>
          <p className="text-xs text-slate-500">
            Provide clear images or PDFs. Make sure details are readable and match your profile information.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {requiredDocuments.length ? (
              requiredDocuments.map((document) => (
                <li key={document?.id ?? document} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                  <span>
                    {document?.label ?? document?.name ?? document}
                    {document?.helper ? (
                      <span className="block text-xs text-slate-400">{document.helper}</span>
                    ) : null}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500">No documents requested yet.</li>
            )}
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Review checklist</h3>
          <p className="text-xs text-slate-500">
            Double-check the essentials before submitting to avoid delays. Team reviewers follow the same list.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
              <span>Full legal name matches your ID and profile details.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
              <span>Documents are current and within expiry dates.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
              <span>Selfie clearly shows your face without obstructions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
              <span>Address proof displays your current residence and issue date.</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-slate-500">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden="true" />
              <span>Accepted ID types: {formatList(requirements.acceptedIdTypes)}</span>
            </li>
          </ul>
        </div>
      </div>

      <IdentityVerificationSection identityResource={identity} />

      <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Need a hand?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Our compliance team reviews submissions in {requirements.reviewSlaHours ?? 48} hours. Chat with support if you need a
          manual update or have already uploaded fresh documents.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
          <Link
            to="/inbox"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Message support
          </Link>
          <Link
            to="/dashboard/user/settings"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-700"
          >
            Update account info
          </Link>
        </div>
      </div>
    </div>
  );
}
