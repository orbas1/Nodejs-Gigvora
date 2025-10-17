import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function HighlightDetailDialog({ open, onClose, highlight }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-4xl bg-white p-6 text-left shadow-xl transition-all">
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Close highlight</span>
                </button>

                <div className="space-y-4">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      {highlight?.title || 'Highlight'}
                    </Dialog.Title>
                    {highlight?.summary ? (
                      <p className="mt-2 text-sm text-slate-600">{highlight.summary}</p>
                    ) : null}
                  </div>

                  {highlight?.imageUrl ? (
                    <img
                      src={highlight.imageUrl}
                      alt={highlight?.title || 'Highlight visual'}
                      className="w-full rounded-3xl border border-slate-200 object-cover"
                    />
                  ) : null}

                  {highlight?.link ? (
                    <a
                      href={highlight.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:text-accentDark"
                    >
                      View linked resource
                    </a>
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
