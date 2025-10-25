import PropTypes from 'prop-types';

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminDataTable({
  columns,
  rows,
  loading,
  emptyState,
  footer,
  dense,
  getRowKey,
  className,
}) {
  const resolvedRows = Array.isArray(rows) ? rows : [];

  if (!loading && resolvedRows.length === 0) {
    return (
      <div className={joinClassNames('flex min-h-[200px] flex-col justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-soft', className)}>
        {emptyState || (
          <p className="text-sm text-slate-500">No records yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className={joinClassNames('overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft', className)}>
      <table className={joinClassNames('min-w-full divide-y divide-slate-200', dense ? 'text-xs' : 'text-sm')}>
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key || column.header}
                scope="col"
                className={joinClassNames('px-4 py-3', column.headerClassName)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={joinClassNames('divide-y divide-slate-200', dense ? 'text-xs text-slate-700' : 'text-sm text-slate-700')}>
          {resolvedRows.map((row, index) => {
            const rowKey = getRowKey ? getRowKey(row, index) : row.id ?? index;
            return (
              <tr key={rowKey}>
                {columns.map((column) => (
                  <td
                    key={`${rowKey}-${column.key || column.header}`}
                    className={joinClassNames('px-4 py-3 align-top', column.className)}
                  >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {loading ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Refreshing…
        </div>
      ) : null}
      {footer ? <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">{footer}</div> : null}
    </div>
  );
}

AdminDataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      header: PropTypes.node.isRequired,
      render: PropTypes.func,
      className: PropTypes.string,
      headerClassName: PropTypes.string,
    }),
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  emptyState: PropTypes.node,
  footer: PropTypes.node,
  dense: PropTypes.bool,
  getRowKey: PropTypes.func,
  className: PropTypes.string,
};

AdminDataTable.defaultProps = {
  rows: [],
  loading: false,
  emptyState: null,
  footer: null,
  dense: false,
  getRowKey: undefined,
  className: undefined,
};
