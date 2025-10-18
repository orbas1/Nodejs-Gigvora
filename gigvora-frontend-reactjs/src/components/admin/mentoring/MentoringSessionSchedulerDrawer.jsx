import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import MentoringSessionForm from './MentoringSessionForm.jsx';

export default function MentoringSessionSchedulerDrawer({ open, onClose, catalog, onSubmit, submitting }) {
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
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-200"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
              <div className="flex h-full flex-col overflow-hidden bg-white shadow-2xl">
                <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">New session</Dialog.Title>
                    <p className="text-sm text-slate-500">Fill in the mentoring details and save.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  >
                    Close
                  </button>
                </header>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <MentoringSessionForm
                    catalog={catalog}
                    onSubmit={onSubmit}
                    submitting={submitting}
                    onCancel={onClose}
                  />
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
