import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import OverviewDrawer from './OverviewDrawer.jsx';

export default function WeatherDrawer({ open, initialValues, onClose, onSubmit, saving }) {
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
      title="Edit weather"
      onClose={onClose}
      onSubmit={() => onSubmit(draft)}
      saving={saving}
    >
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Location
        <input
          type="text"
          name="weatherLocation"
          value={draft.weatherLocation ?? ''}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          placeholder="City, Country"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Units
        <select
          name="weatherUnits"
          value={draft.weatherUnits ?? 'metric'}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        >
          <option value="metric">Metric (°C)</option>
          <option value="imperial">Imperial (°F)</option>
        </select>
      </label>
    </OverviewDrawer>
  );
}

WeatherDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  initialValues: PropTypes.shape({
    weatherLocation: PropTypes.string,
    weatherUnits: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
