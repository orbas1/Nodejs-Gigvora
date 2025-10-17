import PropTypes from 'prop-types';
import { RocketLaunchIcon, TrashIcon } from '@heroicons/react/24/outline';
import SegmentBadge from './SegmentBadge.jsx';

export default function CampaignList({ campaigns, onInspect, onDelete }) {
  if (!campaigns.length) {
    return <p className="text-sm text-slate-500">No campaigns yet. Add a launch.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      {campaigns.map((campaign) => (
        <button
          key={campaign.id}
          type="button"
          onClick={() => onInspect?.(campaign)}
          className="w-full rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left transition hover:border-accent hover:bg-white"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{campaign.name}</p>
              <p className="text-xs text-slate-500">{campaign.targetService || 'Service TBD'}</p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <SegmentBadge tone={campaign.status === 'active' ? 'emerald' : 'slate'}>{campaign.status}</SegmentBadge>
              <span className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 font-semibold text-slate-500">
                <RocketLaunchIcon className="h-3.5 w-3.5" aria-hidden="true" /> View
              </span>
            </div>
          </div>
          {campaign.launchDate ? (
            <p className="mt-3 text-xs text-slate-500">Launch {new Date(campaign.launchDate).toLocaleDateString()}</p>
          ) : null}
          <div className="mt-4 text-[11px]">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(campaign);
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

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.string,
      targetService: PropTypes.string,
      launchDate: PropTypes.string,
    }),
  ).isRequired,
  onInspect: PropTypes.func,
  onDelete: PropTypes.func,
};

CampaignList.defaultProps = {
  onInspect: undefined,
  onDelete: undefined,
};
