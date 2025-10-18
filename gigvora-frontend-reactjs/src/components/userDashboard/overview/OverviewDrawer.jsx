import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function OverviewDrawer({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  saving = false,
  children,
  footer,
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
          <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
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
                <form
                  className="flex h-full flex-col overflow-y-auto"
                  onSubmit={(event) => {
                    if (!onSubmit) {
                      event.preventDefault();
                      return;
                    }
                    event.preventDefault();
                    onSubmit();
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-6 px-6 py-6">{children}</div>

                  <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                    {footer ? (
                      footer
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {saving && (
                            <svg
                              className="h-4 w-4 animate-spin text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                          )}
                          {submitLabel}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

OverviewDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  submitLabel: PropTypes.string,
  saving: PropTypes.bool,
  children: PropTypes.node,
  footer: PropTypes.node,
};
