import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import OverviewDrawer from './OverviewDrawer.jsx';

export default function VisualsDrawer({ open, initialValues, onClose, onSubmit, saving }) {
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
      title="Edit visuals"
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
      saving={saving}
    >
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Avatar URL
        <input
          type="url"
          name="avatarUrl"
          value={draft.avatarUrl ?? ''}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          placeholder="https://"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Banner URL
        <input
          type="url"
          name="bannerImageUrl"
          value={draft.bannerImageUrl ?? ''}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          placeholder="https://"
        />
      </label>
    </OverviewDrawer>
  );
}

VisualsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  initialValues: PropTypes.shape({
    avatarUrl: PropTypes.string,
    bannerImageUrl: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
