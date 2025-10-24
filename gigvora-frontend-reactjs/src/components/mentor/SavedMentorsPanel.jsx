import PropTypes from 'prop-types';
import { ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';

export default function SavedMentorsPanel({ mentors, onSelect, onRemove }) {
  if (!Array.isArray(mentors) || mentors.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Saved mentors</p>
        <p className="mt-2 text-sm text-slate-600">
          Shortlist mentors to compare packages and revisit them after you explore other marketplace tracks.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Saved mentors</p>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {mentors.length}
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {mentors.map((mentor) => (
          <li
            key={mentor.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{mentor.name}</p>
              {mentor.headline ? <p className="mt-1 truncate text-xs text-slate-500">{mentor.headline}</p> : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(mentor.expertise ?? []).slice(0, 3).map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
              {mentor.savedAt ? (
                <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-400">
                  Saved {formatRelativeTime(mentor.savedAt)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => onSelect?.(mentor.id)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                View
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onRemove?.(mentor.id)}
                className="inline-flex items-center gap-1 rounded-full border border-transparent bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                aria-label={`Remove ${mentor.name} from saved mentors`}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" /> Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

SavedMentorsPanel.propTypes = {
  mentors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      headline: PropTypes.string,
      expertise: PropTypes.arrayOf(PropTypes.string),
      savedAt: PropTypes.string,
    }),
  ),
  onSelect: PropTypes.func,
  onRemove: PropTypes.func,
};

SavedMentorsPanel.defaultProps = {
  mentors: [],
  onSelect: undefined,
  onRemove: undefined,
};
