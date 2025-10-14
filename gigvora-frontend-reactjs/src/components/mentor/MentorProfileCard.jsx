import { StarIcon } from '@heroicons/react/24/solid';
import { formatRelativeTime } from '../../utils/date.js';

export default function MentorProfileCard({ mentor, onBook, onView }) {
  const expertise = Array.isArray(mentor.expertise) ? mentor.expertise.slice(0, 4) : [];
  const packages = Array.isArray(mentor.packages) ? mentor.packages.slice(0, 2) : [];
  const responseTime = mentor.responseTime ? formatRelativeTime(mentor.responseTime) : 'Responds within a day';

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{mentor.region}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{mentor.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{mentor.headline}</p>
        </div>
        <div className="text-right">
          <p className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
            <StarIcon className="h-4 w-4" /> {mentor.rating?.toFixed?.(1) ?? '5.0'}
          </p>
          <p className="mt-2 text-xs text-slate-400">{mentor.reviews} reviews</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {expertise.map((item) => (
          <span key={item} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {item}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-600">{mentor.bio}</p>
      <div className="mt-5 grid gap-3">
        {packages.map((pack) => (
          <div key={pack.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">{pack.name}</p>
              <p>{pack.description}</p>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {pack.currency}
              {pack.price}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <p>{mentor.sessionFee?.currency ?? '£'}{mentor.sessionFee?.amount ?? 180} per session • {responseTime}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView?.(mentor)}
            className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            View profile
          </button>
          <button
            type="button"
            onClick={() => onBook?.(mentor)}
            className="rounded-full bg-accent px-4 py-2 font-semibold text-white transition hover:bg-accentDark"
          >
            Book session
          </button>
        </div>
      </div>
    </article>
  );
}
