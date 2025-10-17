import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function VolunteeringSlideOver({ open, title, subtitle, onClose, children, footer }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
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
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
                    </div>
                    <div className="flex-1 space-y-5 px-6 py-6">{children}</div>
                    {footer ? <div className="border-t border-slate-200 px-6 py-5">{footer}</div> : null}
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
