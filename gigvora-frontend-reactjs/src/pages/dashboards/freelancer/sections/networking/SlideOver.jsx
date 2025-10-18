import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SlideOver({ open, onClose, title, subtitle, children, footer }) {
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
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="pointer-events-auto w-screen max-w-md bg-white shadow-xl">
              <div className="flex h-full flex-col overflow-y-auto">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                    {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:text-slate-600"
                  >
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">{children}</div>
                {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
