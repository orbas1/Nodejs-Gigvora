import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import clsx from 'clsx';
import UserAvatar from '../../UserAvatar.jsx';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'muted', label: 'Muted' },
  { value: 'blocked', label: 'Blocked' },
];

export default function ProfileHubFollowerDialog({ open, follower, onClose, onSave, onDelete, saving }) {
  const [form, setForm] = useState(() => buildForm(follower));

  useEffect(() => {
    setForm(buildForm(follower));
  }, [follower, open]);

  if (!follower) {
    return null;
  }

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      followerId: follower.followerId,
      status: form.status,
      displayName: form.displayName,
      tags: form.tags,
      notes: form.notes,
      notificationsEnabled: form.notificationsEnabled,
      lastInteractedAt: form.lastInteractedAt,
    });
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-6">
          <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full rounded-3xl bg-white p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    name={follower.summary?.name}
                    imageUrl={follower.summary?.avatarUrl}
                    seed={follower.summary?.avatarSeed}
                    size="md"
                    showGlow={false}
                  />
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {follower.summary?.name ?? `Follower #${follower.followerId}`}
                    </Dialog.Title>
                    <p className="text-sm text-slate-500">{follower.summary?.headline ?? follower.summary?.userType ?? 'Member'}</p>
                  </div>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-medium text-slate-600">
                      Status
                      <select
                        value={form.status}
                        onChange={(event) => handleChange('status', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-600">
                      Display name
                      <input
                        type="text"
                        value={form.displayName}
                        onChange={(event) => handleChange('displayName', event.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      />
                    </label>
                  </div>

                  <label className="text-sm font-medium text-slate-600">
                    Tags
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(event) => handleChange('tags', event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      placeholder="Comma separated"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-600">
                    Notes
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(event) => handleChange('notes', event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600">
                    Notifications
                    <Switch
                      checked={form.notificationsEnabled}
                      onChange={(value) => handleChange('notificationsEnabled', value)}
                      className={clsx(
                        form.notificationsEnabled ? 'bg-accent' : 'bg-slate-200',
                        'relative inline-flex h-6 w-11 items-center rounded-full transition'
                      )}
                    >
                      <span
                        className={clsx(
                          form.notificationsEnabled ? 'translate-x-6' : 'translate-x-1',
                          'inline-block h-4 w-4 transform rounded-full bg-white transition'
                        )}
                      />
                    </Switch>
                  </label>

                  <label className="text-sm font-medium text-slate-600">
                    Last touch
                    <input
                      type="date"
                      value={form.lastInteractedAt}
                      onChange={(event) => handleChange('lastInteractedAt', event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>

                  <div className="flex flex-wrap justify-between gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => onDelete(follower.followerId)}
                      disabled={saving}
                      className="inline-flex items-center rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove follower
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save changes
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

function buildForm(follower) {
  if (!follower) {
    return {
      status: 'active',
      displayName: '',
      tags: '',
      notes: '',
      notificationsEnabled: true,
      lastInteractedAt: '',
    };
  }

  return {
    status: follower.status ?? 'active',
    displayName: follower.displayName ?? '',
    tags: Array.isArray(follower.tags) ? follower.tags.join(', ') : '',
    notes: follower.notes ?? '',
    notificationsEnabled: follower.notificationsEnabled !== false,
    lastInteractedAt: follower.lastInteractedAt ? follower.lastInteractedAt.slice(0, 10) : '',
  };
}
