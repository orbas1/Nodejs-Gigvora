import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { EnvelopeIcon, ExclamationCircleIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const RECIPIENT_TYPES = [
  { value: 'vendor', label: 'Vendor' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'employee', label: 'Employee' },
  { value: 'agency', label: 'Agency' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'paused', label: 'Paused' },
];

function resolveErrorMessage(error) {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.body?.message) {
    return error.body.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Unable to save payout method. Please try again.';
}

function PayoutMethodForm({ initialValue = {}, onSubmit, onCancel, busy, error }) {
  const [formState, setFormState] = useState({
    recipientName: initialValue.recipientName ?? '',
    recipientType: initialValue.recipientType ?? 'vendor',
    status: initialValue.status ?? 'active',
    email: initialValue.email ?? '',
    countryCode: initialValue.countryCode ?? '',
    currencyCode: initialValue.currencyCode ?? 'USD',
    isDefault: Boolean(initialValue.isDefault),
    referenceId: initialValue.referenceId ?? '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.recipientName.trim()) {
      return;
    }
    onSubmit?.({
      recipientName: formState.recipientName.trim(),
      recipientType: formState.recipientType,
      status: formState.status,
      email: formState.email?.trim() || undefined,
      countryCode: formState.countryCode?.trim().toUpperCase() || undefined,
      currencyCode: formState.currencyCode?.trim().toUpperCase() || undefined,
      isDefault: Boolean(formState.isDefault),
      referenceId: formState.referenceId?.trim() || undefined,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="payout-name" className="text-sm font-semibold text-slate-700">
            Recipient name
          </label>
          <input
            id="payout-name"
            type="text"
            required
            value={formState.recipientName}
            onChange={(event) => setFormState((prev) => ({ ...prev, recipientName: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label htmlFor="payout-type" className="text-sm font-semibold text-slate-700">
            Recipient type
          </label>
          <select
            id="payout-type"
            value={formState.recipientType}
            onChange={(event) => setFormState((prev) => ({ ...prev, recipientType: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {RECIPIENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="payout-status" className="text-sm font-semibold text-slate-700">
            Status
          </label>
          <select
            id="payout-status"
            value={formState.status}
            onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input
            id="payout-default"
            type="checkbox"
            checked={formState.isDefault}
            onChange={(event) => setFormState((prev) => ({ ...prev, isDefault: event.target.checked }))}
            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <label htmlFor="payout-default" className="text-sm font-semibold text-slate-700">
            Default payout method
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="payout-email" className="text-sm font-semibold text-slate-700">
            Contact email
          </label>
          <input
            id="payout-email"
            type="email"
            value={formState.email}
            onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="payouts@example.com"
          />
        </div>
        <div>
          <label htmlFor="payout-reference" className="text-sm font-semibold text-slate-700">
            External reference
          </label>
          <input
            id="payout-reference"
            type="text"
            value={formState.referenceId}
            onChange={(event) => setFormState((prev) => ({ ...prev, referenceId: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Vendor#1234"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="payout-country" className="text-sm font-semibold text-slate-700">
            Country code
          </label>
          <input
            id="payout-country"
            type="text"
            maxLength={2}
            value={formState.countryCode}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, countryCode: event.target.value.toUpperCase() }))
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="US"
          />
        </div>
        <div>
          <label htmlFor="payout-currency" className="text-sm font-semibold text-slate-700">
            Currency
          </label>
          <input
            id="payout-currency"
            type="text"
            maxLength={3}
            value={formState.currencyCode}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm uppercase text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="USD"
          />
        </div>
      </div>

      {error ? (
        <div className="inline-flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs text-rose-600/80">{error}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => onCancel?.()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save method'}
        </button>
      </div>
    </form>
  );
}

export default function WalletPayoutMethodsPanel({ payoutMethods, onCreate, onUpdate }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editMethod, setEditMethod] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const methods = useMemo(() => payoutMethods ?? [], [payoutMethods]);

  const handleCreate = async (payload) => {
    if (!onCreate) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(payload);
      setCreateOpen(false);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!onUpdate || !editMethod) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdate(editMethod.id, payload);
      setEditMethod(null);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Payouts</h3>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {methods.map((method) => (
          <div key={method.id ?? method.recipientName} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-white p-3 text-accent shadow">
                  <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{method.recipientName}</p>
                  <p className="mt-1 text-xs text-slate-500">{method.recipientType?.replace(/_/g, ' ') || 'Recipient'}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  method.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : method.status === 'paused'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {method.status ?? 'pending'}
              </span>
            </div>

            <dl className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">Email</dt>
                <dd className="mt-1">{method.email || '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Country</dt>
                <dd className="mt-1">{method.countryCode || '—'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Currency</dt>
                <dd className="mt-1">{method.currencyCode || 'USD'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Reference</dt>
                <dd className="mt-1">{method.referenceId || '—'}</dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-slate-600 shadow-sm">
                <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                {method.isDefault ? 'Default payout' : 'Optional'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEditMethod(method);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
        {!methods.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
            <p className="font-semibold text-slate-700">No payouts yet</p>
          </div>
        ) : null}
      </div>

      <Transition.Root show={createOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => (busy ? null : setCreateOpen(false))}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-2xl rounded-4xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Add payout</Dialog.Title>
                  <div className="mt-6">
                    <PayoutMethodForm
                      onSubmit={handleCreate}
                      onCancel={() => setCreateOpen(false)}
                      busy={busy}
                      error={error}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={Boolean(editMethod)} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => (busy ? null : setEditMethod(null))}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-2xl rounded-4xl bg-white p-6 shadow-2xl">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Edit payout</Dialog.Title>
                  <div className="mt-6">
                    <PayoutMethodForm
                      initialValue={editMethod}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditMethod(null)}
                      busy={busy}
                      error={error}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </section>
  );
}
