import { ArrowRightIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  invited: 'bg-sky-50 text-sky-700 border-sky-200',
  suspended: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-50 text-slate-500 border-slate-200',
};

function StatusBadge({ status }) {
  const normalized = (status ?? '').toLowerCase();
  const style = STATUS_STYLES[normalized] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  const label = normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Unknown';
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium', style)}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" aria-hidden="true" />
      {label}
    </span>
  );
}

function RoleList({ roles }) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return <span className="text-xs text-slate-400">None</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.slice(0, 3).map((role) => (
        <span
          key={role}
          className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600"
        >
          {role.replace(/[_-]/g, ' ')}
        </span>
      ))}
      {roles.length > 3 && <span className="text-xs text-slate-400">+{roles.length - 3}</span>}
    </div>
  );
}

function TwoFactorIndicator({ enabled }) {
  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
        <ShieldCheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
        2FA
      </span>
    );
  }
  return <span className="text-xs font-medium text-amber-600">Disabled</span>;
}

export default function UserDirectoryTable({ items, selectedUserId, onSelect, loading, pagination, onPageChange }) {
  const handlePrev = () => {
    if (pagination.offset <= 0) {
      return;
    }
    onPageChange({ offset: Math.max(0, pagination.offset - pagination.limit) });
  };

  const handleNext = () => {
    const nextOffset = pagination.offset + pagination.limit;
    if (nextOffset >= (pagination.total ?? 0)) {
      return;
    }
    onPageChange({ offset: nextOffset });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50/70">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                User
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Account type
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Roles
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last seen
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Security
              </th>
              <th scope="col" className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                  No users match your filters yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const isSelected = String(item.id) === String(selectedUserId);
              const fullName = item.name || `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email;
              const lastSeen = item.lastSeenAt || item.lastLoginAt || null;
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect?.(item)}
                  className={clsx('cursor-pointer transition hover:bg-slate-50/70', isSelected && 'bg-slate-100/80')}
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{fullName}</div>
                    <div className="text-xs text-slate-500">{item.email}</div>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-600">{item.userType ?? 'user'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4">
                    <RoleList roles={item.roles} />
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {lastSeen ? new Date(lastSeen).toLocaleString() : <span className="text-xs text-slate-400">Never</span>}
                  </td>
                  <td className="px-5 py-4">
                    <TwoFactorIndicator enabled={item.twoFactorEnabled !== false} />
                  </td>
                  <td className="px-5 py-4 text-right text-slate-400">
                    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-900">
            {Math.min(pagination.offset + 1, pagination.total ?? 0)}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-900">
            {Math.min(pagination.offset + pagination.limit, pagination.total ?? 0)}
          </span>{' '}
          of <span className="font-semibold text-slate-900">{pagination.total ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={pagination.offset <= 0}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={pagination.offset + pagination.limit >= (pagination.total ?? 0)}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

