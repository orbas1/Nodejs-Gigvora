import PropTypes from 'prop-types';
import { DocumentMagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import SegmentBadge from './SegmentBadge.jsx';

export default function ProposalList({ proposals, onInspect, onDelete }) {
  if (!proposals.length) {
    return <p className="text-sm text-slate-500">No docs yet. Draft the first proposal.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {proposals.map((proposal) => (
        <button
          key={proposal.id}
          type="button"
          onClick={() => onInspect?.(proposal)}
          className="w-full rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left transition hover:border-accent hover:bg-white"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{proposal.title}</p>
              <p className="text-xs text-slate-500">{proposal.deal?.clientName ?? 'Client'} </p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <SegmentBadge tone={proposal.status === 'accepted' ? 'emerald' : 'slate'}>
                {proposal.status ?? 'draft'}
              </SegmentBadge>
              <span className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 font-semibold text-slate-500">
                <DocumentMagnifyingGlassIcon className="h-3.5 w-3.5" aria-hidden="true" /> View
              </span>
            </div>
          </div>
          {proposal.sentAt ? (
            <p className="mt-3 text-xs text-slate-500">Sent {new Date(proposal.sentAt).toLocaleDateString()}</p>
          ) : null}
          <div className="mt-4 text-[11px]">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(proposal);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
            >
              <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" /> Delete
            </button>
          </div>
        </button>
      ))}
    </div>
  );
}

ProposalList.propTypes = {
  proposals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string,
      sentAt: PropTypes.string,
      deal: PropTypes.shape({ clientName: PropTypes.string }),
    }),
  ).isRequired,
  onInspect: PropTypes.func,
  onDelete: PropTypes.func,
};

ProposalList.defaultProps = {
  onInspect: undefined,
  onDelete: undefined,
};
