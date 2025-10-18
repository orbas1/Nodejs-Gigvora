import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getCreationType, getCreationStatus } from '../../../constants/creationStudio.js';
import { formatAbsolute, formatRelativeTime } from '../../../utils/date.js';

export default function CreationStudioPreviewDrawer({ open, item, onClose }) {
  if (!item) {
    return null;
  }
  const type = getCreationType(item.type);
  const status = getCreationStatus(item.status);

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
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-screen max-w-2xl">
                <div className="flex h-full flex-col bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div className="space-y-1">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{item.title}</Dialog.Title>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {type?.label ?? item.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-4 text-sm text-slate-600">
                      {status ? (
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>
                          {status.label}
                        </span>
                      ) : null}
                      {item.headline ? <p className="text-base font-semibold text-slate-800">{item.headline}</p> : null}
                      {item.summary ? <p className="text-slate-600">{item.summary}</p> : null}
                      {item.content ? (
                        <article className="space-y-3 whitespace-pre-wrap text-slate-700">{item.content}</article>
                      ) : null}
                      <dl className="grid grid-cols-2 gap-3 text-xs">
                        {item.location ? (
                          <>
                            <dt className="font-semibold text-slate-500">Location</dt>
                            <dd>{item.location}</dd>
                          </>
                        ) : null}
                        {item.launchDate ? (
                          <>
                            <dt className="font-semibold text-slate-500">Launch</dt>
                            <dd>{formatAbsolute(item.launchDate)}</dd>
                          </>
                        ) : null}
                        {item.publishAt ? (
                          <>
                            <dt className="font-semibold text-slate-500">Publish</dt>
                            <dd>{formatAbsolute(item.publishAt)}</dd>
                          </>
                        ) : null}
                        {item.updatedAt ? (
                          <>
                            <dt className="font-semibold text-slate-500">Updated</dt>
                            <dd>{formatRelativeTime(item.updatedAt)}</dd>
                          </>
                        ) : null}
                        {item.targetAudience ? (
                          <>
                            <dt className="font-semibold text-slate-500">Audience</dt>
                            <dd>{item.targetAudience}</dd>
                          </>
                        ) : null}
                        {item.budgetAmount ? (
                          <>
                            <dt className="font-semibold text-slate-500">Budget</dt>
                            <dd>
                              {item.budgetCurrency} {item.budgetAmount}
                            </dd>
                          </>
                        ) : null}
                        {item.compensationMin && item.compensationMax ? (
                          <>
                            <dt className="font-semibold text-slate-500">Compensation</dt>
                            <dd>
                              {item.compensationCurrency} {item.compensationMin} – {item.compensationMax}
                            </dd>
                          </>
                        ) : null}
                        {item.durationWeeks ? (
                          <>
                            <dt className="font-semibold text-slate-500">Duration</dt>
                            <dd>{item.durationWeeks} weeks</dd>
                          </>
                        ) : null}
                        {item.commitmentHours ? (
                          <>
                            <dt className="font-semibold text-slate-500">Weekly hours</dt>
                            <dd>{item.commitmentHours} hrs</dd>
                          </>
                        ) : null}
                      </dl>
                      {Array.isArray(item.tags) && item.tags.length ? (
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

CreationStudioPreviewDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

CreationStudioPreviewDrawer.defaultProps = {
  item: null,
};
