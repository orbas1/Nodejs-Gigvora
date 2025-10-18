import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function WorkspaceDrawer({ open, title, onClose, children, description }) {
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
            <Dialog.Panel className="w-screen max-w-xl bg-white shadow-xl">
              <div className="flex h-full flex-col overflow-hidden">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                    {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-transparent p-2 text-slate-400 transition hover:border-slate-200 hover:text-slate-600"
                    aria-label="Close drawer"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

WorkspaceDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

WorkspaceDrawer.defaultProps = {
  description: undefined,
};
