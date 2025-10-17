import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useMemo, useState } from 'react';

const PREFERENCE_LEVELS = ['watch', 'consider', 'preferred', 'primary'];

const FAVOURITE_DEFAULT = {
  mentorId: '',
  mentorName: '',
  mentorEmail: '',
  preferenceLevel: 'preferred',
  introductionNotes: '',
};

function normaliseString(value) {
  if (value == null) {
    return undefined;
  }
  const trimmed = `${value}`.trim();
  return trimmed || undefined;
}

function favouriteToForm(favourite) {
  if (!favourite) {
    return { ...FAVOURITE_DEFAULT };
  }
  return {
    mentorId: favourite.mentorId ? String(favourite.mentorId) : '',
    mentorName: favourite.mentorName || favourite.mentor?.name || '',
    mentorEmail: favourite.mentorEmail || favourite.mentor?.email || '',
    preferenceLevel: favourite.preferenceLevel || 'preferred',
    introductionNotes: favourite.introductionNotes || '',
  };
}

function buildFavouritePayload(form) {
  const payload = {};
  if (form.mentorId) payload.mentorId = Number(form.mentorId);
  const mentorName = normaliseString(form.mentorName);
  if (mentorName !== undefined) payload.mentorName = mentorName;
  const mentorEmail = normaliseString(form.mentorEmail);
  if (mentorEmail !== undefined) payload.mentorEmail = mentorEmail;
  if (form.preferenceLevel) payload.preferenceLevel = form.preferenceLevel;
  const notes = normaliseString(form.introductionNotes);
  if (notes !== undefined) payload.introductionNotes = notes;
  payload.favourite = true;
  return payload;
}

