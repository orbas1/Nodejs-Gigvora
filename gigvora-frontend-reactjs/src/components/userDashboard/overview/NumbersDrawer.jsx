import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import OverviewDrawer from './OverviewDrawer.jsx';

export default function NumbersDrawer({ open, initialValues, onClose, onSubmit, saving }) {
  const [draft, setDraft] = useState(initialValues);

  useEffect(() => {
    setDraft(initialValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((previous) => ({ ...previous, [name]: value }));
  };

  return (
    <OverviewDrawer
      open={open}
      title="Edit numbers"
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
      saving={saving}
    >
      <div className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Followers
          <input
            type="number"
            name="followersCount"
            value={draft.followersCount ?? ''}
            onChange={handleChange}
            min={0}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Goal
          <input
            type="number"
            name="followersGoal"
            value={draft.followersGoal ?? ''}
            onChange={handleChange}
            min={0}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Trust score (%)
          <input
            type="number"
            name="trustScore"
            value={draft.trustScore ?? ''}
            onChange={handleChange}
            min={0}
            max={100}
            step={0.5}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Trust label
          <input
            type="text"
            name="trustScoreLabel"
            value={draft.trustScoreLabel ?? ''}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Rating (/5)
          <input
            type="number"
            name="rating"
            value={draft.rating ?? ''}
            onChange={handleChange}
            min={0}
            max={5}
            step={0.1}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Reviews
          <input
            type="number"
            name="ratingCount"
            value={draft.ratingCount ?? ''}
            onChange={handleChange}
            min={0}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
      </div>
    </OverviewDrawer>
  );
}

NumbersDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  initialValues: PropTypes.shape({
    followersCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    followersGoal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    trustScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    trustScoreLabel: PropTypes.string,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ratingCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
