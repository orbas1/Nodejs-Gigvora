import { useState } from 'react';
import PropTypes from 'prop-types';

function FavouriteItem({ favourite, onUpdate, onRemove, pending }) {
  const [notes, setNotes] = useState(favourite.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {favourite.mentor?.fullName || favourite.mentor?.name || favourite.mentor?.firstName || 'Mentor'}
          </p>
          <p className="text-xs text-slate-500">
            {favourite.mentor?.email || favourite.mentor?.location || 'No contact set'}
          </p>
          <p className="mt-2 text-xs text-slate-400">Pinned {new Date(favourite.createdAt).toLocaleDateString()}</p>
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
      <div className="mt-3 flex items-center justify-end gap-3">
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
};

function SuggestionCard({ suggestion, onFavourite, onStart, pending }) {
  const handleFavourite = () => onFavourite(suggestion.mentorId);
  const handleStart = () => onStart(suggestion.mentorId);

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {suggestion.mentor?.fullName || suggestion.mentor?.name || 'Mentor'}
          </p>
          <p className="text-xs text-slate-500">{suggestion.reason || 'Smart recommendation'}</p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {suggestion.source || 'AI'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">Suggested {new Date(suggestion.generatedAt).toLocaleDateString()}</p>
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
      </div>
    </li>
  );
}

SuggestionCard.propTypes = {
  suggestion: PropTypes.object.isRequired,
  onFavourite: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  pending: PropTypes.bool,
};

export default function MentoringMentorPanels({
  favourites,
  suggestions,
  onFavourite,
  onRemoveFavourite,
  onStartSession,
  pending,
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Trusted mentors</p>
        <h3 className="text-lg font-semibold text-slate-900">Favourite mentors</h3>
        <p className="mt-2 text-xs text-slate-500">
          Keep notes so you can rebook mentors quickly for pipelines, retros, or advisory calls.
        </p>
        <ul className="mt-4 space-y-3">
          {favourites?.length ? (
            favourites.map((favourite) => (
              <FavouriteItem
                key={favourite.id || favourite.mentorId}
                favourite={favourite}
                onUpdate={(mentorId, notes) => onFavourite(mentorId, notes)}
                onRemove={onRemoveFavourite}
                pending={pending}
              />
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
              No favourites yet. Pin mentors you enjoyed working with.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Smart picks</p>
        <h3 className="text-lg font-semibold text-slate-900">Suggested mentors</h3>
        <p className="mt-2 text-xs text-slate-500">
          Recommendations blend your favourite profiles, open gigs, and growth goals.
        </p>
        <ul className="mt-4 space-y-3">
          {suggestions?.length ? (
            suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id || suggestion.mentorId}
                suggestion={suggestion}
                onFavourite={(mentorId) => onFavourite(mentorId)}
                onStart={(mentorId) => onStartSession(mentorId)}
                pending={pending}
              />
            ))
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
              We’ll surface mentors once you have a few favourites or purchases logged.
            </li>
          )}
        </ul>
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
};
