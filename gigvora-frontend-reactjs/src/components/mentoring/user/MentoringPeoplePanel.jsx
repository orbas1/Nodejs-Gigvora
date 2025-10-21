import { useState } from 'react';
import PropTypes from 'prop-types';
import { HeartIcon, UserPlusIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';

function MentorBadge({ label }) {
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>;
}

function MentorCard({ mentor, action, secondaryAction }) {
  const name = [mentor?.firstName, mentor?.lastName].filter(Boolean).join(' ') || `Mentor #${mentor?.id}`;
  const headline = mentor?.profile?.headline || mentor?.profile?.missionStatement || 'Mentor';
  const badges = [];
  if (mentor?.profile?.industry) {
    badges.push(mentor.profile.industry);
  }
  if (mentor?.profile?.seniority) {
    badges.push(mentor.profile.seniority);
  }

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-900">{name}</h4>
        <p className="text-xs text-slate-500">{headline}</p>
        {badges.length ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {badges.map((badge) => (
              <MentorBadge key={badge} label={badge} />
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
        {action}
        {secondaryAction}
      </div>
    </article>
  );
}

export default function MentoringPeoplePanel({
  favourites = [],
  suggestions = [],
  canEdit = false,
  onAddFavourite,
  onRemoveFavourite,
  onBook,
}) {
  const [view, setView] = useState('favourites');
  const items = view === 'favourites' ? favourites : suggestions;
  const emptyLabel = view === 'favourites' ? 'No favourites saved yet.' : 'No suggestions yet.';

  return (
    <section className="flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView('favourites')}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              view === 'favourites'
                ? 'border-accent bg-accent text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-accent/50 hover:text-accent'
            }`}
          >
            Faves
          </button>
          <button
            type="button"
            onClick={() => setView('suggestions')}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              view === 'suggestions'
                ? 'border-accent bg-accent text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-accent/50 hover:text-accent'
            }`}
          >
            Picks
          </button>
        </div>
        {canEdit && view === 'favourites' ? (
          <button
            type="button"
            onClick={onBook}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
          >
            <ArrowRightCircleIcon className="h-4 w-4" />
            <span>New session</span>
          </button>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.length ? (
          items.map((mentor) => (
            <MentorCard
              key={mentor.id ?? mentor.mentorId}
              mentor={mentor}
              action={
                view === 'favourites' ? (
                  canEdit ? (
                    <button
                      type="button"
                      onClick={() => onRemoveFavourite?.(mentor.id ?? mentor.mentorId)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                    >
                      <HeartIcon className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
                  ) : null
                ) : (
                  canEdit ? (
                    <button
                      type="button"
                      onClick={() => onAddFavourite?.(mentor.id ?? mentor.mentorId)}
                      className="inline-flex items-center gap-1 rounded-full border border-accent/50 px-3 py-1 text-accent transition hover:bg-accentSoft"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                  ) : null
                )
              }
              secondaryAction={
                canEdit ? (
                  <button
                    type="button"
                    onClick={() => onBook?.(mentor)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-accent/40 hover:text-accent"
                  >
                    <ArrowRightCircleIcon className="h-4 w-4" />
                    <span>Book</span>
                  </button>
                ) : null
              }
            />
          ))
        ) : (
          <div className="col-span-full flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}

MentoringPeoplePanel.propTypes = {
  favourites: PropTypes.arrayOf(PropTypes.object),
  suggestions: PropTypes.arrayOf(PropTypes.object),
  canEdit: PropTypes.bool,
  onAddFavourite: PropTypes.func,
  onRemoveFavourite: PropTypes.func,
  onBook: PropTypes.func,
};

