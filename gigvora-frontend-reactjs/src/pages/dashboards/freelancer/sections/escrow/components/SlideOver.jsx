import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex max-w-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel
                className={`pointer-events-auto w-screen ${wide ? 'max-w-3xl' : 'max-w-2xl'} bg-white shadow-xl`}
              >
                <div className="flex h-full flex-col">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                    {description ? (
                      <p className="mt-1 text-sm text-slate-500">{description}</p>
                    ) : null}
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
                  {footer ? (
                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                      <div className="flex justify-end gap-3">{footer}</div>
                    </div>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
