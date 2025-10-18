import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationCircleIcon, PlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'retired', label: 'Retired' },
];

const INTERVAL_OPTIONS = [
  { value: 'per_transaction', label: 'Per transaction' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
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
  return 'Unable to save the spending policy. Please try again.';
}

function PolicyForm({ initialValue = {}, onSubmit, onCancel, busy, error }) {
  const [formState, setFormState] = useState({
    policyName: initialValue.policyName ?? '',
    category: initialValue.category ?? '',
    status: initialValue.status ?? 'active',
    limitAmount: initialValue.limitAmount != null ? `${initialValue.limitAmount}` : '',
    limitInterval: initialValue.limitInterval ?? 'monthly',
    approvalRequired: initialValue.approvalRequired ?? true,
    approverRole: initialValue.approverRole ?? 'manager',
    enforcedFrom: initialValue.enforcedFrom ? initialValue.enforcedFrom.slice(0, 10) : '',
    enforcedTo: initialValue.enforcedTo ? initialValue.enforcedTo.slice(0, 10) : '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState.policyName.trim()) {
      return;
    }
    onSubmit?.({
      policyName: formState.policyName.trim(),
      category: formState.category?.trim() || undefined,
      status: formState.status,
      limitAmount: formState.limitAmount !== '' ? formState.limitAmount : undefined,
      limitInterval: formState.limitInterval,
      approvalRequired: Boolean(formState.approvalRequired),
      approverRole: formState.approverRole?.trim() || undefined,
      enforcedFrom: formState.enforcedFrom || undefined,
      enforcedTo: formState.enforcedTo || undefined,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="policy-name" className="text-sm font-semibold text-slate-700">
            Policy name
          </label>
          <input
            id="policy-name"
            type="text"
            required
            value={formState.policyName}
            onChange={(event) => setFormState((prev) => ({ ...prev, policyName: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label htmlFor="policy-category" className="text-sm font-semibold text-slate-700">
            Expense category
          </label>
          <input
            id="policy-category"
            type="text"
            value={formState.category}
            onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="travel, marketing"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="policy-limit" className="text-sm font-semibold text-slate-700">
            Limit amount
          </label>
          <input
            id="policy-limit"
            type="number"
            step="0.01"
            min="0"
            value={formState.limitAmount}
            onChange={(event) => setFormState((prev) => ({ ...prev, limitAmount: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="5000"
          />
        </div>
        <div>
          <label htmlFor="policy-interval" className="text-sm font-semibold text-slate-700">
            Interval
          </label>
          <select
            id="policy-interval"
            value={formState.limitInterval}
            onChange={(event) => setFormState((prev) => ({ ...prev, limitInterval: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="policy-status" className="text-sm font-semibold text-slate-700">
            Status
          </label>
          <select
            id="policy-status"
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
            id="policy-approval"
            type="checkbox"
            checked={formState.approvalRequired}
            onChange={(event) => setFormState((prev) => ({ ...prev, approvalRequired: event.target.checked }))}
            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <label htmlFor="policy-approval" className="text-sm font-semibold text-slate-700">
            Approval required
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="policy-approver" className="text-sm font-semibold text-slate-700">
            Approver role
          </label>
          <input
            id="policy-approver"
            type="text"
            value={formState.approverRole}
            onChange={(event) => setFormState((prev) => ({ ...prev, approverRole: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="finance"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="policy-from" className="text-sm font-semibold text-slate-700">
              Enforced from
            </label>
            <input
              id="policy-from"
              type="date"
              value={formState.enforcedFrom}
              onChange={(event) => setFormState((prev) => ({ ...prev, enforcedFrom: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="policy-to" className="text-sm font-semibold text-slate-700">
              Enforced to
            </label>
            <input
              id="policy-to"
              type="date"
              value={formState.enforcedTo}
              onChange={(event) => setFormState((prev) => ({ ...prev, enforcedTo: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
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
          {busy ? 'Saving…' : 'Save policy'}
        </button>
      </div>
    </form>
  );
}

export default function WalletPoliciesPanel({ policies, onCreate, onUpdate, onRetire }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const items = useMemo(() => policies ?? [], [policies]);

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
    if (!onUpdate || !editPolicy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdate(editPolicy.id, payload);
      setEditPolicy(null);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRetire = async (policy) => {
    if (!onRetire || !policy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onRetire(policy.id);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Rules</h3>
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
        {items.map((policy) => (
          <div key={policy.id ?? policy.policyName} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-white p-3 text-accent shadow">
                  <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{policy.policyName}</p>
                  <p className="mt-1 text-xs text-slate-500">{policy.category || 'All categories'}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  policy.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : policy.status === 'paused'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {policy.status ?? 'active'}
              </span>
            </div>

            <dl className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">Limit</dt>
                <dd className="mt-1">{policy.limitAmount != null ? `$${Number(policy.limitAmount).toLocaleString()}` : 'Unlimited'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Interval</dt>
                <dd className="mt-1">{policy.limitInterval?.replace(/_/g, ' ') || 'monthly'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Approver role</dt>
                <dd className="mt-1">{policy.approverRole || 'manager'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Approval required</dt>
                <dd className="mt-1">{policy.approvalRequired ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Enforcement</dt>
                <dd className="mt-1">
                  {policy.enforcedFrom ? new Date(policy.enforcedFrom).toLocaleDateString() : 'Immediate'}
                  {policy.enforcedTo ? ` – ${new Date(policy.enforcedTo).toLocaleDateString()}` : ''}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEditPolicy(policy);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Edit
              </button>
              {policy.status !== 'retired' ? (
                <button
                  type="button"
                  onClick={() => handleRetire(policy)}
                  disabled={busy}
                  className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Retire
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {!items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
            <p className="font-semibold text-slate-700">No rules yet</p>
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
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Add rule</Dialog.Title>
                  <div className="mt-6">
                    <PolicyForm
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

      <Transition.Root show={Boolean(editPolicy)} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => (busy ? null : setEditPolicy(null))}>
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
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Edit rule</Dialog.Title>
                  <div className="mt-6">
                    <PolicyForm
                      initialValue={editPolicy}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditPolicy(null)}
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
