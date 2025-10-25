import { useState } from 'react';
import PropTypes from 'prop-types';
import { formatMentorName, formatMentorContactLine } from '../../../../../utils/mentoring.js';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  try {
    return date.toLocaleDateString();
  } catch (error) {
    return '—';
  }
}

function FavouriteItem({ favourite, onUpdate, onRemove, pending, onOpen }) {
  const [notes, setNotes] = useState(favourite.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const mentorDetails = favourite.mentor ?? favourite;
  const mentorId = favourite.mentorId ?? mentorDetails?.id;
  const mentorName = formatMentorName(mentorDetails);
  const mentorContact = formatMentorContactLine(mentorDetails);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await onUpdate(favourite.mentorId, notes);
    } catch (saveError) {
      setError(saveError?.message || 'Unable to update notes.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = () => {
    if (mentorId) {
      onOpen(mentorId);
    }
  };

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={handleOpen}
            className="text-left text-sm font-semibold text-slate-900 transition hover:text-blue-700"
          >
            {mentorName}
          </button>
          <p className="text-xs text-slate-500">{mentorContact}</p>
          <p className="mt-2 text-xs text-slate-400">Pinned {formatDate(favourite.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(favourite.mentorId)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
          disabled={pending || saving}
        >
          Remove
        </button>
      </div>
      <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
          disabled={pending || saving}
        >
          Save notes
        </button>
      </div>
    </li>
  );
}

FavouriteItem.propTypes = {
  favourite: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  onOpen: PropTypes.func.isRequired,
};

function SuggestionCard({ suggestion, onFavourite, onStart, onOpen, pending }) {
  const mentorDetails = suggestion.mentor ?? suggestion;
  const mentorId = suggestion.mentorId ?? mentorDetails?.id;
  const mentorName = formatMentorName(mentorDetails);
  const mentorContact = formatMentorContactLine(mentorDetails);

  const handleFavourite = () => onFavourite(suggestion.mentorId);
  const handleStart = () => onStart(suggestion.mentorId);
  const handleOpen = () => {
    if (mentorId) {
      onOpen(mentorId);
    }
  };

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={handleOpen}
            className="text-left text-sm font-semibold text-slate-900 transition hover:text-blue-700"
          >
            {mentorName}
          </button>
          <p className="text-xs text-slate-500">{mentorContact}</p>
          <p className="text-xs text-slate-500">{suggestion.reason || 'Smart recommendation'}</p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {suggestion.source || 'AI'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">Suggested {formatDate(suggestion.generatedAt)}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleStart}
          className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          disabled={pending}
        >
          Book session
        </button>
        <button
          type="button"
          onClick={handleFavourite}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          disabled={pending}
        >
          Favourite
        </button>
        <button
          type="button"
          onClick={handleOpen}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          disabled={pending}
        >
          View profile
        </button>
      </div>
    </li>
  );
}

SuggestionCard.propTypes = {
  suggestion: PropTypes.object.isRequired,
  onFavourite: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  pending: PropTypes.bool,
};

function renderSkeletonCard(key) {
  return (
    <li
      key={key}
      className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-50/80"
    />
  );
}

export default function MentoringMentorPanels({
  favourites,
  suggestions,
  onFavourite,
  onRemoveFavourite,
  onStartSession,
  pending,
  loading,
  onOpenMentor,
  onRefreshRecommendations,
}) {
  const favouriteItems = favourites?.length
    ? favourites.map((favourite) => (
        <FavouriteItem
          key={favourite.id || favourite.mentorId}
          favourite={favourite}
          onUpdate={(mentorId, notes) => onFavourite(mentorId, notes)}
          onRemove={onRemoveFavourite}
          pending={pending}
          onOpen={onOpenMentor}
        />
      ))
    : loading
    ? [renderSkeletonCard('favourites-skeleton')]
    : [
        <li
          key="no-favourites"
          className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500"
        >
          No favourites yet. Pin mentors you enjoyed working with.
        </li>,
      ];

  const suggestionItems = suggestions?.length
    ? suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id || suggestion.mentorId}
          suggestion={suggestion}
          onFavourite={(mentorId) => onFavourite(mentorId)}
          onStart={(mentorId) => onStartSession(mentorId)}
          onOpen={onOpenMentor}
          pending={pending}
        />
      ))
    : loading
    ? [renderSkeletonCard('suggestions-skeleton')]
    : [
        <li
          key="no-suggestions"
          className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500"
        >
          We’ll surface mentors once you have a few favourites or purchases logged.
        </li>,
      ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Trusted mentors</p>
        <h3 className="text-lg font-semibold text-slate-900">Favourite mentors</h3>
        <p className="mt-2 text-xs text-slate-500">
          Keep notes so you can rebook mentors quickly for pipelines, retros, or advisory calls.
        </p>
        <ul className="mt-4 space-y-3">{favouriteItems}</ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Smart picks</p>
            <h3 className="text-lg font-semibold text-slate-900">Suggested mentors</h3>
            <p className="mt-2 text-xs text-slate-500">
              Recommendations blend your favourite profiles, open gigs, and growth goals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" aria-hidden /> Refreshing
              </span>
            ) : null}
            {onRefreshRecommendations ? (
              <button
                type="button"
                onClick={onRefreshRecommendations}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                disabled={pending}
              >
                Refresh suggestions
              </button>
            ) : null}
          </div>
        </div>
        <ul className="mt-4 space-y-3">{suggestionItems}</ul>
      </section>
    </div>
  );
}

MentoringMentorPanels.propTypes = {
  favourites: PropTypes.arrayOf(PropTypes.object),
  suggestions: PropTypes.arrayOf(PropTypes.object),
  onFavourite: PropTypes.func.isRequired,
  onRemoveFavourite: PropTypes.func.isRequired,
  onStartSession: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  loading: PropTypes.bool,
  onOpenMentor: PropTypes.func.isRequired,
  onRefreshRecommendations: PropTypes.func,
};
