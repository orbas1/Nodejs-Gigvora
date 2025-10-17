import PropTypes from 'prop-types';
import { TrashIcon } from '@heroicons/react/24/outline';
import SegmentBadge from './SegmentBadge.jsx';

export default function CampaignPreview({ campaign, onDelete }) {
  if (!campaign) {
    return null;
  }

  const launchDate = campaign.launchDate ? new Date(campaign.launchDate) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{campaign.name}</h2>
          <p className="text-sm text-slate-500">{campaign.targetService || 'Service TBD'}</p>
        </div>
        <SegmentBadge tone={campaign.status === 'active' ? 'emerald' : 'slate'}>{campaign.status}</SegmentBadge>
      </div>

      <dl className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Launch</dt>
          <dd className="text-sm text-slate-900">{launchDate ? launchDate.toLocaleDateString() : 'Not scheduled'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Owner</dt>
          <dd className="text-sm text-slate-900">{campaign.ownerName || 'Unassigned'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{campaign.notes || 'None'}</dd>
        </div>
      </dl>

      <div>
        <button
          type="button"
          onClick={() => onDelete?.(campaign)}
          className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" /> Delete
        </button>
      </div>
    </div>
  );
}

CampaignPreview.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    status: PropTypes.string,
    targetService: PropTypes.string,
    launchDate: PropTypes.string,
    ownerName: PropTypes.string,
    notes: PropTypes.string,
  }),
  onDelete: PropTypes.func,
};

CampaignPreview.defaultProps = {
  campaign: null,
  onDelete: undefined,
};
