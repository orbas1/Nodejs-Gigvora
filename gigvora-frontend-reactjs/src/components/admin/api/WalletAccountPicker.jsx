import { useEffect, useMemo, useState } from 'react';
import { listWalletAccounts } from '../../../services/adminApi.js';

function formatBalance(value) {
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  return Number(value).toFixed(2);
}

export default function WalletAccountPicker({
  value,
  onChange,
  selectedAccount,
  disabled = false,
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const showResults = useMemo(() => query.trim().length >= 2, [query]);

  useEffect(() => {
    if (!showResults) {
      setOptions([]);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listWalletAccounts({ query: query.trim(), limit: 12 }, { signal: controller.signal })
      .then((data) => {
        setOptions(data?.accounts ?? []);
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') {
          return;
        }
        setError(fetchError?.message ?? 'Unable to search wallets.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query, showResults]);

  const handleSelect = (account) => {
    onChange?.(account?.id ?? null, account ?? null);
    setQuery('');
    setOptions([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 text-sm">
        <label className="font-medium text-slate-700">Wallet account</label>
        <input
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, or ID"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed"
        />
        {loading ? <span className="text-xs text-slate-500">Searching…</span> : null}
        {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      </div>

      {selectedAccount ? (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <div>
            <div className="font-semibold text-slate-900">{selectedAccount.label}</div>
            <div className="text-xs text-slate-500">
              Balance {formatBalance(selectedAccount.availableBalance)} {selectedAccount.currencyCode}
              {selectedAccount.ownerEmail ? ` • ${selectedAccount.ownerEmail}` : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
          >
            Clear
          </button>
        </div>
      ) : null}

      {showResults && options.length > 0 ? (
        <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {options.map((account) => (
            <li key={account.id}>
              <button
                type="button"
                onClick={() => handleSelect(account)}
                className="w-full rounded-2xl border border-transparent px-3 py-2 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="font-semibold text-slate-900">{account.label}</div>
                <div className="text-xs text-slate-500">
                  Balance {formatBalance(account.availableBalance)} {account.currencyCode}
                  {account.ownerEmail ? ` • ${account.ownerEmail}` : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showResults && !loading && options.length === 0 && !error ? (
        <p className="text-xs text-slate-500">No wallets match that search.</p>
      ) : null}

      <input type="hidden" value={value ?? ''} readOnly />
    </div>
  );
}
