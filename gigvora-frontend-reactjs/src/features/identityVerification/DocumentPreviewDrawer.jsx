import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DocumentPreviewDrawer({ open, onClose, document }) {
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
          <div className="fixed inset-0 bg-slate-900/40" />
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl bg-white shadow-xl">
                  <div className="flex h-full flex-col">
                    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <div>
                        <Dialog.Title className="text-base font-semibold text-slate-900">{document?.label ?? 'Document'}</Dialog.Title>
                        {document?.fileName ? (
                          <p className="text-xs text-slate-500">{document.fileName}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </header>
                    <div className="flex-1 overflow-y-auto bg-slate-50">
                      {document?.loading ? (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-sm font-semibold text-slate-500">Loading…</p>
                        </div>
                      ) : document?.error ? (
                        <div className="flex h-full items-center justify-center px-6">
                          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                            {document.error.message ?? 'Unable to open document'}
                          </p>
                        </div>
                      ) : document?.data ? (
                        <div className="p-6">
                          {document.contentType?.startsWith('image/') ? (
                            <img
                              src={document.data}
                              alt={document.fileName ?? document.label ?? 'Identity document'}
                              className="max-h-[70vh] w-full rounded-2xl object-contain shadow-lg"
                            />
                          ) : document.contentType === 'application/pdf' || document.contentType?.includes('pdf') ? (
                            <object
                              data={document.data}
                              type={document.contentType ?? 'application/pdf'}
                              className="h-[70vh] w-full rounded-2xl border border-slate-200 shadow-lg"
                            >
                              <p className="text-sm text-slate-600">PDF preview unavailable.</p>
                            </object>
                          ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                              <p className="text-xs font-semibold text-slate-400">Storage key</p>
                              <p className="mt-2 break-all font-mono text-xs text-slate-700">{document.key}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-sm font-semibold text-slate-500">No preview available</p>
                        </div>
                      )}
                    </div>
                    {document?.data ? (
                      <footer className="border-t border-slate-200 bg-white px-6 py-4">
                        <a
                          href={document.data}
                          download={document.fileName ?? 'identity-document'}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Download
                        </a>
                      </footer>
                    ) : null}
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

DocumentPreviewDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  document: PropTypes.shape({
    label: PropTypes.string,
    key: PropTypes.string,
    fileName: PropTypes.string,
    data: PropTypes.string,
    contentType: PropTypes.string,
    loading: PropTypes.bool,
    error: PropTypes.shape({
      message: PropTypes.string,
    }),
  }),
};

DocumentPreviewDrawer.defaultProps = {
  open: false,
  onClose: () => {},
  document: null,
};
