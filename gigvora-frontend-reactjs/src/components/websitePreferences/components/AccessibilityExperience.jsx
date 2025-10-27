import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { DEFAULT_WEBSITE_PREFERENCES } from '../defaults.js';

const ENFORCEMENT_OPTIONS = [
  { value: 'required', label: 'Required', description: 'Block publishing when imagery is missing alt text.' },
  { value: 'recommended', label: 'Recommended', description: 'Flag missing alt text and request fixes before go-live.' },
  { value: 'optional', label: 'Optional', description: 'Allow publishing without alt text (not advised).' },
];

const CAPTION_OPTIONS = [
  { value: 'required', label: 'Required' },
  { value: 'preferred', label: 'Preferred' },
  { value: 'optional', label: 'Optional' },
];

const AUDIO_DESCRIPTION_OPTIONS = [
  { value: 'summary', label: 'Summary narration' },
  { value: 'full', label: 'Full narration' },
  { value: 'off', label: 'Off' },
];

const READING_STYLES = [
  { value: 'inclusive', label: 'Inclusive' },
  { value: 'executive', label: 'Executive' },
  { value: 'technical', label: 'Technical' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'nl', label: 'Dutch' },
];

const SIGN_LANGUAGE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'bsl', label: 'British Sign Language' },
  { value: 'asl', label: 'American Sign Language' },
];

function sanitizeLanguages(languages) {
  const allowed = new Set(LANGUAGE_OPTIONS.map((option) => option.value));
  const unique = [];
  languages.forEach((code) => {
    if (typeof code !== 'string') return;
    const normalized = code.trim().toLowerCase();
    if (!allowed.has(normalized)) return;
    if (!unique.includes(normalized)) {
      unique.push(normalized);
    }
  });
  if (!unique.length) {
    return [...DEFAULT_WEBSITE_PREFERENCES.personalization.accessibility.localisation.languages];
  }
  return unique;
}

