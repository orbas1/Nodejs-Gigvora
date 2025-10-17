import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../../../utils/date.js';
import { formatCurrency } from './formatters.js';

function DrawerSection({ title, children }) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-sm">{children}</div>
    </section>
  );
}

function renderContent(payload) {
  if (!payload) return null;

  switch (payload.type) {
    case 'releases':
      return (
        <div className="space-y-3">
          {payload.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.milestoneLabel || item.reference}</p>
                <p className="text-xs text-slate-500">
                  {item.scheduledReleaseAt
                    ? formatRelativeTime(item.scheduledReleaseAt)
                    : 'Awaiting confirmation'}
                </p>
              </div>
              <div className="text-right font-semibold text-slate-900">
                {formatCurrency(item.amount, item.currencyCode)}
              </div>
            </div>
          ))}
        </div>
      );
    case 'alerts':
      return (
        <ul className="space-y-3 text-sm">
          {payload.items?.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700"
            >
              <div className="font-semibold">{item.title}</div>
              <p className="text-xs text-amber-600">{item.caption}</p>
            </li>
          ))}
        </ul>
      );
    case 'move':
      return (
        <div className="space-y-3 text-sm">
          <DrawerSection title="Summary">
            <dl className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <dt className="text-xs text-slate-500">Reference</dt>
                <dd className="font-semibold">{payload.item.reference || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Type</dt>
                <dd className="font-semibold">{payload.item.type}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Amount</dt>
                <dd className="font-semibold">
                  {formatCurrency(payload.item.amount, payload.item.currencyCode)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd className="font-semibold capitalize">{payload.item.status}</dd>
              </div>
            </dl>
          </DrawerSection>
          <DrawerSection title="Timing">
            <dl className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <dt className="text-xs text-slate-500">Created</dt>
                <dd>{formatRelativeTime(payload.item.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Scheduled release</dt>
                <dd>
                  {payload.item.scheduledReleaseAt
                    ? formatRelativeTime(payload.item.scheduledReleaseAt)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Released</dt>
                <dd>{payload.item.releasedAt ? formatRelativeTime(payload.item.releasedAt) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Refunded</dt>
                <dd>{payload.item.refundedAt ? formatRelativeTime(payload.item.refundedAt) : '—'}</dd>
              </div>
            </dl>
          </DrawerSection>
          {payload.item.metadata ? (
            <DrawerSection title="Metadata">
              <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900/95 px-4 py-3 text-xs text-slate-100">
                {JSON.stringify(payload.item.metadata, null, 2)}
              </pre>
            </DrawerSection>
          ) : null}
        </div>
      );
    case 'account':
      return (
        <div className="space-y-3 text-sm">
          <DrawerSection title="Account">
            <dl className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <dt className="text-xs text-slate-500">Provider</dt>
                <dd className="font-semibold capitalize">{payload.item.provider}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Currency</dt>
                <dd className="font-semibold">{payload.item.currencyCode}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd className="font-semibold capitalize">{payload.item.status}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Balance</dt>
                <dd className="font-semibold">
                  {formatCurrency(payload.item.currentBalance, payload.item.currencyCode)}
                </dd>
              </div>
            </dl>
          </DrawerSection>
          {payload.item.metadata ? (
            <DrawerSection title="Metadata">
              <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900/95 px-4 py-3 text-xs text-slate-100">
                {JSON.stringify(payload.item.metadata, null, 2)}
              </pre>
            </DrawerSection>
          ) : null}
        </div>
      );
    default:
      return null;
  }
}

export default function ActivityDrawer({ open, title, payload, onClose }) {
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex max-w-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-screen max-w-xl bg-slate-50 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <Dialog.Title className="text-base font-semibold text-slate-900">{title}</Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    <span className="sr-only">Close drawer</span>
                  </button>
                </div>
                <div className="h-full overflow-y-auto px-6 py-6">{renderContent(payload)}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
