import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PlusIcon } from '@heroicons/react/24/outline';

function PackageCard({ pack, onRemove }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">{pack.name}</p>
          <p className="mt-1 text-xs text-slate-500">{pack.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(pack.id)}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
        >
          Remove
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
        <div>
          <dt className="font-medium text-slate-500">Sessions</dt>
          <dd className="text-sm font-semibold text-slate-800">{pack.sessions}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Format</dt>
          <dd className="text-sm font-semibold text-slate-800">{pack.format}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Price</dt>
          <dd className="text-sm font-semibold text-slate-800">
            {pack.currency}
            {pack.price}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Outcome</dt>
          <dd className="text-sm font-semibold text-slate-800">{pack.outcome}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function MentorPackageBuilder({ packages = [], onSave, saving = false, analytics } = {}) {
  const [items, setItems] = useState(() =>
    packages.map((item) => ({
      ...item,
      id: item.id ?? `${item.name}-${item.sessions}-${item.price}`,
    })),
  );
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    sessions: 3,
    price: 450,
    currency: '£',
    format: 'Hybrid',
    outcome: 'Portfolio-ready project',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const totalPackages = useMemo(() => items.length, [items.length]);

  const handleAdd = () => {
    setError(null);
    setSuccess(false);
    if (!formState.name.trim()) {
      setError('Name your package to help mentees understand what they are booking.');
      return;
    }
    const duplicate = items.some(
      (pack) => pack.name.toLowerCase() === formState.name.trim().toLowerCase(),
    );
    if (duplicate) {
      setError('You have already configured this package. Adjust the name or details to continue.');
      return;
    }
    const id = `${formState.name}-${formState.sessions}-${formState.price}-${Date.now()}`;
    setItems((previous) => [
      ...previous,
      {
        id,
        name: formState.name.trim(),
        description: formState.description.trim() || 'Personalised mentorship series.',
        sessions: Number(formState.sessions) || 1,
        price: Number(formState.price) || 0,
        currency: formState.currency || '£',
        format: formState.format || 'Hybrid',
        outcome: formState.outcome.trim() || 'Clarity on next career steps',
      },
    ]);
    setFormState({ ...formState, name: '', description: '' });
  };

  const handleRemove = (packageId) => {
    setSuccess(false);
    setItems((previous) => previous.filter((pack) => pack.id !== packageId));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    try {
      if (typeof onSave === 'function') {
        await onSave(items.map(({ id, ...rest }) => rest));
      }
      if (analytics?.track) {
        analytics.track('web_mentor_packages_saved', { packages: items.length });
      }
      setSuccess(true);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save packages. Please retry.');
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Mentorship packages</h3>
          <p className="mt-1 text-sm text-slate-500">
            Bundle your expertise into structured outcomes – Explorer highlights premium packages and surfaces them in saved search alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? 'Saving…' : 'Save packages'}
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Package name
          <input
            type="text"
            value={formState.name}
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
            placeholder="Leadership accelerator"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Sessions
          <input
            type="number"
            min="1"
            value={formState.sessions}
            onChange={(event) => setFormState((current) => ({ ...current, sessions: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600 md:col-span-2">
          Description
          <textarea
            rows="3"
            value={formState.description}
            onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
            placeholder="Six-week mentorship combining weekly coaching, async reviews, and leadership rituals."
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Price
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={formState.currency}
              onChange={(event) => setFormState((current) => ({ ...current, currency: event.target.value }))}
              className="w-16 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <input
              type="number"
              min="0"
              value={formState.price}
              onChange={(event) => setFormState((current) => ({ ...current, price: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Format
          <input
            type="text"
            value={formState.format}
            onChange={(event) => setFormState((current) => ({ ...current, format: event.target.value }))}
            placeholder="Hybrid"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Promised outcome
          <input
            type="text"
            value={formState.outcome}
            onChange={(event) => setFormState((current) => ({ ...current, outcome: event.target.value }))}
            placeholder="Promotion-ready narrative"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
          >
            <PlusIcon className="h-4 w-4" /> Add package
          </button>
        </div>
      </div>
      {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p> : null}
      {success ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-600">
          Packages updated. Explorer will surface {totalPackages} {totalPackages === 1 ? 'offering' : 'offerings'} in mentor search.
        </p>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.length ? (
          items.map((pack) => <PackageCard key={pack.id} pack={pack} onRemove={handleRemove} />)
        ) : (
          <p className="rounded-3xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No packages yet. Combine multiple sessions or async reviews to increase conversion.
          </p>
        )}
      </div>
    </section>
  );
}

MentorPackageBuilder.propTypes = {
  packages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      sessions: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired,
      format: PropTypes.string,
      outcome: PropTypes.string,
    }),
  ),
  onSave: PropTypes.func,
  saving: PropTypes.bool,
  analytics: PropTypes.shape({
    track: PropTypes.func,
  }),
};

