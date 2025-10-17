import PropTypes from 'prop-types';
import { TrashIcon } from '@heroicons/react/24/outline';
import SegmentBadge from './SegmentBadge.jsx';

export default function ProposalPreview({ proposal, onDelete }) {
  if (!proposal) {
    return null;
  }

  const sentDate = proposal.sentAt ? new Date(proposal.sentAt) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{proposal.title}</h2>
          <p className="text-sm text-slate-500">{proposal.deal?.clientName ?? 'Client'}</p>
        </div>
        <SegmentBadge tone={proposal.status === 'accepted' ? 'emerald' : 'slate'}>
          {proposal.status ?? 'draft'}
        </SegmentBadge>
      </div>

      <dl className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Template</dt>
          <dd className="text-sm text-slate-900">{proposal.template?.name ?? 'Custom'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sent</dt>
          <dd className="text-sm text-slate-900">{sentDate ? sentDate.toLocaleDateString() : 'Not sent'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{proposal.notes || 'None'}</dd>
        </div>
      </dl>

      <div>
        <button
          type="button"
          onClick={() => onDelete?.(proposal)}
          className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" /> Delete
        </button>
      </div>
    </div>
  );
}

ProposalPreview.propTypes = {
  proposal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    status: PropTypes.string,
    sentAt: PropTypes.string,
    deal: PropTypes.shape({ clientName: PropTypes.string }),
    template: PropTypes.shape({ name: PropTypes.string }),
    notes: PropTypes.string,
  }),
  onDelete: PropTypes.func,
};

ProposalPreview.defaultProps = {
  proposal: null,
  onDelete: undefined,
};
