import PropTypes from 'prop-types';
import { ChatBubbleBottomCenterTextIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime, formatAbsolute } from '../../../utils/date.js';

function formatLabel(value) {
  return value ? value.replace(/_/g, ' ') : 'pending';
}

export default function ResponsesPanel({ responses, applications, onCreate, onEdit, onDelete }) {
  const applicationLookup = new Map(applications.map((application) => [application.id, application]));

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Replies</h2>
          <p className="text-sm text-slate-500">Track every touchpoint</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          Log reply
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="h-full overflow-auto px-6 py-6">
          {responses.length === 0 ? (
            <p className="text-center text-sm text-slate-400">No replies logged yet.</p>
          ) : (
            <ul className="space-y-4">
              {responses.map((response) => {
                const application = applicationLookup.get(response.applicationId);
                const title = application?.detail?.title ?? 'Opportunity';
                const company = application?.detail?.companyName ?? 'Company';
                const sentAt = response.sentAt ? new Date(response.sentAt) : null;
                return (
                  <li
                    key={response.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50/60 p-5 transition hover:border-accent/40 hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{company}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-600">
                          <ChatBubbleBottomCenterTextIcon className="h-4 w-4" aria-hidden="true" />
                          {formatLabel(response.direction)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-600">
                          {formatLabel(response.channel)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 text-slate-600">
                          {formatLabel(response.status)}
                        </span>
                      </div>
                    </div>
                    {response.subject ? <p className="text-sm font-semibold text-slate-800">{response.subject}</p> : null}
                    {response.body ? <p className="text-sm text-slate-600">{response.body}</p> : null}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span>{sentAt ? `Sent ${formatRelativeTime(sentAt)}` : 'Queued'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(response)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(response)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-1.5 font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                    {sentAt ? (
                      <p className="text-xs text-slate-400" title={formatAbsolute(sentAt)}>
                        Logged {formatAbsolute(sentAt)}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

ResponsesPanel.propTypes = {
  responses: PropTypes.arrayOf(PropTypes.object).isRequired,
  applications: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
