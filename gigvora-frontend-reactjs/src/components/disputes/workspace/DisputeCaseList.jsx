import { Fragment } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../../utils/classNames.js';
import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';

function humanize(value) {
  if (!value) return '—';
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/(^|\s)([a-z])/g, (match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
    .trim();
}

const priorityTone = {
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-slate-100 text-slate-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-rose-100 text-rose-700',
};

export default function DisputeCaseList({ disputes, onSelect, selectedId }) {
  if (!Array.isArray(disputes) || disputes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-sm text-slate-500">
        No disputes yet. Use “New case” to open one.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {disputes.map((dispute) => {
        const isActive = selectedId === dispute.id;
        const deadlineLabel = dispute.customerDeadlineAt || dispute.providerDeadlineAt;
        return (
          <li key={dispute.id}>
            <Disclosure defaultOpen={isActive}>
              {({ open }) => (
                <div
                  className={classNames(
                    'rounded-3xl border bg-white shadow-sm transition',
                    isActive ? 'border-accent ring-2 ring-accent/40' : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(dispute)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {dispute.transaction?.displayName ?? `Dispute #${dispute.id}`}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            priorityTone[dispute.priority] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {humanize(dispute.priority)}
                        </span>
                        <span className="text-xs text-slate-500">{humanize(dispute.stage)}</span>
                        <span className="text-xs text-slate-400">{humanize(dispute.status)}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Updated {formatRelativeTime(dispute.updatedAt)} · Opened {formatAbsolute(dispute.openedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {deadlineLabel ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                          <ClockIcon className="h-4 w-4" aria-hidden="true" />
                          {formatAbsolute(deadlineLabel)}
                        </span>
                      ) : null}
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </button>

                  <Transition
                    as={Fragment}
                    show={open}
                    enter="transition ease-out duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Disclosure.Panel className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                          Events {dispute.metrics?.eventCount ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <DocumentArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                          Files {dispute.metrics?.attachmentCount ?? 0}
                        </span>
                        {dispute.summary ? (
                          <span className="inline-flex items-center gap-1 text-slate-500">{dispute.summary}</span>
                        ) : null}
                        {dispute.alert?.type === 'deadline' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">
                            <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" /> Past due
                          </span>
                        )}
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          </li>
        );
      })}
    </ul>
  );
}
