import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import AutoMatchSettingsForm from './AutoMatchSettingsForm.jsx';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatScore(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return numeric.toFixed(2);
}

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

export default function ProjectRosterDrawer({
  open,
  project,
  onClose,
  onSaveSettings,
  savingSettings,
  onAddFreelancer,
  onUpdateFreelancer,
  onRemoveFreelancer,
  savingFreelancerKey,
}) {
  const [newEntry, setNewEntry] = useState({
    freelancerId: '',
    freelancerName: '',
    freelancerRole: '',
    score: '',
    autoMatchEnabled: true,
  });

  const freelancers = useMemo(() => project?.autoMatchFreelancers ?? [], [project]);

  const handleNewEntryChange = (event) => {
    const { name, value, type, checked } = event.target;
    setNewEntry((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetNewEntry = () => {
    setNewEntry({ freelancerId: '', freelancerName: '', freelancerRole: '', score: '', autoMatchEnabled: true });
  };

  const handleNewEntrySubmit = async (event) => {
    event.preventDefault();
    if (!newEntry.freelancerId || !newEntry.freelancerName.trim()) {
      return;
    }
    await onAddFreelancer({
      freelancerId: Number(newEntry.freelancerId),
      freelancerName: newEntry.freelancerName.trim(),
      freelancerRole: newEntry.freelancerRole.trim() || undefined,
      score: newEntry.score === '' ? undefined : Number(newEntry.score),
      autoMatchEnabled: Boolean(newEntry.autoMatchEnabled),
    });
    resetNewEntry();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <div className="flex h-full flex-col bg-white shadow-2xl">
                    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">Roster</Dialog.Title>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{project?.title}</p>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </header>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Automation</h3>
                        <AutoMatchSettingsForm
                          project={project}
                          onSubmit={onSaveSettings}
                          submitting={savingSettings}
                        />
                      </section>

                      <section className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Freelancers</h3>
                          <span className="text-xs font-semibold text-slate-400">
                            {freelancers.length} total
                          </span>
                        </div>

                        <div className="space-y-3">
                          {freelancers.map((entry) => {
                            const saving = savingFreelancerKey === `${project?.id}:${entry.id}`;
                            return (
                              <div
                                key={entry.id}
                                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-slate-900">{entry.freelancerName}</p>
                                  <p className="text-xs uppercase tracking-wide text-slate-400">
                                    {entry.freelancerRole || '—'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                      Score {formatScore(entry.score)}
                                    </span>
                                    <span
                                      className={classNames(
                                        'rounded-full px-2.5 py-1 text-slate-700',
                                        STATUS_BADGES[entry.status] ?? 'bg-slate-200',
                                      )}
                                    >
                                      {entry.status}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                                      {entry.autoMatchEnabled ? 'Auto' : 'Manual'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateFreelancer(entry.id, {
                                        autoMatchEnabled: !entry.autoMatchEnabled,
                                      })
                                    }
                                    disabled={saving}
                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {entry.autoMatchEnabled ? 'Pause' : 'Activate'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateFreelancer(entry.id, {
                                        status: 'accepted',
                                        autoMatchEnabled: true,
                                      })
                                    }
                                    disabled={saving}
                                    className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Accept
                                  </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateFreelancer(entry.id, {
                                    status: 'rejected',
                                    autoMatchEnabled: false,
                                  })
                                }
                                disabled={saving}
                                className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => onRemoveFreelancer?.(entry.id)}
                                disabled={saving}
                                className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                          {freelancers.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-medium text-slate-500">
                              No freelancers yet.
                            </div>
                          )}
                        </div>

                        <form className="mt-4 grid gap-3 md:grid-cols-5" onSubmit={handleNewEntrySubmit}>
                          <input
                            required
                            name="freelancerId"
                            value={newEntry.freelancerId}
                            onChange={handleNewEntryChange}
                            placeholder="ID"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <input
                            required
                            name="freelancerName"
                            value={newEntry.freelancerName}
                            onChange={handleNewEntryChange}
                            placeholder="Name"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <input
                            name="freelancerRole"
                            value={newEntry.freelancerRole}
                            onChange={handleNewEntryChange}
                            placeholder="Role"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <input
                            name="score"
                            value={newEntry.score}
                            onChange={handleNewEntryChange}
                            placeholder="Score"
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                              <input
                                type="checkbox"
                                name="autoMatchEnabled"
                                checked={newEntry.autoMatchEnabled}
                                onChange={handleNewEntryChange}
                                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                              />
                              Auto
                            </label>
                            <button
                              type="submit"
                              disabled={savingFreelancerKey === `${project?.id}:new`}
                              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Add
                            </button>
                          </div>
                        </form>
                      </section>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