export default function AccessibilityExperience({ value = null, onChange, canEdit = true }) {
  const defaults = DEFAULT_WEBSITE_PREFERENCES.personalization.accessibility;

  const accessibility = useMemo(() => {
    const incoming = value ?? {};
    const languages = sanitizeLanguages(incoming?.localisation?.languages ?? defaults.localisation.languages);
    const defaultLanguage = languages.includes(incoming?.localisation?.defaultLanguage)
      ? incoming.localisation.defaultLanguage
      : languages[0];

    return {
      altText: { ...defaults.altText, ...(incoming.altText ?? {}) },
      media: { ...defaults.media, ...(incoming.media ?? {}) },
      content: { ...defaults.content, ...(incoming.content ?? {}) },
      localisation: {
        ...defaults.localisation,
        ...(incoming.localisation ?? {}),
        languages,
        defaultLanguage,
      },
      compliance: { ...defaults.compliance, ...(incoming.compliance ?? {}) },
      updatedAt: incoming?.updatedAt ?? defaults.updatedAt,
    };
  }, [value, defaults]);

  const emitChange = (next) => {
    onChange?.({ ...accessibility, ...next });
  };

  const updateAltText = (patch) => {
    emitChange({ altText: { ...accessibility.altText, ...patch } });
  };

  const updateMedia = (patch) => {
    emitChange({ media: { ...accessibility.media, ...patch } });
  };

  const updateContent = (patch) => {
    emitChange({ content: { ...accessibility.content, ...patch } });
  };

  const updateLocalisation = (patch) => {
    emitChange({ localisation: { ...accessibility.localisation, ...patch } });
  };

  const updateCompliance = (patch) => {
    emitChange({ compliance: { ...accessibility.compliance, ...patch } });
  };

  const toggleLanguage = (code, enabled) => {
    if (!canEdit) return;
    const languages = accessibility.localisation.languages.filter((item) => item !== code);
    if (enabled) {
      languages.push(code);
    }
    const nextLanguages = sanitizeLanguages(languages);
    const nextDefault = nextLanguages.includes(accessibility.localisation.defaultLanguage)
      ? accessibility.localisation.defaultLanguage
      : nextLanguages[0];
    updateLocalisation({ languages: nextLanguages, defaultLanguage: nextDefault });
  };

  const handleDefaultLanguageChange = (event) => {
    const nextDefault = event.target.value;
    if (!canEdit) return;
    if (!accessibility.localisation.languages.includes(nextDefault)) return;
    updateLocalisation({ defaultLanguage: nextDefault });
  };

  return (
    <section className="space-y-10 rounded-4xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Accessibility &amp; content experience</h3>
          <p className="text-sm text-slate-500">
            Enforce inclusive publishing defaults for alt text, captions, localisation, and compliance.
          </p>
          {accessibility.updatedAt ? (
            <p className="mt-2 text-xs text-slate-400">Last reviewed {new Date(accessibility.updatedAt).toLocaleString()}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Alt text &amp; imagery</h4>
            <label className="mt-3 block text-sm text-slate-600">
              Alt text enforcement
              <select
                value={accessibility.altText.enforcement}
                onChange={(event) => updateAltText({ enforcement: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                {ENFORCEMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs text-slate-500">
              {ENFORCEMENT_OPTIONS.find((option) => option.value === accessibility.altText.enforcement)?.description}
            </p>
            <label className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Generate AI alt text suggestions</span>
              <input
                type="checkbox"
                checked={Boolean(accessibility.altText.autoGenerate)}
                onChange={(event) => updateAltText({ autoGenerate: event.target.checked })}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
            <label className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Require alt text for hero &amp; gallery media</span>
              <input
                type="checkbox"
                checked={Boolean(accessibility.altText.requireForMedia)}
                onChange={(event) => updateAltText({ requireForMedia: event.target.checked })}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Content tone</h4>
            <label className="block text-sm text-slate-600">
              Reading style
              <select
                value={accessibility.content.readingStyle}
                onChange={(event) => updateContent({ readingStyle: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                {READING_STYLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Enforce inclusive language guidance</span>
              <input
                type="checkbox"
                checked={Boolean(accessibility.content.inclusiveLanguage)}
                onChange={(event) => updateContent({ inclusiveLanguage: event.target.checked })}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
            <label className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Plain language checklist</span>
              <input
                type="checkbox"
                checked={Boolean(accessibility.content.plainLanguage)}
                onChange={(event) => updateContent({ plainLanguage: event.target.checked })}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Media accessibility</h4>
            <label className="block text-sm text-slate-600">
              Caption policy
              <select
                value={accessibility.media.captionPolicy}
                onChange={(event) => updateMedia({ captionPolicy: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                {CAPTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Require transcripts for audio &amp; video</span>
              <input
                type="checkbox"
                checked={Boolean(accessibility.media.transcripts)}
                onChange={(event) => updateMedia({ transcripts: event.target.checked })}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
            <label className="mt-2 block text-sm text-slate-600">
              Audio description
              <select
                value={accessibility.media.audioDescription}
                onChange={(event) => updateMedia({ audioDescription: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                {AUDIO_DESCRIPTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">Localisation</h4>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Auto-translate new content</span>
              <input
                type="checkbox"
                checked={Boolean(accessibility.localisation.autoTranslate)}
                onChange={(event) => updateLocalisation({ autoTranslate: event.target.checked })}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Supported languages</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {LANGUAGE_OPTIONS.map((option) => {
                  const checked = accessibility.localisation.languages.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-2 text-sm transition ${
                        checked
                          ? 'border-accent bg-accent/10 text-slate-900'
                          : 'border-slate-200 bg-white/70 text-slate-600 hover:border-accent/40 hover:text-slate-900'
                      } ${!canEdit ? 'cursor-not-allowed opacity-60 hover:border-slate-200 hover:text-slate-600' : ''}`}
                    >
                      <span>{option.label}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => toggleLanguage(option.value, event.target.checked)}
                        disabled={!canEdit}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
            <label className="mt-3 block text-sm text-slate-600">
              Default language
              <select
                value={accessibility.localisation.defaultLanguage}
                onChange={handleDefaultLanguageChange}
                disabled={!canEdit}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                {accessibility.localisation.languages.map((code) => {
                  const option = LANGUAGE_OPTIONS.find((item) => item.value === code);
                  return (
                    <option key={code} value={code}>
                      {option?.label ?? code}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="mt-3 block text-sm text-slate-600">
              Sign language support
              <select
                value={accessibility.localisation.signLanguage}
                onChange={(event) => updateLocalisation({ signLanguage: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
              >
                {SIGN_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Compliance &amp; audits</h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[{ key: 'contrast', label: 'Contrast checks' }, { key: 'focus', label: 'Focus-visible review' }, { key: 'keyboard', label: 'Keyboard navigation script' }].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600"
            >
              <span className="font-semibold text-slate-900">{item.label}</span>
              <input
                type="checkbox"
                checked={Boolean(accessibility.compliance[item.key])}
                onChange={(event) => updateCompliance({ [item.key]: event.target.checked })}
                disabled={!canEdit}
                className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Accessibility owner
            <input
              type="text"
              value={accessibility.compliance.owner}
              onChange={(event) => updateCompliance({ owner: event.target.value })}
              disabled={!canEdit}
              placeholder="Accessibility lead or council"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-600">
            Last manual audit
            <input
              type="datetime-local"
              value={accessibility.compliance.lastReviewedAt ? accessibility.compliance.lastReviewedAt.slice(0, 16) : ''}
              onChange={(event) => updateCompliance({ lastReviewedAt: event.target.value ? new Date(event.target.value).toISOString() : null })}
              disabled={!canEdit}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Enabled checks feed publishing blockers, SEO previews, and the reliability console so every launch meets accessibility benchmarks.
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Summary</p>
        <p className="mt-2 text-xs text-slate-500">
          {accessibility.localisation.languages.length} language{accessibility.localisation.languages.length === 1 ? '' : 's'} • Alt text {accessibility.altText.enforcement} • Captions {accessibility.media.captionPolicy} • Audio description {accessibility.media.audioDescription}
        </p>
      </div>
    </section>
  );
}

AccessibilityExperience.propTypes = {
  value: PropTypes.shape({
    altText: PropTypes.object,
    media: PropTypes.object,
    content: PropTypes.object,
    localisation: PropTypes.object,
    compliance: PropTypes.object,
    updatedAt: PropTypes.string,
  }),
  onChange: PropTypes.func,
  canEdit: PropTypes.bool,
};
