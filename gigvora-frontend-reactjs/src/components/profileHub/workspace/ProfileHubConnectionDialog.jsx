import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import clsx from 'clsx';
import UserAvatar from '../../UserAvatar.jsx';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'connections', label: 'Connections' },
  { value: 'members', label: 'Members' },
  { value: 'private', label: 'Private' },
];

export default function ProfileHubConnectionDialog({ open, connection, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => buildForm(connection));

  useEffect(() => {
    setForm(buildForm(connection));
  }, [connection, open]);

  if (!connection) {
    return null;
  }

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      connectionId: connection.id,
      relationshipTag: form.relationshipTag,
      notes: form.notes,
      favourite: form.favourite,
      visibility: form.visibility,
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
                    name={connection.counterpart?.name}
                    imageUrl={connection.counterpart?.avatarUrl}
                    seed={connection.counterpart?.avatarSeed}
                    size="md"
                    showGlow={false}
                  />
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {connection.counterpart?.name ?? 'Connection'}
                    </Dialog.Title>
                    <p className="text-sm text-slate-500">
                      {connection.counterpart?.headline ?? connection.counterpart?.userType ?? 'Member'}
                    </p>
                  </div>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="text-sm font-medium text-slate-600">
                    Relationship tag
                    <input
                      type="text"
                      value={form.relationshipTag}
                      onChange={(event) => handleChange('relationshipTag', event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      placeholder="Mentor"
                    />
                  </label>

                  <label className="text-sm font-medium text-slate-600">
                    Visibility
                    <select
                      value={form.visibility}
                      onChange={(event) => handleChange('visibility', event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    >
                      {VISIBILITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-600">
                    Notes
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(event) => handleChange('notes', event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                      placeholder="Context for this connection"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600">
                    Favourite
                    <Switch
                      checked={form.favourite}
                      onChange={(value) => handleChange('favourite', value)}
                      className={clsx(
                        form.favourite ? 'bg-amber-400' : 'bg-slate-200',
                        'relative inline-flex h-6 w-11 items-center rounded-full transition'
                      )}
                    >
                      <span
                        className={clsx(
                          form.favourite ? 'translate-x-6' : 'translate-x-1',
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

                  <div className="flex justify-end gap-3 pt-4">
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
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function buildForm(connection) {
  if (!connection) {
    return {
      relationshipTag: '',
      notes: '',
      favourite: false,
      visibility: 'connections',
      lastInteractedAt: '',
    };
  }

  return {
    relationshipTag: connection.relationshipTag ?? '',
    notes: connection.notes ?? '',
    favourite: Boolean(connection.favourite),
    visibility: connection.visibility ?? 'connections',
    lastInteractedAt: connection.lastInteractedAt ? connection.lastInteractedAt.slice(0, 10) : '',
  };
}
