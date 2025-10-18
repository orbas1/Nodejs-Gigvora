import PropTypes from 'prop-types';

export default function StorageAuditPanel({ auditLog }) {
  return (
    <section id="storage-audit" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Audit</h2>
          <p className="text-sm text-slate-500">Recent storage changes.</p>
        </div>
      </div>

      {auditLog.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No audit events yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {auditLog.map((event) => (
            <li
              key={event.id}
              className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{event.summary || event.eventType}</p>
                  <p className="text-sm text-slate-500">{event.actorLabel}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{event.timeLabel}</p>
                  <p>{event.createdLabel}</p>
                </div>
              </div>
              {event.metadataPreview ? (
                <dl className="mt-3 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                  {event.metadataPreview.map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2">
                      <dt className="font-semibold text-slate-600">{item.label}</dt>
                      <dd className="mt-1 break-words text-slate-500">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

StorageAuditPanel.propTypes = {
  auditLog: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      summary: PropTypes.string,
      eventType: PropTypes.string,
      actorLabel: PropTypes.string,
      timeLabel: PropTypes.string,
      createdLabel: PropTypes.string,
      metadataPreview: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ),
    }),
  ),
};

StorageAuditPanel.defaultProps = {
  auditLog: [],
};
