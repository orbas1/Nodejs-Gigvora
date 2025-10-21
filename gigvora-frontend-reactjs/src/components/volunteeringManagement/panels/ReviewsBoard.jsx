import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { formatDate } from '../utils.js';

export default function ReviewsBoard({ reviews, onEdit, onDelete, onCreate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{reviews.length} reviews</span>
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            New
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex-1 overflow-hidden rounded-3xl border border-slate-200">
        {reviews.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-20 text-sm text-slate-500">No reviews yet</div>
        ) : (
          <div className="max-h-[540px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Application</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Published</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-emerald-50/30">
                    <td className="px-4 py-3 align-top text-sm font-semibold text-slate-900">
                      {review.application?.role?.title ?? `Application #${review.applicationId}`}
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">{review.rating}/5</td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">
                      <span className="line-clamp-2">{review.headline || '—'}</span>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-slate-600">{formatDate(review.publishedAt)}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-white"
                          onClick={() => onEdit(review)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-2 text-rose-600 hover:bg-white"
                          onClick={() => onDelete(review)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const applicationShape = PropTypes.shape({
  role: PropTypes.shape({
    title: PropTypes.string,
  }),
});

const reviewShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  headline: PropTypes.string,
  publishedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  applicationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  application: applicationShape,
});

ReviewsBoard.propTypes = {
  reviews: PropTypes.arrayOf(reviewShape),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onCreate: PropTypes.func,
};

ReviewsBoard.defaultProps = {
  reviews: [],
  onEdit: () => {},
  onDelete: () => {},
  onCreate: null,
};
