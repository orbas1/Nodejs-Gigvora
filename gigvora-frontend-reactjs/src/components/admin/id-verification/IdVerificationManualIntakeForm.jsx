import { useState } from 'react';

function safeTrim(value) {
  return `${value ?? ''}`.trim();
}

const DEFAULT_FORM = {
  userId: '',
  profileId: '',
  fullName: '',
  dateOfBirth: '',
  verificationProvider: 'manual_review',
  typeOfId: '',
  idNumberLast4: '',
  issuingCountry: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export default function IdVerificationManualIntakeForm({ onCreate, busy = false, variant = 'card' }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleChange = (field) => (event) => {
    const value = event?.target?.value;
    setForm((previous) => ({ ...previous, [field]: value }));
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    const requiredFields = [
      form.userId,
      form.profileId,
      form.fullName,
      form.dateOfBirth,
      form.addressLine1,
      form.city,
      form.postalCode,
      form.country,
    ];
    if (requiredFields.some((value) => !`${value ?? ''}`.trim())) {
      setErrorMessage('Complete all required fields.');
      return;
    }
    const sanitized = {
      userId: Number(safeTrim(form.userId)),
      profileId: Number(safeTrim(form.profileId)),
      fullName: safeTrim(form.fullName),
      dateOfBirth: safeTrim(form.dateOfBirth),
      verificationProvider: safeTrim(form.verificationProvider) || 'manual_review',
      typeOfId: safeTrim(form.typeOfId) || undefined,
      idNumberLast4: safeTrim(form.idNumberLast4) || undefined,
      issuingCountry: safeTrim(form.issuingCountry).toUpperCase() || undefined,
      addressLine1: safeTrim(form.addressLine1),
      addressLine2: safeTrim(form.addressLine2) || undefined,
      city: safeTrim(form.city),
      state: safeTrim(form.state) || undefined,
      postalCode: safeTrim(form.postalCode),
      country: safeTrim(form.country).toUpperCase(),
    };
    if (!Number.isFinite(sanitized.userId) || !Number.isFinite(sanitized.profileId)) {
      setErrorMessage('User and profile IDs must be numbers.');
      return;
    }
    try {
      await onCreate?.(sanitized);
      setForm(DEFAULT_FORM);
      setStatusMessage('Verification created and queued');
    } catch (error) {
      console.error(error);
      setErrorMessage(error?.message ?? 'Unable to create verification record.');
    }
  };

  const Wrapper = variant === 'card' ? 'section' : 'div';
  const wrapperProps =
    variant === 'card'
      ? { id: 'idv-intake', className: 'space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8' }
      : { className: 'space-y-4' };

  return (
    <Wrapper {...wrapperProps}>
      {variant === 'card' ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Manual intake</h2>
          <p className="text-sm text-slate-600">Create a verification record manually.</p>
        </div>
      ) : null}
      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="User ID" required>
            <input
              type="number"
              min="1"
              value={form.userId}
              onChange={handleChange('userId')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="Profile ID" required>
            <input
              type="number"
              min="1"
              value={form.profileId}
              onChange={handleChange('profileId')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="Full name" required>
            <input
              type="text"
              value={form.fullName}
              onChange={handleChange('fullName')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="Date of birth" required>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="Verification provider">
            <input
              type="text"
              value={form.verificationProvider}
              onChange={handleChange('verificationProvider')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="manual_review"
            />
          </Field>
          <Field label="Type of ID">
            <input
              type="text"
              value={form.typeOfId}
              onChange={handleChange('typeOfId')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="ID last 4 digits">
            <input
              type="text"
              maxLength={16}
              value={form.idNumberLast4}
              onChange={handleChange('idNumberLast4')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="Issuing country">
            <input
              type="text"
              maxLength={4}
              value={form.issuingCountry}
              onChange={handleChange('issuingCountry')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase tracking-wide text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              aria-label="Issuing country code"
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Address line 1" required>
            <input
              type="text"
              value={form.addressLine1}
              onChange={handleChange('addressLine1')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="Address line 2">
            <input
              type="text"
              value={form.addressLine2}
              onChange={handleChange('addressLine2')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="City" required>
            <input
              type="text"
              value={form.city}
              onChange={handleChange('city')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="State / region">
            <input
              type="text"
              value={form.state}
              onChange={handleChange('state')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="Postal code" required>
            <input
              type="text"
              value={form.postalCode}
              onChange={handleChange('postalCode')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </Field>
          <Field label="Country" required>
            <input
              type="text"
              maxLength={4}
              value={form.country}
              onChange={handleChange('country')}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase tracking-wide text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              aria-label="Residence country code"
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Creating…' : 'Create verification'}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(DEFAULT_FORM);
              setStatusMessage(null);
              setErrorMessage(null);
            }}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </form>
    </Wrapper>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
