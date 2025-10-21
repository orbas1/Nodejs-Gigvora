import PropTypes from 'prop-types';
import { BuildingOffice2Icon, PlayCircleIcon } from '@heroicons/react/24/outline';

function formatRange(experience) {
  if (!experience.startDate && !experience.endDate) {
    return 'Dates TBD';
  }
  const start = experience.startDate
    ? new Date(experience.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Start';
  const end = experience.endDate
    ? new Date(experience.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : 'Present';
  return `${start} – ${end}`;
}

export default function ExperienceCard({ experience, onManage }) {
  const entries = Array.isArray(experience) ? experience : [];
  const sortedEntries = [...entries].sort((a, b) => {
    const first = a?.startDate ? new Date(a.startDate).getTime() : 0;
    const second = b?.startDate ? new Date(b.startDate).getTime() : 0;
    return second - first;
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Experience</p>
          <p className="text-xs text-slate-500">Highlight roles, achievements, and featured media.</p>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Manage
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {sortedEntries.length === 0 ? (
          <p className="text-sm text-slate-500">Tell clients about your most relevant milestones.</p>
        ) : (
          sortedEntries.slice(0, 3).map((item) => (
            <div key={item.id ?? `${item.title}-${item.company}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                  <BuildingOffice2Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{item.title || 'Role pending'}</p>
                  <p className="text-xs text-slate-500">{item.company || 'Organisation'}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{formatRange(item)}</p>
                  {item.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">{item.description}</p>
                  ) : null}
                  {item.mediaUrl ? (
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-500"
                    >
                      <PlayCircleIcon className="h-4 w-4" /> Preview media
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {sortedEntries.length > 3 ? (
        <p className="mt-3 text-xs text-slate-500">+{sortedEntries.length - 3} more saved in your profile.</p>
      ) : null}
    </div>
  );
}

ExperienceCard.propTypes = {
  experience: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      company: PropTypes.string,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      description: PropTypes.string,
      mediaUrl: PropTypes.string,
    }),
  ),
  onManage: PropTypes.func,
};

ExperienceCard.defaultProps = {
  experience: [],
  onManage: () => {},
};