function FavouriteDrawer({ open, mode, form, busy, error, onChange, onClose, onSubmit, onDelete }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-lg bg-white p-8 shadow-2xl">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  {mode === 'edit' ? 'Edit favourite' : 'New favourite'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">Pin mentors so the team can rebook them in seconds.</p>

                <form className="mt-6 space-y-5" onSubmit={onSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="mentorName" className="text-sm font-semibold text-slate-700">
                      Mentor name
                    </label>
                    <input
                      type="text"
                      id="mentorName"
                      name="mentorName"
                      value={form.mentorName}
                      onChange={onChange}
                      placeholder="Mentor"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mentorEmail" className="text-sm font-semibold text-slate-700">
                      Mentor email
                    </label>
                    <input
                      type="email"
                      id="mentorEmail"
                      name="mentorEmail"
                      value={form.mentorEmail}
                      onChange={onChange}
                      placeholder="mentor@email.com"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="preferenceLevel" className="text-sm font-semibold text-slate-700">
                      Priority
                    </label>
                    <select
                      id="preferenceLevel"
                      name="preferenceLevel"
                      value={form.preferenceLevel}
                      onChange={onChange}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    >
                      {PREFERENCE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="introductionNotes" className="text-sm font-semibold text-slate-700">
                      Intro notes
                    </label>
                    <textarea
                      id="introductionNotes"
                      name="introductionNotes"
                      value={form.introductionNotes}
                      onChange={onChange}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      placeholder="Remind the team how they like to work, rates, or strengths."
                    />
                  </div>

                  {error ? (
                    <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
                  ) : null}

                  <div className="flex items-center justify-between">
                    {mode === 'edit' ? (
                      <button
                        type="button"
                        onClick={onDelete}
                        disabled={busy}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-60"
                      >
                        Remove favourite
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {busy ? 'Saving…' : 'Save favourite'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

FavouriteDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.object.isRequired,
  busy: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function MentoringMentorsPanel({ favourites, suggestions, actions, refreshing }) {
  const [drawer, setDrawer] = useState({ open: false, mode: 'create', favourite: null });
  const [form, setForm] = useState(() => favouriteToForm(null));
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!drawer.open) {
      setForm(favouriteToForm(null));
      setFormError(null);
      return;
    }
    if (drawer.mode === 'edit' && drawer.favourite) {
      setForm(favouriteToForm(drawer.favourite));
    } else {
      setForm(favouriteToForm(null));
    }
    setFormError(null);
  }, [drawer]);

  const handleOpenCreate = () => setDrawer({ open: true, mode: 'create', favourite: null });
  const handleOpenEdit = (favourite) => setDrawer({ open: true, mode: 'edit', favourite });
  const handleClose = () => {
    if (busy) {
      return;
    }
    setDrawer({ open: false, mode: 'create', favourite: null });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = buildFavouritePayload(form);
      if (drawer.mode === 'edit' && drawer.favourite) {
        await actions.updateFavourite(drawer.favourite.id, payload);
      } else {
        await actions.createFavourite(payload);
      }
      setDrawer({ open: false, mode: 'create', favourite: null });
    } catch (error) {
      setFormError(error?.body?.message || error?.message || 'Unable to save favourite.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!drawer.favourite) {
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await actions.deleteFavourite(drawer.favourite.id);
      setDrawer({ open: false, mode: 'create', favourite: null });
    } catch (error) {
      setFormError(error?.body?.message || error?.message || 'Unable to remove favourite.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdoptSuggestion = (suggestion) => {
    setDrawer({ open: true, mode: 'create', favourite: null });
    setForm({
      mentorId: suggestion.mentorId ? String(suggestion.mentorId) : '',
      mentorName: suggestion.name || suggestion.mentorName || suggestion.label || '',
      mentorEmail: suggestion.email || suggestion.mentorEmail || '',
      preferenceLevel: 'preferred',
      introductionNotes: suggestion.notes || suggestion.focus || '',
    });
    setFormError(null);
  };

  const favouriteList = useMemo(() => favourites.slice().sort((a, b) => {
    const order = PREFERENCE_LEVELS;
    return order.indexOf(a.preferenceLevel || 'preferred') - order.indexOf(b.preferenceLevel || 'preferred');
  }), [favourites]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Mentors</h2>
          <p className="text-sm text-slate-500">Keep your trusted partners pinned and explore new fits.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => actions.refreshSuggestions()}
            disabled={busy || refreshing}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-60"
          >
            {refreshing ? 'Refreshing…' : 'Refresh leads'}
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New favourite
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {favouriteList.map((favourite) => (
          <button
            key={favourite.id}
            type="button"
            onClick={() => handleOpenEdit(favourite)}
            className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {favourite.preferenceLevel || 'preferred'}
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{favourite.mentorName || 'Mentor'}</p>
            {favourite.mentorEmail ? (
              <p className="text-xs text-slate-500">{favourite.mentorEmail}</p>
            ) : null}
            {favourite.introductionNotes ? (
              <p className="mt-3 line-clamp-3 text-xs text-slate-500">{favourite.introductionNotes}</p>
            ) : null}
          </button>
        ))}
        {!favouriteList.length ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No favourites yet. Add the mentors your team already trusts.
          </div>
        ) : null}
      </div>

      <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Suggested mentors</h3>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Smart picks</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suggestions.map((suggestion) => (
            <div key={`${suggestion.mentorId ?? suggestion.email ?? suggestion.name}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{suggestion.name || suggestion.mentorName || suggestion.label}</p>
              {suggestion.email ? <p className="text-xs text-slate-500">{suggestion.email}</p> : null}
              {suggestion.focus ? <p className="mt-2 text-xs text-slate-500">{suggestion.focus}</p> : null}
              <button
                type="button"
                onClick={() => handleAdoptSuggestion(suggestion)}
                className="mt-3 w-full rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                Save as favourite
              </button>
            </div>
          ))}
          {!suggestions.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              No suggestions yet. Refresh to generate new mentor leads.
            </div>
          ) : null}
        </div>
      </div>

      <FavouriteDrawer
        open={drawer.open}
        mode={drawer.mode}
        form={form}
        busy={busy}
        error={formError}
        onChange={handleChange}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </section>
  );
}

MentoringMentorsPanel.propTypes = {
  favourites: PropTypes.arrayOf(PropTypes.object).isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.object).isRequired,
  actions: PropTypes.shape({
    createFavourite: PropTypes.func.isRequired,
    updateFavourite: PropTypes.func.isRequired,
    deleteFavourite: PropTypes.func.isRequired,
    refreshSuggestions: PropTypes.func.isRequired,
  }).isRequired,
  refreshing: PropTypes.bool,
};
