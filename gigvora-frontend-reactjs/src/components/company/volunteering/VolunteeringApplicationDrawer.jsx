import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import ApplicationManager from './ApplicationManager.jsx';

export default function VolunteeringApplicationDrawer({
  open,
  application,
  busy = false,
  onClose,
  onUpdate,
  onDelete,
  onCreateResponse,
  onUpdateResponse,
  onDeleteResponse,
  onScheduleInterview,
  onUpdateInterview,
  onDeleteInterview,
  onCreateContract,
  onUpdateContract,
  onAddSpend,
  onUpdateSpend,
  onDeleteSpend,
}) {
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                  <div className="flex h-full flex-col bg-white shadow-2xl">
                    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">
                          {application?.candidateName || 'Candidate'}
                        </Dialog.Title>
                        <p className="text-xs text-slate-500">Full record with responses, interviews, contracts, and spend.</p>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Close
                      </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6">
                      {application ? (
                        <ApplicationManager
                          application={application}
                          busy={busy}
                          onUpdate={onUpdate}
                          onDelete={onDelete}
                          onCreateResponse={onCreateResponse}
                          onUpdateResponse={onUpdateResponse}
                          onDeleteResponse={onDeleteResponse}
                          onScheduleInterview={onScheduleInterview}
                          onUpdateInterview={onUpdateInterview}
                          onDeleteInterview={onDeleteInterview}
                          onCreateContract={onCreateContract}
                          onUpdateContract={onUpdateContract}
                          onAddSpend={onAddSpend}
                          onUpdateSpend={onUpdateSpend}
                          onDeleteSpend={onDeleteSpend}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                          Select a record to manage details.
                        </div>
                      )}
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
