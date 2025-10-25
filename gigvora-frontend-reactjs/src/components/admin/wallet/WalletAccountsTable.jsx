import PropTypes from 'prop-types';
import { ArrowPathIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import StatusBadge from '../../common/StatusBadge.jsx';

function formatCurrency(value, currency = 'USD') {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

const WALLET_STATUS_TONES = {
  active: { tone: 'emerald', variant: 'solid' },
  pending: { tone: 'amber', variant: 'outline' },
  suspended: { tone: 'rose', variant: 'outline' },
  closed: { tone: 'slate', variant: 'outline' },
};

function ProviderBadge({ provider }) {
  const normalized = `${provider ?? ''}`.toLowerCase();
  const label = normalized === 'escrow_com' ? 'Escrow.com' : normalized ? normalized : '—';
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

ProviderBadge.propTypes = {
  provider: PropTypes.string,
};

function EmptyState({ loading, onRefresh }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-12 text-center">
      <CheckCircleIcon className="h-10 w-10 text-slate-300" />
      <p className="text-sm text-slate-500">No wallet accounts match the current filters.</p>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-blue-400 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      ) : null}
    </div>
  );
}

EmptyState.propTypes = {
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

EmptyState.defaultProps = {
  loading: false,
  onRefresh: undefined,
};

export default function WalletAccountsTable({
  accounts,
  pagination,
  onPageChange,
  onSelect,
  selectedAccountId,
  loading,
  onRefresh,
}) {
  const handlePrev = () => {
    if (pagination?.page > 1 && typeof onPageChange === 'function') {
      onPageChange(pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (pagination && pagination.page < pagination.totalPages && typeof onPageChange === 'function') {
      onPageChange(pagination.page + 1);
    }
  };

  const items = Array.isArray(accounts) ? accounts : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3">Wallet</th>
              <th className="px-6 py-3">Owner</th>
              <th className="px-6 py-3">Balances</th>
              <th className="px-6 py-3">Provider</th>
              <th className="px-6 py-3">Updated</th>
              <th className="px-6 py-3 text-center">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((account) => {
              const currency = account.currencyCode ?? 'USD';
              const isSelected = account.id === selectedAccountId;
              return (
                <tr key={account.id} className={isSelected ? 'bg-blue-50/40' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-slate-900">#{account.id}</span>
                      <span className="text-xs text-slate-500">{account.accountType}</span>
                      <StatusBadge
                        status={account.status}
                        category="walletAccount"
                        statusToneMap={WALLET_STATUS_TONES}
                        uppercase
                        size="xs"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {account.user
                          ? `${account.user.firstName ?? ''} ${account.user.lastName ?? ''}`.trim() || account.user.email
                          : '—'}
                      </span>
                      <span className="text-xs text-slate-500">{account.user?.email ?? 'Not linked'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1">
                        <p className="font-semibold text-slate-400">Now</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(account.currentBalance, currency)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1">
                        <p className="font-semibold text-slate-400">Free</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(account.availableBalance, currency)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1">
                        <p className="font-semibold text-slate-400">Hold</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(account.pendingHoldBalance, currency)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ProviderBadge provider={account.custodyProvider} />
                    {account.providerAccountId ? (
                      <p className="mt-1 text-xs text-slate-500">{account.providerAccountId}</p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{formatDate(account.updatedAt)}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onSelect && onSelect(account)}
                      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition ${
                        isSelected
                          ? 'border border-blue-400 bg-blue-600 text-white hover:bg-blue-500'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {isSelected ? 'Viewing' : 'Open'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!items.length ? <EmptyState loading={loading} onRefresh={onRefresh} /> : null}

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
        <div>
          Showing {items.length} of {pagination?.totalItems ?? items.length} accounts
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!pagination || pagination.page <= 1}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Prev
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!pagination || pagination.page >= pagination.totalPages}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

WalletAccountsTable.propTypes = {
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      accountType: PropTypes.string,
      status: PropTypes.string,
      user: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
      }),
      currentBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      availableBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      pendingHoldBalance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      custodyProvider: PropTypes.string,
      providerAccountId: PropTypes.string,
      currencyCode: PropTypes.string,
      updatedAt: PropTypes.string,
    }),
  ),
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    totalItems: PropTypes.number,
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  selectedAccountId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

WalletAccountsTable.defaultProps = {
  accounts: [],
  onSelect: undefined,
  selectedAccountId: null,
  loading: false,
  onRefresh: undefined,
};
