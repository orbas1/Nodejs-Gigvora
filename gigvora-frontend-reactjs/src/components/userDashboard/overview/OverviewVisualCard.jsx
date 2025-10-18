import PropTypes from 'prop-types';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import UserAvatar from '../../UserAvatar.jsx';

export default function OverviewVisualCard({ data, onEdit, canEdit }) {
  if (!data) {
    return null;
  }

  const bannerStyle = data.bannerImageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.3)), url(${data.bannerImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage: 'linear-gradient(135deg, rgba(148, 163, 184, 0.7), rgba(226, 232, 240, 0.6))',
      };

  return (
    <div className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Visuals</h3>
        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <div className="h-40 w-full" style={bannerStyle} />
        <div className="-mt-12 flex items-center gap-4 px-6 pb-6">
          <UserAvatar
            name={data.greetingName ?? 'Member'}
            imageUrl={data.avatarUrl}
            size="lg"
            className="border-4 border-white shadow-xl"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">{data.greetingName ?? 'Member'}</p>
            <p className="text-sm text-slate-500">{data.headline ?? '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

OverviewVisualCard.propTypes = {
  data: PropTypes.shape({
    greetingName: PropTypes.string,
    headline: PropTypes.string,
    avatarUrl: PropTypes.string,
    bannerImageUrl: PropTypes.string,
  }),
  onEdit: PropTypes.func,
  canEdit: PropTypes.bool,
};
