import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ComposeDrawer({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  submitting,
  error,
  workspaceMembers = [],
}) {
  const channelOptions = [
    { value: 'direct', label: 'Direct' },
    { value: 'project', label: 'Project' },
    { value: 'support', label: 'Support' },
    { value: 'contract', label: 'Contract' },
    { value: 'group', label: 'Group' },
  ];

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

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="opacity-0 translate-y-6"
            enterTo="opacity-100 translate-y-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-6"
          >
            <Dialog.Panel className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-sm font-semibold text-slate-900">New conversation</Dialog.Title>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                <label className="block text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</span>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(event) => onChange({ ...form, subject: event.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Subject"
                  />
                </label>
                <label className="block text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Channel</span>
                  <select
                    value={form.channelType}
                    onChange={(event) => onChange({ ...form, channelType: event.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {channelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">People</span>
                  <select
                    multiple
                    value={form.participantIds.map(String)}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                      onChange({ ...form, participantIds: selected });
                    }}
                    className="mt-1 h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {workspaceMembers.map((member) => {
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
                </label>
                <label className="block text-sm text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</span>
                  <textarea
                    rows={4}
                    value={form.initialMessage}
                    onChange={(event) => onChange({ ...form, initialMessage: event.target.value })}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Optional"
                  />
                </label>
                {error ? (
                  <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || form.participantIds.length === 0}
                    className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

