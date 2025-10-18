import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function CalendarEventDrawer({
  open,
  title,
  description,
  onClose,
  children,
}) {
  return (
    <Transition show={open} as={Fragment}>
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl bg-white shadow-2xl">
                  <div className="flex h-full flex-col divide-y divide-slate-100 overflow-y-auto">
                    <div className="flex items-start justify-between px-6 py-5">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-transparent p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      >
                        <span className="sr-only">Close</span>
                        ×
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
