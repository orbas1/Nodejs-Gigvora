import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

function SnapshotItem({ title, meta, timestamp, to }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {meta ? <p className="text-xs text-slate-500">{meta}</p> : null}
        {timestamp ? <p className="mt-1 text-xs text-slate-400">{timestamp}</p> : null}
      </div>
      {to ? (
        <Link
          to={to}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          View
        </Link>
      ) : null}
    </li>
  );
}

SnapshotItem.propTypes = {
  title: PropTypes.string.isRequired,
  meta: PropTypes.string,
  timestamp: PropTypes.string,
  to: PropTypes.string,
};

SnapshotItem.defaultProps = {
  meta: '',
  timestamp: '',
  to: '',
};

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
      <DocumentTextIcon className="h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
};

export default function GovernancePolicySnapshot({ recentPublications, upcomingEffective }) {
  const recentItems = Array.isArray(recentPublications) ? recentPublications : [];
  const upcomingItems = Array.isArray(upcomingEffective) ? upcomingEffective : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent publications</h3>
          <Link
            to="/dashboard/admin/governance/policies"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Manage policies
          </Link>
        </div>
        {recentItems.length ? (
          <ul className="space-y-3">
            {recentItems.map((item) => (
              <SnapshotItem
                key={`${item.documentId}-${item.versionId}`}
                title={`${item.documentTitle} · v${item.version}`}
                meta={`Locale ${item.locale?.toUpperCase?.() ?? 'EN'} • ${item.status}`}
                timestamp={`Published ${new Date(item.publishedAt).toLocaleString()}`}
                to={`/dashboard/admin/governance/policies`}
              />
            ))}
          </ul>
        ) : (
          <EmptyState message="No policy publications detected in this window." />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Upcoming effective dates</h3>
          <Link
            to="/dashboard/admin/governance/documents"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Document workflows
          </Link>
        </div>
        {upcomingItems.length ? (
          <ul className="space-y-3">
            {upcomingItems.map((item) => (
              <SnapshotItem
                key={`${item.documentId}-${item.versionId}`}
                title={`${item.documentTitle} · v${item.version}`}
                meta={`Locale ${item.locale?.toUpperCase?.() ?? 'EN'} • ${item.status}`}
                timestamp={`Effective ${new Date(item.effectiveAt).toLocaleString()}`}
                to={`/dashboard/admin/governance/policies`}
              />
            ))}
          </ul>
        ) : (
          <EmptyState message="No upcoming effective dates. All policies are current." />
        )}
      </section>
    </div>
  );
}

GovernancePolicySnapshot.propTypes = {
  recentPublications: PropTypes.arrayOf(
    PropTypes.shape({
      documentId: PropTypes.number,
      documentTitle: PropTypes.string,
      versionId: PropTypes.number,
      version: PropTypes.number,
      locale: PropTypes.string,
      status: PropTypes.string,
      publishedAt: PropTypes.string,
    }),
  ),
  upcomingEffective: PropTypes.arrayOf(
    PropTypes.shape({
      documentId: PropTypes.number,
      documentTitle: PropTypes.string,
      versionId: PropTypes.number,
      version: PropTypes.number,
      locale: PropTypes.string,
      status: PropTypes.string,
      effectiveAt: PropTypes.string,
    }),
  ),
};

GovernancePolicySnapshot.defaultProps = {
  recentPublications: [],
  upcomingEffective: [],
};
