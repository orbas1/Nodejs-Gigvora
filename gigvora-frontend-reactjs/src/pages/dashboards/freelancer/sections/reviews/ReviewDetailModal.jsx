import { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowTopRightOnSquareIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge.jsx';
import { formatDateTime } from './utils.js';

export default function ReviewDetailModal({ review, open, onClose, onEdit, onDelete, deleting }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <Transition appear show={open} as={Fragment}>
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
              <Dialog.Panel className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{review?.title ?? 'Review'}</Dialog.Title>
                    <p className="mt-1 text-sm text-slate-500">
                      {review?.reviewerName ?? 'Client'} · {review?.reviewerCompany ?? 'Company'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={review?.status} />
                    {review?.rating ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        <StarIcon className="h-4 w-4" />
                        {review.rating.toFixed(1)}
                      </span>
                    ) : null}
                    {review?.highlighted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  {review?.body ? <p className="text-sm leading-6 text-slate-700">{review.body}</p> : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Captured</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDateTime(review?.capturedAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDateTime(review?.publishedAt)}</p>
                    </div>
                  </div>

                  {review?.tags?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {review.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {review?.previewUrl ? (
                      <a
                        href={review.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300"
                      >
                        Preview
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                    ) : null}
                    {review?.heroImageUrl ? (
                      <a
                        href={review.heroImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300"
                      >
                        Hero
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                  <div className="text-xs text-slate-500">
                    Updated {formatDateTime(review?.updatedAt ?? review?.createdAt)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(review)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(review)}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-wait disabled:opacity-70"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

ReviewDetailModal.propTypes = {
  review: PropTypes.shape({
    title: PropTypes.string,
    reviewerName: PropTypes.string,
    reviewerCompany: PropTypes.string,
    status: PropTypes.string,
    rating: PropTypes.number,
    highlighted: PropTypes.bool,
    body: PropTypes.string,
    capturedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    publishedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    tags: PropTypes.arrayOf(PropTypes.string),
    previewUrl: PropTypes.string,
    heroImageUrl: PropTypes.string,
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
};
