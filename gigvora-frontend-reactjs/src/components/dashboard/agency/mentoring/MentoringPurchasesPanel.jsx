import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useMemo, useState } from 'react';

const PURCHASE_DEFAULT = {
  packageName: '',
  mentorId: '',
  mentorName: '',
  mentorEmail: '',
  sessionsIncluded: '4',
  sessionsUsed: '0',
  amount: '',
  currency: '',
  purchasedAt: '',
  validUntil: '',
  status: 'active',
  notes: '',
};

const PURCHASE_STATUSES = ['active', 'exhausted', 'expired', 'refunded'];

function toDateInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (input) => `${input}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normaliseString(value) {
  if (value == null) {
    return undefined;
  }
  const trimmed = `${value}`.trim();
  return trimmed || undefined;
}

function buildPurchasePayload(form, currencyFallback) {
  const payload = {};
  const packageName = normaliseString(form.packageName);
  if (packageName !== undefined) payload.packageName = packageName;
  if (form.mentorId) payload.mentorId = Number(form.mentorId);
  const mentorName = normaliseString(form.mentorName);
  if (mentorName !== undefined) payload.mentorName = mentorName;
  const mentorEmail = normaliseString(form.mentorEmail);
  if (mentorEmail !== undefined) payload.mentorEmail = mentorEmail;
  if (form.sessionsIncluded) payload.sessionsIncluded = Number(form.sessionsIncluded);
  if (form.sessionsUsed) payload.sessionsUsed = Number(form.sessionsUsed);
  if (form.amount) payload.amount = Number(form.amount);
  const currency = normaliseString(form.currency) || currencyFallback;
  if (currency) payload.currency = currency.toUpperCase();
  if (form.purchasedAt) {
    const date = new Date(form.purchasedAt);
    if (!Number.isNaN(date.getTime())) {
      payload.purchasedAt = date.toISOString();
    }
  }
  if (form.validUntil) {
    const date = new Date(form.validUntil);
    if (!Number.isNaN(date.getTime())) {
      payload.validUntil = date.toISOString();
    }
  }
  if (form.status) payload.status = form.status;
  const notes = normaliseString(form.notes);
  if (notes !== undefined) payload.notes = notes;

  return payload;
}

function purchaseToForm(purchase, currencyFallback) {
  if (!purchase) {
    return { ...PURCHASE_DEFAULT, currency: currencyFallback ?? 'USD' };
  }
  return {
    packageName: purchase.packageName || '',
    mentorId: purchase.mentorId ? String(purchase.mentorId) : '',
    mentorName: purchase.mentorName || purchase.mentor?.name || '',
    mentorEmail: purchase.mentorEmail || purchase.mentor?.email || '',
    sessionsIncluded: purchase.sessionsIncluded != null ? String(purchase.sessionsIncluded) : '0',
    sessionsUsed: purchase.sessionsUsed != null ? String(purchase.sessionsUsed) : '0',
    amount: purchase.amount != null ? String(purchase.amount) : '',
    currency: purchase.currency || currencyFallback || 'USD',
    purchasedAt: toDateInput(purchase.purchasedAt),
    validUntil: toDateInput(purchase.validUntil),
    status: purchase.status || 'active',
    notes: purchase.notes || '',
  };
}

function PurchaseDrawer({ open, mode, form, currency, busy, error, onChange, onClose, onSubmit, onDelete }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-xl bg-white p-8 shadow-2xl">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  {mode === 'edit' ? 'Edit package' : 'New package'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">Track purchased hours and link them to sessions in one tap.</p>

                <form className="mt-6 space-y-5" onSubmit={onSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="packageName" className="text-sm font-semibold text-slate-700">
                      Package name
                    </label>
                    <input
                      type="text"
                      id="packageName"
                      name="packageName"
                      value={form.packageName}
                      onChange={onChange}
                      placeholder="Design leadership sprint"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="mentorName" className="text-sm font-semibold text-slate-700">
                        Mentor name
                      </label>
                      <input
                        type="text"
                        id="mentorName"
                        name="mentorName"
                        value={form.mentorName}
                        onChange={onChange}
                        placeholder="Mentor"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="mentorEmail" className="text-sm font-semibold text-slate-700">
                        Mentor email
                      </label>
                      <input
                        type="email"
                        id="mentorEmail"
                        name="mentorEmail"
                        value={form.mentorEmail}
                        onChange={onChange}
                        placeholder="mentor@email.com"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <label htmlFor="sessionsIncluded" className="text-sm font-semibold text-slate-700">
                        Sessions included
                      </label>
                      <input
                        type="number"
                        id="sessionsIncluded"
                        name="sessionsIncluded"
                        min="1"
                        value={form.sessionsIncluded}
                        onChange={onChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="sessionsUsed" className="text-sm font-semibold text-slate-700">
                        Sessions used
                      </label>
                      <input
                        type="number"
                        id="sessionsUsed"
                        name="sessionsUsed"
                        min="0"
                        value={form.sessionsUsed}
                        onChange={onChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="status" className="text-sm font-semibold text-slate-700">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={onChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      >
                        {PURCHASE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="purchasedAt" className="text-sm font-semibold text-slate-700">
                        Purchase date
                      </label>
                      <input
                        type="date"
                        id="purchasedAt"
                        name="purchasedAt"
                        value={form.purchasedAt}
                        onChange={onChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="validUntil" className="text-sm font-semibold text-slate-700">
                        Valid until
                      </label>
                      <input
                        type="date"
                        id="validUntil"
                        name="validUntil"
                        value={form.validUntil}
                        onChange={onChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <div className="space-y-2">
                      <label htmlFor="notes" className="text-sm font-semibold text-slate-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={form.notes}
                        onChange={onChange}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="amount" className="text-sm font-semibold text-slate-700">
                        Amount
                      </label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        min="0"
                        value={form.amount}
                        onChange={onChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="currency" className="text-sm font-semibold text-slate-700">
                        Currency
                      </label>
                      <input
                        type="text"
                        id="currency"
                        name="currency"
                        value={form.currency || currency}
                        onChange={onChange}
                        className="w-24 rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase tracking-[0.3em] text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
                  ) : null}

                  <div className="flex items-center justify-between">
                    {mode === 'edit' ? (
                      <button
                        type="button"
                        onClick={onDelete}
                        disabled={busy}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-60"
                      >
                        Delete package
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {busy ? 'Saving…' : 'Save package'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

PurchaseDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.object.isRequired,
  currency: PropTypes.string.isRequired,
  busy: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export default function MentoringPurchasesPanel({ purchases, overview, actions }) {
  const currency = overview?.workspace?.defaultCurrency ?? 'USD';
  const [drawer, setDrawer] = useState({ open: false, mode: 'create', purchase: null });
  const [form, setForm] = useState(() => purchaseToForm(null, currency));
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!drawer.open) {
      setForm(purchaseToForm(null, currency));
      setFormError(null);
      return;
    }
    if (drawer.mode === 'edit' && drawer.purchase) {
      setForm(purchaseToForm(drawer.purchase, currency));
    } else {
      setForm(purchaseToForm(null, currency));
    }
    setFormError(null);
  }, [drawer, currency]);

  const handleOpenCreate = () => setDrawer({ open: true, mode: 'create', purchase: null });
  const handleOpenEdit = (purchase) => setDrawer({ open: true, mode: 'edit', purchase });
  const handleClose = () => {
    if (busy) {
      return;
    }
    setDrawer({ open: false, mode: 'create', purchase: null });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = buildPurchasePayload(form, currency);
      if (drawer.mode === 'edit' && drawer.purchase) {
        await actions.updatePurchase(drawer.purchase.id, payload);
      } else {
        await actions.createPurchase(payload);
      }
      setDrawer({ open: false, mode: 'create', purchase: null });
    } catch (error) {
      setFormError(error?.body?.message || error?.message || 'Unable to save package.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!drawer.purchase) {
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await actions.deletePurchase(drawer.purchase.id);
      setDrawer({ open: false, mode: 'create', purchase: null });
    } catch (error) {
      setFormError(error?.body?.message || error?.message || 'Unable to delete package.');
    } finally {
      setBusy(false);
    }
  };

  const summary = useMemo(() => {
    const totalIncluded = purchases.reduce((total, purchase) => total + (purchase.sessionsIncluded ?? 0), 0);
    const totalUsed = purchases.reduce((total, purchase) => total + (purchase.sessionsUsed ?? 0), 0);
    return { totalIncluded, totalUsed };
  }, [purchases]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Packages</h2>
          <p className="text-sm text-slate-500">
            {summary.totalUsed}/{summary.totalIncluded} sessions used across active packages.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          New package
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {purchases.map((purchase) => (
          <button
            key={purchase.id}
            type="button"
            onClick={() => handleOpenEdit(purchase)}
            className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <span>{purchase.status}</span>
              <span>{formatDate(purchase.purchasedAt)}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{purchase.packageName || 'Mentoring package'}</p>
            <p className="text-xs text-slate-500">
              {purchase.sessionsUsed ?? 0}/{purchase.sessionsIncluded ?? 0} sessions
            </p>
            {purchase.amount ? (
              <p className="mt-3 text-xs text-slate-500">
                {currency} {Number(purchase.amount).toLocaleString()}
              </p>
            ) : null}
            {purchase.validUntil ? (
              <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                Expires {formatDate(purchase.validUntil)}
              </p>
            ) : null}
          </button>
        ))}
        {!purchases.length ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No packages yet. Add one to unlock bulk session tracking.
          </div>
        ) : null}
      </div>

      <PurchaseDrawer
        open={drawer.open}
        mode={drawer.mode}
        form={form}
        currency={currency}
        busy={busy}
        error={formError}
        onChange={handleChange}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </section>
  );
}

MentoringPurchasesPanel.propTypes = {
  purchases: PropTypes.arrayOf(PropTypes.object).isRequired,
  overview: PropTypes.object,
  actions: PropTypes.shape({
    createPurchase: PropTypes.func.isRequired,
    updatePurchase: PropTypes.func.isRequired,
    deletePurchase: PropTypes.func.isRequired,
  }).isRequired,
};
