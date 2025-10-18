import { useEffect, useMemo, useRef, useState } from 'react';
import { BanknotesIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PROVIDERS = [
  { id: 'stripe', label: 'Stripe Treasury' },
  { id: 'escrow_com', label: 'Escrow.com' },
];

function normaliseMembers(members) {
  return (Array.isArray(members) ? members : []).map((member) => ({
    id: member?.id ?? member?.user?.id,
    name: member?.user?.name ?? member?.user?.email ?? 'Workspace member',
    role: member?.role ?? 'member',
  }));
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function SlideOut({ open, title, icon: Icon, onClose, children, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="rounded-2xl bg-blue-50 p-2 text-blue-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
            ) : null}
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-1 text-slate-500 hover:border-slate-300 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function EscrowAccountsPanel({ accounts, members, onCreate, onUpdate }) {
  const memberOptions = useMemo(() => normaliseMembers(members), [members]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createState, setCreateState] = useState({
    userId: '',
    provider: PROVIDERS[0].id,
    currencyCode: 'USD',
    label: '',
    notes: '',
    logoUrl: '',
  });
  const [editState, setEditState] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const toastTimeoutRef = useRef(null);

  const sortedAccounts = useMemo(
    () => [...(accounts ?? [])].sort((a, b) => Number(b.currentBalance ?? 0) - Number(a.currentBalance ?? 0)),
    [accounts],
  );

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    },
    [],
  );

  const scheduleToastClear = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateState((previous) => ({ ...previous, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        userId: createState.userId ? Number(createState.userId) : undefined,
        provider: createState.provider,
        currencyCode: createState.currencyCode || undefined,
        label: createState.label || undefined,
        notes: createState.notes || undefined,
        logoUrl: createState.logoUrl || undefined,
      });
      setToast('Account created');
      scheduleToastClear();
      setCreateState((previous) => ({ ...previous, label: '', notes: '', logoUrl: '' }));
      setCreateOpen(false);
    } catch (err) {
      setError(err?.body?.message ?? err?.message ?? 'Unable to create escrow account.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (account) => {
    setEditState({
      id: account.id,
      label: account.label ?? '',
      status: account.status ?? 'active',
      currencyCode: account.currencyCode ?? 'USD',
      notes: account.notes ?? '',
      logoUrl: account.logoUrl ?? '',
    });
    setEditOpen(true);
    setError(null);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditState((previous) => ({ ...previous, [name]: value }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editState?.id) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onUpdate(editState.id, {
        label: editState.label || undefined,
        status: editState.status,
        currencyCode: editState.currencyCode,
        notes: editState.notes || undefined,
        logoUrl: editState.logoUrl || undefined,
      });
      setToast('Account updated');
      scheduleToastClear();
      setEditOpen(false);
    } catch (err) {
      setError(err?.body?.message ?? err?.message ?? 'Unable to update escrow account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-blue-50 p-2 text-blue-600">
            <BanknotesIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Accounts</h2>
            <p className="text-xs text-slate-500">One card per custody source.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateOpen(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>

      {toast ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          <span>{toast}</span>
        </div>
      ) : null}
      {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

      {sortedAccounts.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedAccounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => openEdit(account)}
              className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{account.label ?? `Account ${account.id}`}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {account.status?.replace(/_/g, ' ') ?? 'active'} • {account.provider}
                  </p>
                </div>
                {account.logoUrl ? (
                  <span className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                    Brand
                  </span>
                ) : null}
              </div>

              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(account.currentBalance, account.currencyCode ?? 'USD')}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Pending {formatCurrency(account.pendingReleaseTotal, account.currencyCode ?? 'USD')}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{account.owner?.name ?? 'No owner'}</span>
                <span>{account.currencyCode ?? 'USD'}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-left shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No accounts yet</p>
          <p className="text-sm text-slate-500">Connect your first custody account to start escrow operations.</p>
          <button
            type="button"
            onClick={() => {
              setCreateOpen(true);
              setError(null);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add account
          </button>
        </div>
      )}

      <SlideOut
        open={createOpen}
        title="New escrow account"
        icon={BanknotesIcon}
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-escrow-account"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <form id="create-escrow-account" onSubmit={handleCreate} className="space-y-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Owner</span>
            <select
              name="userId"
              value={createState.userId}
              onChange={handleCreateChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">Select member</option>
              {memberOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Provider</span>
            <select
              name="provider"
              value={createState.provider}
              onChange={handleCreateChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Currency</span>
            <input
              type="text"
              name="currencyCode"
              value={createState.currencyCode}
              onChange={handleCreateChange}
              maxLength={3}
              className="rounded-xl border border-slate-300 px-3 py-2 uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Display name</span>
            <input
              type="text"
              name="label"
              value={createState.label}
              onChange={handleCreateChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Notes</span>
            <textarea
              name="notes"
              rows={3}
              value={createState.notes}
              onChange={handleCreateChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">Logo URL</span>
            <input
              type="url"
              name="logoUrl"
              value={createState.logoUrl}
              onChange={handleCreateChange}
              className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </form>
      </SlideOut>

      <SlideOut
        open={editOpen}
        title={editState ? `Manage ${editState.label || `Account ${editState.id}`}` : 'Manage account'}
        icon={BanknotesIcon}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
            <button
              type="submit"
              form="edit-escrow-account"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        {editState ? (
          <form id="edit-escrow-account" onSubmit={handleEditSubmit} className="space-y-4 text-sm">
            <div className="grid gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-medium text-slate-700">Display name</span>
                <input
                  type="text"
                  name="label"
                  value={editState.label}
                  onChange={handleEditChange}
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-medium text-slate-700">Status</span>
                <select
                  name="status"
                  value={editState.status}
                  onChange={handleEditChange}
                  className="rounded-xl border border-slate-300 px-3 py-2 capitalize focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-medium text-slate-700">Currency</span>
                <input
                  type="text"
                  name="currencyCode"
                  value={editState.currencyCode}
                  onChange={handleEditChange}
                  maxLength={3}
                  className="rounded-xl border border-slate-300 px-3 py-2 uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  value={editState.notes}
                  onChange={handleEditChange}
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-medium text-slate-700">Logo URL</span>
                <input
                  type="url"
                  name="logoUrl"
                  value={editState.logoUrl}
                  onChange={handleEditChange}
                  className="rounded-xl border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>
          </form>
        ) : null}
      </SlideOut>
    </div>
  );
}
