import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ThemeSwitcher from './components/ThemeSwitcher.jsx';
import LayoutManager from './components/LayoutManager.jsx';
import ContentSubscriptions from './components/ContentSubscriptions.jsx';
import AccessibilityExperience from './components/AccessibilityExperience.jsx';
import { clonePreferences, withDefaults } from './defaults.js';
import websitePreferencesShape from './propTypes.js';
import { saveWebsitePreferences } from '../../services/websitePreferences.js';

function normalise(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalise(item));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = normalise(value[key]);
        return accumulator;
      }, {});
  }
  return value;
}

function isEqual(left, right) {
  return JSON.stringify(normalise(left)) === JSON.stringify(normalise(right));
}

function clonePersonalization(personalization) {
  if (!personalization) {
    return {
      theme: {},
      layout: {},
      subscriptions: {},
    };
  }
  return {
    theme: normalise(personalization.theme ?? {}),
    layout: {
      ...(personalization.layout ?? {}),
      modules: Array.isArray(personalization.layout?.modules)
        ? personalization.layout.modules.map((module) => ({ ...module }))
        : [],
    },
    subscriptions: {
      ...(personalization.subscriptions ?? {}),
      categories: Array.isArray(personalization.subscriptions?.categories)
        ? personalization.subscriptions.categories.map((category) => ({ ...category }))
        : [],
    },
    accessibility: {
      ...(personalization.accessibility ?? {}),
      altText: { ...(personalization.accessibility?.altText ?? {}) },
      media: { ...(personalization.accessibility?.media ?? {}) },
      content: { ...(personalization.accessibility?.content ?? {}) },
      localisation: {
        ...(personalization.accessibility?.localisation ?? {}),
        languages: Array.isArray(personalization.accessibility?.localisation?.languages)
          ? [...personalization.accessibility.localisation.languages]
          : [],
      },
      compliance: { ...(personalization.accessibility?.compliance ?? {}) },
    },
  };
}

export default function WebsitePersonalizationTools({ userId, preferences = null, onSaved, canEdit = false }) {
  const baseline = useMemo(() => withDefaults(preferences), [preferences]);
  const initialPersonalization = useMemo(
    () => clonePersonalization(baseline.personalization),
    [baseline.personalization],
  );
  const [draft, setDraft] = useState(initialPersonalization);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraft(initialPersonalization);
  }, [initialPersonalization]);

  const dirty = useMemo(() => !isEqual(draft, initialPersonalization), [draft, initialPersonalization]);

  const handleThemeChange = (next) => {
    setDraft((current) => ({ ...current, theme: { ...current.theme, ...next } }));
  };

  const handleLayoutChange = (next) => {
    setDraft((current) => ({ ...current, layout: { ...current.layout, ...next } }));
  };

  const handleSubscriptionsChange = (next) => {
    setDraft((current) => ({ ...current, subscriptions: { ...current.subscriptions, ...next } }));
  };

  const handleAccessibilityChange = (next) => {
    setDraft((current) => ({ ...current, accessibility: { ...next } }));
  };

  const handleReset = () => {
    setDraft(initialPersonalization);
    setStatus(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const source = preferences ?? baseline;
      const payload = clonePreferences(source);
      payload.personalization = {
        theme: { ...draft.theme, updatedAt: new Date().toISOString() },
        layout: {
          ...draft.layout,
          modules: Array.isArray(draft.layout?.modules)
            ? draft.layout.modules.map((module) => ({ ...module }))
            : [],
          updatedAt: new Date().toISOString(),
        },
        subscriptions: {
          ...draft.subscriptions,
          categories: Array.isArray(draft.subscriptions?.categories)
            ? draft.subscriptions.categories.map((category) => ({ ...category }))
            : [],
          updatedAt: new Date().toISOString(),
        },
        accessibility: {
          ...(draft.accessibility ? JSON.parse(JSON.stringify(draft.accessibility)) : {}),
          updatedAt: new Date().toISOString(),
        },
      };
      const response = await saveWebsitePreferences(userId, payload);
      setStatus('Personalisation updated');
      setError(null);
      onSaved?.(response);
    } catch (caught) {
      const message = caught?.response?.data?.message ?? caught?.message ?? 'Unable to save personalisation.';
      setError(message);
      setStatus(null);
    } finally {
      setSaving(false);
    }
  };

  const personalizationUpdatedAt =
    baseline.personalization?.accessibility?.updatedAt ||
    baseline.personalization?.subscriptions?.updatedAt ||
    baseline.personalization?.layout?.updatedAt ||
    baseline.personalization?.theme?.updatedAt ||
    baseline.updatedAt;

  return (
    <section className="mt-10 rounded-4xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Website personalisation</h2>
          <p className="text-sm text-slate-500">
            Deliver a feed-worthy public profile with curated theming, modular layouts, and intelligent subscriptions.
          </p>
          {personalizationUpdatedAt ? (
            <p className="mt-2 text-xs text-slate-400">Last updated {new Date(personalizationUpdatedAt).toLocaleString()}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty || saving}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || !canEdit || saving}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save personalisation'}
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-12">
        <ThemeSwitcher value={draft.theme} onChange={handleThemeChange} canEdit={canEdit && !saving} />
        <LayoutManager value={draft.layout} onChange={handleLayoutChange} canEdit={canEdit && !saving} />
        <ContentSubscriptions value={draft.subscriptions} onChange={handleSubscriptionsChange} canEdit={canEdit && !saving} />
        <AccessibilityExperience
          value={draft.accessibility}
          onChange={handleAccessibilityChange}
          canEdit={canEdit && !saving}
        />
      </div>

      <div className="mt-8 text-sm">
        {status ? <p className="text-emerald-600">{status}</p> : null}
        {error ? <p className="text-rose-600">{error}</p> : null}
      </div>
    </section>
  );
}

WebsitePersonalizationTools.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  preferences: websitePreferencesShape,
  onSaved: PropTypes.func,
  canEdit: PropTypes.bool,
};
