import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import OverviewDrawer from './OverviewDrawer.jsx';

export default function HeroDrawer({ open, initialValues, onClose, onSubmit, saving }) {
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
      title="Edit hero"
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
      saving={saving}
    >
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Name
        <input
          type="text"
          name="greetingName"
          value={draft.greetingName ?? ''}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Headline
        <input
          type="text"
          name="headline"
          value={draft.headline ?? ''}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Summary
        <textarea
          name="overview"
          rows={4}
          value={draft.overview ?? ''}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </label>
    </OverviewDrawer>
  );
}

HeroDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  initialValues: PropTypes.shape({
    greetingName: PropTypes.string,
    headline: PropTypes.string,
    overview: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
