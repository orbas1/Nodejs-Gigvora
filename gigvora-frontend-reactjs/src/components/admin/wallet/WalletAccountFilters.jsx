const STATUS_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'user', label: 'User' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'company', label: 'Company' },
  { value: 'agency', label: 'Agency' },
];

const PROVIDER_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'escrow_com', label: 'Escrow' },
];

export default function WalletAccountFilters({ filters, onChange, onReset, onRefresh, loading, variant = 'card' }) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = value === '' ? undefined : value;
    if (typeof onChange === 'function') {
      onChange({ ...filters, page: 1, [name]: nextValue });
    }
  };

  const handleSearchChange = (event) => {
    if (typeof onChange === 'function') {
      onChange({ ...filters, page: 1, search: event.target.value });
    }
  };

  const handleReset = () => {
    if (typeof onReset === 'function') {
      onReset();
    }
  };

  const containerClass =
    variant === 'drawer'
      ? 'space-y-4'
      : 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm';

  return (
    <div className={containerClass}>
      <div className="space-y-3">
        <div>
          <label htmlFor="wallet-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search
          </label>
          <input
            id="wallet-search"
            type="search"
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            placeholder="Email or ID"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status ?? ''}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value ?? 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="accountType" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </label>
            <select
              id="accountType"
              name="accountType"
              value={filters.accountType ?? ''}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value ?? 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="custodyProvider" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Provider
            </label>
            <select
              id="custodyProvider"
              name="custodyProvider"
              value={filters.custodyProvider ?? ''}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option.value ?? 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="currency" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Currency
            </label>
            <input
              id="currency"
              name="currency"
              value={filters.currency ?? ''}
              onChange={handleChange}
              placeholder="USD"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-2xl border border-blue-500 bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Apply'}
        </button>
      </div>
    </div>
  );
}
