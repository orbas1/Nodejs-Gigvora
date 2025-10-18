import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationCircleIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'finance', label: 'Finance' },
  { value: 'requester', label: 'Requester' },
  { value: 'viewer', label: 'Viewer' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'removed', label: 'Removed' },
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
  return 'Unable to save the wallet member. Please try again.';
}

function MemberForm({ initialValue = {}, onSubmit, onCancel, busy, error, isEditing = false }) {
  const [formState, setFormState] = useState({
    userId: initialValue.userId ?? '',
    role: initialValue.role ?? 'viewer',
    status: initialValue.status ?? 'active',
    canInitiatePayments: Boolean(initialValue.canInitiatePayments),
    requireApproval: initialValue.requireApproval ?? true,
    approvalLimitAmount: initialValue.approvalLimitAmount != null ? `${initialValue.approvalLimitAmount}` : '',
    spendingLimitAmount: initialValue.spendingLimitAmount != null ? `${initialValue.spendingLimitAmount}` : '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isEditing && !formState.userId) {
      return;
    }
    onSubmit?.({
      userId: formState.userId ? Number(formState.userId) : undefined,
      role: formState.role,
      status: formState.status,
      canInitiatePayments: Boolean(formState.canInitiatePayments),
      requireApproval: Boolean(formState.requireApproval),
      approvalLimitAmount: formState.approvalLimitAmount !== '' ? formState.approvalLimitAmount : undefined,
      spendingLimitAmount: formState.spendingLimitAmount !== '' ? formState.spendingLimitAmount : undefined,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {!isEditing ? (
        <div>
          <label htmlFor="member-user-id" className="text-sm font-semibold text-slate-700">
            User ID
          </label>
          <input
            id="member-user-id"
            type="number"
            min="1"
            required
            value={formState.userId}
            onChange={(event) => setFormState((prev) => ({ ...prev, userId: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Enter user ID"
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="member-role" className="text-sm font-semibold text-slate-700">
            Role
          </label>
          <select
            id="member-role"
            value={formState.role}
            onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="member-status" className="text-sm font-semibold text-slate-700">
            Status
          </label>
          <select
            id="member-status"
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <input
            id="member-can-initiate"
            type="checkbox"
            checked={formState.canInitiatePayments}
            onChange={(event) => setFormState((prev) => ({ ...prev, canInitiatePayments: event.target.checked }))}
            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <label htmlFor="member-can-initiate" className="text-sm font-semibold text-slate-700">
            Can initiate payments
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="member-require-approval"
            type="checkbox"
            checked={formState.requireApproval}
            onChange={(event) => setFormState((prev) => ({ ...prev, requireApproval: event.target.checked }))}
            className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <label htmlFor="member-require-approval" className="text-sm font-semibold text-slate-700">
            Require approval
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="member-approval-limit" className="text-sm font-semibold text-slate-700">
            Approval limit
          </label>
          <input
            id="member-approval-limit"
            type="number"
            step="0.01"
            min="0"
            value={formState.approvalLimitAmount}
            onChange={(event) => setFormState((prev) => ({ ...prev, approvalLimitAmount: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="10000"
          />
        </div>
        <div>
          <label htmlFor="member-spending-limit" className="text-sm font-semibold text-slate-700">
            Spending limit
          </label>
          <input
            id="member-spending-limit"
            type="number"
            step="0.01"
            min="0"
            value={formState.spendingLimitAmount}
            onChange={(event) => setFormState((prev) => ({ ...prev, spendingLimitAmount: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="2500"
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
          {busy ? 'Saving…' : isEditing ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}

export default function WalletMembersPanel({ members, onAdd, onUpdate, onRemove }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const items = useMemo(() => members ?? [], [members]);

  const handleAdd = async (payload) => {
    if (!onAdd) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAdd(payload);
      setAddOpen(false);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!onUpdate || !editMember) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdate(editMember.id, payload);
      setEditMember(null);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (member) => {
    if (!onRemove || !member) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onRemove(member.id);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Team</h3>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAddOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Invite
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((member) => (
          <div
            key={member.id ?? member.userId}
            className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-white p-3 text-accent shadow">
                  <UserIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">User #{member.userId}</p>
                  <p className="mt-1 text-xs text-slate-500">Role: {member.role}</p>
                </div>
              </div>
              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <span>Spending limit: {member.spendingLimitAmount != null ? `$${Number(member.spendingLimitAmount).toLocaleString()}` : '—'}</span>
                <span>Approval limit: {member.approvalLimitAmount != null ? `$${Number(member.approvalLimitAmount).toLocaleString()}` : '—'}</span>
                <span>Can initiate: {member.canInitiatePayments ? 'Yes' : 'No'}</span>
                <span>Needs approval: {member.requireApproval ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span
                className={`rounded-full px-3 py-1 font-semibold ${
                  member.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : member.status === 'suspended'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {member.status}
              </span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEditMember(member);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Edit
              </button>
              {member.status !== 'removed' ? (
                <button
                  type="button"
                  onClick={() => handleRemove(member)}
                  disabled={busy}
                  className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {!items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm text-slate-600">
            <p className="font-semibold text-slate-700">No team yet</p>
          </div>
        ) : null}
      </div>

      <Transition.Root show={addOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => (busy ? null : setAddOpen(false))}>
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
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Invite teammate</Dialog.Title>
                  <div className="mt-6">
                    <MemberForm
                      onSubmit={handleAdd}
                      onCancel={() => setAddOpen(false)}
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

      <Transition.Root show={Boolean(editMember)} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => (busy ? null : setEditMember(null))}>
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
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Edit teammate</Dialog.Title>
                  <div className="mt-6">
                    <MemberForm
                      initialValue={editMember}
                      isEditing
                      onSubmit={handleUpdate}
                      onCancel={() => setEditMember(null)}
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
