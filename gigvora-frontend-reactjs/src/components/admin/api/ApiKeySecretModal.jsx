import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ApiKeySecretModal({
  open,
  onClose,
  apiKey,
  webhookSecret,
  clientName,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText([apiKey, webhookSecret].filter(Boolean).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setCopied(false);
    }
  };

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
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  API credentials issued
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">
                  Copy these secrets now. They are only shown once. Store them in your secret manager before closing this dialog.
                </p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{clientName}</p>
                  </div>

                  {apiKey ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API key</p>
                      <code className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 break-all">
                        {apiKey}
                      </code>
                    </div>
                  ) : null}

                  {webhookSecret ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Webhook secret</p>
                      <code className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 break-all">
                        {webhookSecret}
                      </code>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5" /> Copied
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-5 w-5" /> Copy secrets
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
