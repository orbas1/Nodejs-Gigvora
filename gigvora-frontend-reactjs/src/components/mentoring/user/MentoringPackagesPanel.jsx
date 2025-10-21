import PropTypes from 'prop-types';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

function PackageRow({ order, onEdit, canEdit, currencyFormatter, dateFormatter }) {
  return (
    <tr className="text-sm text-slate-700">
      <td className="py-3 pr-4">
        <div className="font-semibold text-slate-900">{order.packageName}</div>
        <div className="text-xs text-slate-500">{order.packageDescription || '—'}</div>
      </td>
      <td className="py-3 pr-4 text-slate-600">{order.mentor ? `${order.mentor.firstName ?? ''} ${order.mentor.lastName ?? ''}`.trim() || `Mentor #${order.mentorId}` : `Mentor #${order.mentorId}`}</td>
      <td className="py-3 pr-4">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{order.sessionsRedeemed}/{order.sessionsPurchased}</span>
      </td>
      <td className="py-3 pr-4">{currencyFormatter(order.totalAmount, order.currency)}</td>
      <td className="py-3 pr-4 text-slate-500">{dateFormatter(order.purchasedAt)}</td>
      {canEdit ? (
        <td className="py-3 text-right">
          <button
            type="button"
            onClick={() => onEdit(order)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
          >
            <PencilSquareIcon className="h-4 w-4" />
            <span>Edit</span>
          </button>
        </td>
      ) : null}
    </tr>
  );
}

const defaultCurrencyFormatter = (value, currency) =>
  `${currency ?? '£'}${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value ?? 0)}`;

const defaultDateFormatter = (value) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
};

export default function MentoringPackagesPanel({
  orders = [],
  canEdit = false,
  onCreate,
  onEdit,
  currencyFormatter,
  dateFormatter,
}) {
  const formatCurrency = currencyFormatter ?? defaultCurrencyFormatter;
  const formatDate = dateFormatter ?? defaultDateFormatter;
  return (
    <section className="flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Packages</h3>
        {canEdit ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add</span>
          </button>
        ) : null}
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4">Package</th>
              <th className="py-2 pr-4">Mentor</th>
              <th className="py-2 pr-4">Sessions</th>
              <th className="py-2 pr-4">Spend</th>
              <th className="py-2 pr-4">Purchased</th>
              {canEdit ? <th className="py-2 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.length ? (
              orders.map((order) => (
                <PackageRow
                  key={order.id}
                  order={order}
                  onEdit={onEdit}
                  canEdit={canEdit}
                  currencyFormatter={formatCurrency}
                  dateFormatter={formatDate}
                />
              ))
            ) : (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="py-6 text-center text-sm text-slate-500">
                  No packages tracked yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

MentoringPackagesPanel.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      packageName: PropTypes.string.isRequired,
      packageDescription: PropTypes.string,
      mentor: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
      }),
      mentorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      sessionsRedeemed: PropTypes.number,
      sessionsPurchased: PropTypes.number,
      totalAmount: PropTypes.number,
      currency: PropTypes.string,
      purchasedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
  ),
  canEdit: PropTypes.bool,
  onCreate: PropTypes.func,
  onEdit: PropTypes.func,
  currencyFormatter: PropTypes.func,
  dateFormatter: PropTypes.func,
};

