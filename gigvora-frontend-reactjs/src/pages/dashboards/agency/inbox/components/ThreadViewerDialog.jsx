import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import MessagePanel from './MessagePanel.jsx';

export default function ThreadViewerDialog({
  open,
  onClose,
  thread,
  messages,
  composer,
  onComposerChange,
  onSend,
  sending,
  loading,
  error,
  onRefresh,
  quickReplies,
  onSelectQuickReply,
  actorId,
  onOpenSupport,
  onOpenPeople,
}) {
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
          <div className="fixed inset-0 bg-slate-900/50" />
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
            <Dialog.Panel className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-end border-b border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <MessagePanel
                  thread={thread}
                  messages={messages}
                  composer={composer}
                  onComposerChange={onComposerChange}
                  onSend={onSend}
                  sending={sending}
                  loading={loading}
                  error={error}
                  onRefresh={onRefresh}
                  quickReplies={quickReplies}
                  onSelectQuickReply={onSelectQuickReply}
                  onOpenSupport={onOpenSupport}
                  onOpenPeople={onOpenPeople}
                  variant="dialog"
                  actorId={actorId}
                />
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

