import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const TABS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'sent', label: 'Sent' },
  { id: 'active', label: 'Active' },
  { id: 'invite', label: 'Invite' },
];

function ConnectionItem({ item, actionArea }) {
  const name = item?.user?.name || item?.displayName || 'Connection';
  const subtitle = item?.user?.headline || item?.user?.email || item?.status || '';

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {actionArea ? <div className="flex flex-wrap gap-2">{actionArea}</div> : null}
    </li>
  );
}

ConnectionsDialog.propTypes = {
  open: PropTypes.bool,
  connections: PropTypes.shape({
    pendingIncoming: PropTypes.array,
    pendingOutgoing: PropTypes.array,
    accepted: PropTypes.array,
  }),
  onClose: PropTypes.func,
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  onDelete: PropTypes.func,
  saving: PropTypes.bool,
};

ConnectionsDialog.defaultProps = {
  open: false,
  connections: {},
  onClose: () => {},
  onCreate: null,
  onUpdate: null,
  onDelete: null,
  saving: false,
};

export default function ConnectionsDialog({
  open,
  connections = {},
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  saving,
}) {
  const [tab, setTab] = useState('inbox');
  const [invite, setInvite] = useState({ email: '', userId: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setTab('inbox');
      setInvite({ email: '', userId: '' });
      setError(null);
    }
  }, [open]);

  const lists = useMemo(
    () => ({
      inbox: connections.pendingIncoming || [],
      sent: connections.pendingOutgoing || [],
      active: connections.accepted || [],
    }),
    [connections.pendingIncoming, connections.pendingOutgoing, connections.accepted],
  );

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    if (!onCreate) {
      return;
    }
    if (!invite.email && !invite.userId) {
      setError('Provide an email or user ID to send an invitation.');
      return;
    }
    if (invite.email && !/.+@.+\..+/.test(invite.email)) {
      setError('Enter a valid email address.');
      return;
    }
    const payload = invite.userId
      ? { targetUserId: Number(invite.userId) }
      : { email: invite.email.trim() };
    await onCreate(payload);
    setInvite({ email: '', userId: '' });
    setError(null);
  };

  const disableInvite = saving || (!invite.email && !invite.userId);
  const disableClose = saving;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={disableClose ? () => {} : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Network</Dialog.Title>
                  <div className="flex gap-2 text-sm">
                    {TABS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={
                          tab === item.id
                            ? 'rounded-full bg-slate-900 px-4 py-1.5 font-semibold text-white'
                            : 'rounded-full bg-slate-100 px-4 py-1.5 text-slate-600'
                        }
                        disabled={saving}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                  {tab !== 'invite' ? (
                    <ul className="space-y-3">
                      {lists[tab]?.length ? (
                        lists[tab].map((item) => (
                          <ConnectionItem
                            key={item.id || item.createdAt}
                            item={item}
                            actionArea={
                              tab === 'inbox'
                                ? [
                                    <button
                                      key="accept"
                                      type="button"
                                      onClick={() => onUpdate?.(item.id, { status: 'accepted' })}
                                      className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                      disabled={saving}
                                    >
                                      Accept
                                    </button>,
                                    <button
                                      key="decline"
                                      type="button"
                                      onClick={() => onUpdate?.(item.id, { status: 'rejected' })}
                                      className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:text-rose-300"
                                      disabled={saving}
                                    >
                                      Decline
                                    </button>,
                                  ]
                                : tab === 'sent'
                                ? [
                                    <button
                                      key="cancel"
                                      type="button"
                                      onClick={() => onDelete?.(item.id)}
                                      className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
                                      disabled={saving}
                                    >
                                      Cancel
                                    </button>,
                                  ]
                                : [
                                    <button
                                      key="remove"
                                      type="button"
                                      onClick={() => onDelete?.(item.id)}
                                      className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
                                      disabled={saving}
                                    >
                                      Remove
                                    </button>,
                                  ]
                            }
                          />
                        ))
                      ) : (
                        <li className="rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
                          No records
                        </li>
                      )}
                    </ul>
                  ) : (
                    <form className="space-y-4" onSubmit={handleInviteSubmit}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                          <input
                            type="email"
                            value={invite.email}
                            onChange={(event) => setInvite((prev) => ({ ...prev, email: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            placeholder="user@example.com"
                          />
                        </label>
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</span>
                          <input
                            type="number"
                            value={invite.userId}
                            onChange={(event) => setInvite((prev) => ({ ...prev, userId: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            placeholder="ID"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">Send a request with either email or ID.</p>
                      {error ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</div>
                      ) : null}
                      <button
                        type="submit"
                        className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        disabled={disableInvite}
                      >
                        {saving ? 'Sending…' : 'Send' }
                      </button>
                    </form>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    disabled={saving}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
