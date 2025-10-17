import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PeopleDrawer({
  open,
  onClose,
  participants = [],
  workspaceMembers = [],
  onAddParticipants,
  onRemoveParticipant,
}) {
  const [selected, setSelected] = useState('');

  const availableMembers = useMemo(() => {
    const participantIds = new Set(participants.map((participant) => participant.userId));
    return workspaceMembers.filter((member) => {
      const id = member.userId ?? member.user?.id ?? member.id;
      return id && !participantIds.has(id);
    });
  }, [participants, workspaceMembers]);

  const handleAdd = async () => {
    if (!selected) {
      return;
    }
    await onAddParticipants?.([Number(selected)]);
    setSelected('');
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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-end justify-end">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="h-full w-full max-w-md overflow-hidden bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <Dialog.Title className="text-sm font-semibold text-slate-900">People</Dialog.Title>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <ul className="space-y-3">
                    {participants.map((participant) => {
                      const name = participant.user
                        ? `${participant.user.firstName ?? ''} ${participant.user.lastName ?? ''}`.trim() || participant.user.email
                        : `User ${participant.userId}`;
                      return (
                        <li key={participant.id ?? participant.userId} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                          <span className="text-sm font-medium text-slate-700">{name}</span>
                          {onRemoveParticipant ? (
                            <button
                              type="button"
                              onClick={() => onRemoveParticipant(participant.userId)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:text-rose-500"
                              aria-label="Remove"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {onAddParticipants ? (
                  <div className="border-t border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={selected}
                        onChange={(event) => setSelected(event.target.value)}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="">Add person</option>
                        {availableMembers.map((member) => {
                          const id = member.userId ?? member.user?.id ?? member.id;
                          const name = member.user?.firstName || member.user?.lastName
                            ? `${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`.trim()
                            : member.user?.email ?? 'Member';
                          return (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!selected}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <UserPlusIcon className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

