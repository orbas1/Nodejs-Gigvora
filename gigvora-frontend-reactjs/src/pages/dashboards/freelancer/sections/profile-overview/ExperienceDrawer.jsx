import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

function emptyExperience(index = 0) {
  return {
    id: `experience-${index}`,
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
    mediaUrl: '',
  };
}

function normaliseExperience(experience) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return [emptyExperience()];
  }
  return experience.map((item, index) => ({
    id: item.id ?? `experience-${index}`,
    title: item.title ?? '',
    company: item.company ?? '',
    startDate: item.startDate ? item.startDate.slice(0, 10) : '',
    endDate: item.endDate ? item.endDate.slice(0, 10) : '',
    description: item.description ?? '',
    mediaUrl: item.mediaUrl ?? '',
  }));
}

function sanitizeExperience(entries) {
  return entries
    .filter((entry) => entry.title?.trim())
    .map((entry) => ({
      title: entry.title.trim(),
      company: entry.company?.trim() || '',
      startDate: entry.startDate || null,
      endDate: entry.endDate || null,
      description: entry.description?.trim() || '',
      mediaUrl: entry.mediaUrl?.trim() || '',
    }));
}

export default function ExperienceDrawer({ open, onClose, experience, onSave, saving }) {
  const [entries, setEntries] = useState(() => normaliseExperience(experience));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setEntries(normaliseExperience(experience));
    setError(null);
  }, [open, experience]);

  const canRemove = useMemo(() => entries.length > 1, [entries.length]);

  const updateEntry = useCallback((id, field, value) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    );
  }, []);

  const addEntry = useCallback(() => {
    setEntries((current) => [...current, emptyExperience(current.length)]);
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries((current) => (current.length <= 1 ? current : current.filter((entry) => entry.id !== id)));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const payload = sanitizeExperience(entries);
      if (payload.length === 0) {
        setError('Add at least one experience entry before saving.');
        return;
      }
      const hasInvalidRange = entries.some(
        (entry) =>
          entry.startDate &&
          entry.endDate &&
          new Date(entry.startDate).getTime() > new Date(entry.endDate).getTime(),
      );
      if (hasInvalidRange) {
        setError('Ensure end dates are not before the start dates.');
        return;
      }
      await onSave({ experience: payload });
      onClose();
    },
    [entries, onClose, onSave],
  );

  const disableClose = saving;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={disableClose ? () => {} : onClose}>
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
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Experience</Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">
                  Capture the roles, highlights, and media that prove your expertise.
                </p>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>
                ) : null}

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                  {entries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="flex-1 space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Title
                              <input
                                type="text"
                                value={entry.title}
                                onChange={(event) => updateEntry(entry.id, 'title', event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                                placeholder="Lead designer"
                                required
                              />
                            </label>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Company
                              <input
                                type="text"
                                value={entry.company}
                                onChange={(event) => updateEntry(entry.id, 'company', event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                                placeholder="Acme Studio"
                              />
                            </label>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Start
                              <input
                                type="date"
                                value={entry.startDate}
                                onChange={(event) => updateEntry(entry.id, 'startDate', event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                              />
                            </label>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              End
                              <input
                                type="date"
                                value={entry.endDate}
                                onChange={(event) => updateEntry(entry.id, 'endDate', event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                              />
                            </label>
                          </div>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Summary
                            <textarea
                              value={entry.description}
                              onChange={(event) => updateEntry(entry.id, 'description', event.target.value)}
                              rows={3}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                              placeholder="What did you deliver?"
                            />
                          </label>
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Media URL
                            <input
                              type="url"
                              value={entry.mediaUrl}
                              onChange={(event) => updateEntry(entry.id, 'mediaUrl', event.target.value)}
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                              placeholder="https://video.example.com/case-study"
                            />
                          </label>
                        </div>
                        {canRemove ? (
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="self-start rounded-full border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={addEntry}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    >
                      <PlusIcon className="h-4 w-4" /> Add experience
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disableClose}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {saving ? 'Saving…' : 'Save experience'}
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

ExperienceDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  experience: PropTypes.arrayOf(PropTypes.object),
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

ExperienceDrawer.defaultProps = {
  experience: [],
  saving: false,
};
