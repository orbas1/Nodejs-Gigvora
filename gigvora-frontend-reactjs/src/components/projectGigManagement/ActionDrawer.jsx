import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment } from 'react';

export default function ActionDrawer({ open, onClose, title, children, footer, width = 'max-w-2xl' }) {
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  className={`pointer-events-auto w-screen ${width} bg-white shadow-2xl`}>
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                      >
                        Close
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
                    {footer ? <div className="border-t border-slate-100 px-6 py-4">{footer}</div> : null}
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

ActionDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node,
  width: PropTypes.string,
};
