import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { XMarkIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS_DEFAULT = ['submitted', 'pending', 'in_review'];

function buildInitialForm() {
  return {
    userId: '',
    profileId: '',
    status: 'submitted',
    reviewerId: '',
    verificationProvider: 'manual_review',
    typeOfId: '',
    idNumberLast4: '',
    issuingCountry: '',
    issuedAt: '',
    expiresAt: '',
    fullName: '',
    dateOfBirth: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    documentFrontKey: '',
    documentBackKey: '',
    selfieKey: '',
    reviewNotes: '',
    metadataInput: '{\n  "source": "workspace"\n}',
    notes: '',
  };
}

export default function IdVerificationRequestModal({
  open,
  workspaceId,
  memberOptions = [],
  reviewerOptions = [],
  statusOptions = STATUS_OPTIONS_DEFAULT,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(buildInitialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm());
      setError(null);
    }
  }, [open]);

  const statuses = useMemo(() => (statusOptions.length ? statusOptions : STATUS_OPTIONS_DEFAULT), [statusOptions]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleMemberChange(event) {
    const value = event.target.value;
    const numeric = value ? Number(value) : '';
    const selected = memberOptions.find((member) => member.userId === numeric);
    setForm((previous) => ({
      ...previous,
      userId: numeric,
      profileId: selected?.profileId ?? previous.profileId ?? '',
      fullName: selected?.name ?? previous.fullName ?? '',
      verificationProvider: previous.verificationProvider ?? 'manual_review',
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!onSubmit) {
      return;
    }
    if (!form.userId) {
      setError('Select a workspace member to verify.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let metadata = undefined;
      if (form.metadataInput) {
        try {
          metadata = JSON.parse(form.metadataInput);
        } catch (parseError) {
          throw new Error('Metadata must be valid JSON.');
        }
      }

      const payload = {
        workspaceId,
        userId: Number(form.userId),
        profileId: form.profileId ? Number(form.profileId) : undefined,
        status: form.status,
        reviewerId: form.reviewerId ? Number(form.reviewerId) : undefined,
        verificationProvider: form.verificationProvider,
        typeOfId: form.typeOfId,
        idNumberLast4: form.idNumberLast4,
        issuingCountry: form.issuingCountry,
        issuedAt: form.issuedAt ? new Date(form.issuedAt).toISOString() : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        documentFrontKey: form.documentFrontKey,
        documentBackKey: form.documentBackKey,
        selfieKey: form.selfieKey,
        reviewNotes: form.reviewNotes,
        metadata,
        notes: form.notes,
      };

      await onSubmit(payload);
      setSaving(false);
      onClose?.();
    } catch (err) {
      setError(err.message ?? 'Unable to create verification.');
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/40" onClick={saving ? undefined : onClose} aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">New ID check</p>
              <h2 className="text-xl font-semibold text-slate-900">Add ID details</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Person</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="userId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Workspace member
                  </label>
                  <select
                    id="userId"
                    name="userId"
                    value={form.userId}
                    onChange={handleMemberChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select member</option>
                    {memberOptions.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name ?? member.email ?? `Member ${member.userId}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="profileId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Profile ID
                  </label>
                  <input
                    id="profileId"
                    name="profileId"
                    value={form.profileId}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Review</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="reviewerId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Reviewer (optional)
                  </label>
                  <select
                    id="reviewerId"
                    name="reviewerId"
                    value={form.reviewerId}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Unassigned</option>
                    {reviewerOptions.map((reviewer) => (
                      <option key={reviewer.userId} value={reviewer.userId}>
                        {reviewer.name ?? reviewer.email ?? `Member ${reviewer.userId}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="reviewNotes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes for reviewer
                </label>
                <textarea
                  id="reviewNotes"
                  name="reviewNotes"
                  value={form.reviewNotes}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Context for manual review"
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Document</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="typeOfId" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Document type
                  </label>
                  <input
                    id="typeOfId"
                    name="typeOfId"
                    value={form.typeOfId}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Passport, National ID…"
                  />
                </div>
                <div>
                  <label htmlFor="idNumberLast4" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    ID last 4
                  </label>
                  <input
                    id="idNumberLast4"
                    name="idNumberLast4"
                    value={form.idNumberLast4}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label htmlFor="issuingCountry" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Issuing country
                  </label>
                  <input
                    id="issuingCountry"
                    name="issuingCountry"
                    value={form.issuingCountry}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="US"
                  />
                </div>
                <div>
                  <label htmlFor="verificationProvider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Provider
                  </label>
                  <input
                    id="verificationProvider"
                    name="verificationProvider"
                    value={form.verificationProvider}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label htmlFor="issuedAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Issued at
                  </label>
                  <input
                    type="date"
                    id="issuedAt"
                    name="issuedAt"
                    value={form.issuedAt}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label htmlFor="expiresAt" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Expires at
                  </label>
                  <input
                    type="date"
                    id="expiresAt"
                    name="expiresAt"
                    value={form.expiresAt}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Full name on ID
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Address</h3>
              <div className="grid gap-4">
                <div>
                  <label htmlFor="addressLine1" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Address line 1
                  </label>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label htmlFor="addressLine2" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Address line 2
                  </label>
                  <input
                    id="addressLine2"
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="city" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      State / region
                    </label>
                    <input
                      id="state"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="postalCode" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Postal code
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Files</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="documentFrontKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Front document key
                  </label>
                  <input
                    id="documentFrontKey"
                    name="documentFrontKey"
                    value={form.documentFrontKey}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label htmlFor="documentBackKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Back document key
                  </label>
                  <input
                    id="documentBackKey"
                    name="documentBackKey"
                    value={form.documentBackKey}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label htmlFor="selfieKey" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Selfie key
                  </label>
                  <input
                    id="selfieKey"
                    name="selfieKey"
                    value={form.selfieKey}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h3>
              <textarea
                id="metadataInput"
                name="metadataInput"
                value={form.metadataInput}
                onChange={handleChange}
                rows={6}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                spellCheck={false}
              />
              <div>
                <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Submission note (sent to reviewer)
                </label>
                <input
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </section>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? 'Submitting…' : 'Submit verification'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

IdVerificationRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  memberOptions: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      profileId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      email: PropTypes.string,
    }),
  ),
  reviewerOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  statusOptions: PropTypes.arrayOf(PropTypes.string),
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

IdVerificationRequestModal.defaultProps = {
  workspaceId: null,
  memberOptions: [],
  reviewerOptions: [],
  statusOptions: STATUS_OPTIONS_DEFAULT,
  onClose: undefined,
  onSubmit: undefined,
};
