import { useMemo, useState } from 'react';
import { FunnelIcon, PlusIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { CONTRACT_STATUSES, CONTRACT_TYPES } from './volunteeringOptions.js';

const STATUS_FILTERS = [{ value: 'all', label: 'All' }, ...CONTRACT_STATUSES];
const TYPE_FILTERS = [{ value: 'all', label: 'All types' }, ...CONTRACT_TYPES];

const TYPE_LABEL = Object.fromEntries(CONTRACT_TYPES.map((option) => [option.value, option.label]));

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function sumSpend(entries = []) {
  return entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
}

function currencyFormatter(amount, currency = 'USD') {
  if (!amount) return '$0';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

export default function VolunteeringContractLedger({
  contracts = [],
  applications = [],
  busy = false,
  onCreateContract,
  onUpdateContract,
  onDeleteContract,
  onSelectApplication,
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [form, setForm] = useState({
    applicationId: '',
    title: '',
    contractType: 'fixed_term',
    status: 'draft',
    startDate: '',
    endDate: '',
    stipendAmount: '',
    stipendCurrency: 'USD',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const applicationOptions = useMemo(
    () =>
      applications.map((application) => ({
        value: application.id,
        label: application.candidateName || 'Unnamed candidate',
        subtitle: application.post?.title ?? 'No post assigned',
      })),
    [applications],
  );

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
      const matchesType = typeFilter === 'all' || contract.contractType === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [contracts, statusFilter, typeFilter]);

  const handleFormChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.applicationId || !form.title.trim()) {
      setError('Pick a candidate and title.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onCreateContract?.(form.applicationId, {
        title: form.title,
        contractType: form.contractType,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        stipendAmount: form.stipendAmount ? Number(form.stipendAmount) : undefined,
        stipendCurrency: form.stipendCurrency || undefined,
      });
      setForm({
        applicationId: '',
        title: '',
        contractType: 'fixed_term',
        status: 'draft',
        startDate: '',
        endDate: '',
        stipendAmount: '',
        stipendCurrency: 'USD',
      });
    } catch (submissionError) {
      setError(submissionError?.message || 'Could not create contract.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (contractId, status) => {
    if (!contractId || !status) return;
    try {
      await onUpdateContract?.(contractId, { status });
    } catch (updateError) {
      console.error(updateError);
    }
  };

  const handleDelete = async (contractId) => {
    if (!contractId) return;
    try {
      await onDeleteContract?.(contractId);
    } catch (deleteError) {
      console.error(deleteError);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Contracts</h2>
        <p className="text-sm text-slate-500">Keep volunteer agreements current and track stipend promises.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">New contract</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidate</span>
                <select
                  value={form.applicationId}
                  onChange={handleFormChange('applicationId')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="" disabled>
                    Select candidate
                  </option>
                  {applicationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} · {option.subtitle}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                <input
                  value={form.title}
                  onChange={handleFormChange('title')}
                  placeholder="Agreement title"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                  <select
                    value={form.contractType}
                    onChange={handleFormChange('contractType')}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {CONTRACT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                  <select
                    value={form.status}
                    onChange={handleFormChange('status')}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    {CONTRACT_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={handleFormChange('startDate')}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={handleFormChange('endDate')}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-[2fr_1fr] gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stipend</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stipendAmount}
                    onChange={handleFormChange('stipendAmount')}
                    placeholder="0"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</span>
                  <input
                    value={form.stipendCurrency}
                    onChange={handleFormChange('stipendCurrency')}
                    placeholder="USD"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </label>
              </div>
              {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting || busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Create
              </button>
            </form>
          </div>
        </div>

        <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <label className="inline-flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {TYPE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[640px] overflow-y-auto pr-1">
            <table className="w-full table-fixed border-separate border-spacing-y-3 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="rounded-l-2xl bg-slate-50 px-4 py-2">Title</th>
                  <th className="bg-slate-50 px-4 py-2">Type</th>
                  <th className="bg-slate-50 px-4 py-2">Status</th>
                  <th className="bg-slate-50 px-4 py-2">Dates</th>
                  <th className="bg-slate-50 px-4 py-2">Stipend</th>
                  <th className="rounded-r-2xl bg-slate-50 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length ? (
                  filteredContracts.map((contract) => {
                    const application = applications.find((item) => item.id === contract.applicationId);
                    const spend = sumSpend(contract.spendEntries);
                    return (
                      <tr key={contract.id} className="rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                        <td className="rounded-l-2xl px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSelectApplication?.(contract.applicationId)}
                            className="text-left text-sm font-semibold text-blue-600 hover:underline"
                          >
                            {contract.title || 'Volunteer contract'}
                          </button>
                          <p className="text-xs text-slate-500">{application?.candidateName ?? 'Unnamed candidate'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                          {TYPE_LABEL[contract.contractType] ?? contract.contractType}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={contract.status}
                            onChange={(event) => handleStatusChange(contract.id, event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                          >
                            {CONTRACT_STATUSES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          <div className="flex flex-col">
                            <span>Start {formatDate(contract.startDate)}</span>
                            <span>End {formatDate(contract.endDate)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                          <div className="flex flex-col">
                            <span>{currencyFormatter(contract.stipendAmount, contract.stipendCurrency)}</span>
                            <span className="text-xs text-slate-500">
                              <CurrencyDollarIcon className="mr-1 inline h-4 w-4 text-emerald-500" aria-hidden="true" />
                              {currencyFormatter(spend, contract.stipendCurrency)} spent
                            </span>
                          </div>
                        </td>
                        <td className="rounded-r-2xl px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(contract.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-12 text-center text-sm text-slate-500">
                      No contracts match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
