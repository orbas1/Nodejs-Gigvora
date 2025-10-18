import { useCallback, useEffect, useMemo, useState } from 'react';
import TokenInput from './TokenInput.jsx';

const DEFAULT_CARD_TYPE = 'summary_large_image';

function ensurePath(value) {
  if (!value) return '/';
  const trimmed = `${value}`.trim();
  if (!trimmed) return '/';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed}`;
}

function stringifyJson(value) {
  if (!value || typeof value !== 'object') {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return '';
  }
}

function buildFormState(raw) {
  const override = raw ?? {};
  return {
    id: override.id ?? null,
    originalPath: override.path ?? '',
    path: override.path ?? '/',
    title: override.title ?? '',
    description: override.description ?? '',
    keywords: Array.isArray(override.keywords) ? override.keywords : [],
    canonicalUrl: override.canonicalUrl ?? '',
    ogTitle: override.ogTitle ?? '',
    ogDescription: override.ogDescription ?? '',
    ogImageUrl: override.ogImageUrl ?? '',
    ogImageAlt: override.ogImageAlt ?? '',
    twitterTitle: override.twitterTitle ?? '',
    twitterDescription: override.twitterDescription ?? '',
    twitterCardType: override.twitterCardType ?? DEFAULT_CARD_TYPE,
    twitterImageUrl: override.twitterImageUrl ?? '',
    metaTags: Array.isArray(override.metaTags)
      ? override.metaTags.map((tag) => ({
          attribute: (tag.attribute ?? 'name').toLowerCase() === 'property' ? 'property' : 'name',
          key: tag.key ?? '',
          value: tag.value ?? '',
        }))
      : [],
    noindex: Boolean(override.noindex),
    structuredDataText: stringifyJson(override.structuredData?.customJson ?? override.structuredData),
  };
}

function sanitizeMetaTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags
    .map((tag) => {
      const key = `${tag.key ?? ''}`.trim();
      const value = `${tag.value ?? ''}`.trim();
      if (!key || !value) {
        return null;
      }
      const attribute = `${tag.attribute ?? 'name'}`.trim().toLowerCase() === 'property' ? 'property' : 'name';
      return { attribute, key, value };
    })
    .filter(Boolean);
}

export default function SeoOverrideDrawer({
  open,
  mode = 'create',
  initialValue = null,
  existingPaths = [],
  onClose,
  onSave,
  onDelete,
  disableInputs = false,
}) {
  const [formState, setFormState] = useState(() => buildFormState(initialValue));
  const [error, setError] = useState('');

  const otherPaths = useMemo(() => {
    const normalized = new Set();
    existingPaths.forEach((path) => {
      if (!path) return;
      normalized.add(path.trim().toLowerCase());
    });
    if (formState.originalPath) {
      normalized.delete(formState.originalPath.trim().toLowerCase());
    }
    return normalized;
  }, [existingPaths, formState.originalPath]);

  useEffect(() => {
    if (open) {
      setFormState(buildFormState(initialValue));
      setError('');
    }
  }, [initialValue, open]);

  const updateField = useCallback((key, value) => {
    setFormState((previous) => ({
      ...previous,
      [key]: value,
    }));
    setError('');
  }, []);

  const handleKeywordChange = useCallback((keywords) => {
    updateField('keywords', keywords);
  }, [updateField]);

  const handleMetaTagChange = useCallback(
    (index, field, value) => {
      setFormState((previous) => {
        const metaTags = previous.metaTags.map((tag, tagIndex) =>
          tagIndex === index ? { ...tag, [field]: value } : tag,
        );
        return { ...previous, metaTags };
      });
      setError('');
    },
    [],
  );

  const handleAddMetaTag = useCallback(() => {
    setFormState((previous) => ({
      ...previous,
      metaTags: [...previous.metaTags, { attribute: 'name', key: '', value: '' }],
    }));
  }, []);

  const handleRemoveMetaTag = useCallback((index) => {
    setFormState((previous) => ({
      ...previous,
      metaTags: previous.metaTags.filter((_, tagIndex) => tagIndex !== index),
    }));
  }, []);

  const handleToggleNoindex = useCallback(() => {
    updateField('noindex', !formState.noindex);
  }, [formState.noindex, updateField]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (disableInputs) {
        return;
      }
      const path = ensurePath(formState.path);
      if (!path) {
        setError('A valid path or canonical URL is required.');
        return;
      }
      if (otherPaths.has(path.trim().toLowerCase())) {
        setError('Another override already controls this path.');
        return;
      }

      let structuredData = {};
      if (formState.structuredDataText && formState.structuredDataText.trim().length) {
        try {
          structuredData = JSON.parse(formState.structuredDataText);
        } catch (jsonError) {
          setError('Structured data JSON is invalid.');
          return;
        }
      }

      const payload = {
        id: formState.id ?? undefined,
        path,
        title: formState.title.trim(),
        description: formState.description.trim(),
        keywords: formState.keywords,
        canonicalUrl: formState.canonicalUrl.trim(),
        ogTitle: formState.ogTitle.trim(),
        ogDescription: formState.ogDescription.trim(),
        ogImageUrl: formState.ogImageUrl.trim(),
        ogImageAlt: formState.ogImageAlt.trim(),
        twitterTitle: formState.twitterTitle.trim(),
        twitterDescription: formState.twitterDescription.trim(),
        twitterCardType: formState.twitterCardType || DEFAULT_CARD_TYPE,
        twitterImageUrl: formState.twitterImageUrl.trim(),
        metaTags: sanitizeMetaTags(formState.metaTags),
        noindex: Boolean(formState.noindex),
        structuredData: {
          customJson: structuredData,
        },
      };

      onSave?.(payload);
    },
    [disableInputs, formState, onSave, otherPaths],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
      <div className="relative ml-auto flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <form className="flex h-full flex-col" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                {mode === 'edit' ? 'Edit override' : 'New override'}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Page-level SEO override</h2>
              <p className="mt-2 text-sm text-slate-500">
                Customise discovery metadata for a specific route. Overrides apply to web, sitemap, and API responses instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="overridePath">
                    Path or canonical URL
                  </label>
                  <input
                    id="overridePath"
                    value={formState.path}
                    onChange={(event) => updateField('path', event.target.value)}
                    disabled={disableInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="/enterprise"
                  />
                  <p className="text-xs text-slate-500">
                    Relative paths are automatically prefixed. Provide a fully-qualified URL for campaign-specific landing pages.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="canonicalUrl">
                    Canonical URL
                  </label>
                  <input
                    id="canonicalUrl"
                    value={formState.canonicalUrl}
                    onChange={(event) => updateField('canonicalUrl', event.target.value)}
                    disabled={disableInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="https://gigvora.com/enterprise"
                  />
                  <p className="text-xs text-slate-500">Leave blank to inherit the platform canonical from the page path.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="overrideTitle">
                    Meta title
                  </label>
                  <input
                    id="overrideTitle"
                    value={formState.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    disabled={disableInputs}
                    maxLength={180}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Gigvora for Enterprise"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="overrideDescription">
                    Meta description
                  </label>
                  <textarea
                    id="overrideDescription"
                    value={formState.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    disabled={disableInputs}
                    maxLength={5000}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Describe the value proposition for this page."
                  />
                </div>
              </div>

              <TokenInput
                label="Keywords"
                tokens={formState.keywords}
                onTokensChange={handleKeywordChange}
                disabled={disableInputs}
                description="Optional comma-separated search phrases."
                maxTokens={64}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ogTitle">
                    Open Graph title
                  </label>
                  <input
                    id="ogTitle"
                    value={formState.ogTitle}
                    onChange={(event) => updateField('ogTitle', event.target.value)}
                    disabled={disableInputs}
                    maxLength={180}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Gigvora Enterprise"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ogDescription">
                    Open Graph description
                  </label>
                  <textarea
                    id="ogDescription"
                    value={formState.ogDescription}
                    onChange={(event) => updateField('ogDescription', event.target.value)}
                    disabled={disableInputs}
                    maxLength={5000}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Craft the social share caption for LinkedIn, Slack, and Meta."
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ogImageUrl">
                    Social image URL
                  </label>
                  <input
                    id="ogImageUrl"
                    value={formState.ogImageUrl}
                    onChange={(event) => updateField('ogImageUrl', event.target.value)}
                    disabled={disableInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="https://cdn.gigvora.com/og/enterprise.png"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ogImageAlt">
                    Social image alt text
                  </label>
                  <input
                    id="ogImageAlt"
                    value={formState.ogImageAlt}
                    onChange={(event) => updateField('ogImageAlt', event.target.value)}
                    disabled={disableInputs}
                    maxLength={255}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="Gigvora enterprise talent platform"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="twitterCardType">
                    Twitter card type
                  </label>
                  <select
                    id="twitterCardType"
                    value={formState.twitterCardType}
                    onChange={(event) => updateField('twitterCardType', event.target.value)}
                    disabled={disableInputs}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="summary_large_image">Summary large image</option>
                    <option value="summary">Summary</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="twitterTitle">
                    Twitter title override
                  </label>
                  <input
                    id="twitterTitle"
                    value={formState.twitterTitle}
                    onChange={(event) => updateField('twitterTitle', event.target.value)}
                    disabled={disableInputs}
                    maxLength={180}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="twitterDescription">
                    Twitter description override
                  </label>
                  <textarea
                    id="twitterDescription"
                    value={formState.twitterDescription}
                    onChange={(event) => updateField('twitterDescription', event.target.value)}
                    disabled={disableInputs}
                    maxLength={5000}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Meta tags</p>
                  <button
                    type="button"
                    onClick={handleAddMetaTag}
                    disabled={disableInputs}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add tag
                  </button>
                </div>
                {formState.metaTags.length ? (
                  <div className="space-y-3">
                    {formState.metaTags.map((tag, index) => (
                      <div
                        key={`meta-${index}`}
                        className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[140px_1fr_1fr_auto]"
                      >
                        <select
                          value={tag.attribute}
                          onChange={(event) => handleMetaTagChange(index, 'attribute', event.target.value)}
                          disabled={disableInputs}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                        >
                          <option value="name">name</option>
                          <option value="property">property</option>
                        </select>
                        <input
                          value={tag.key}
                          onChange={(event) => handleMetaTagChange(index, 'key', event.target.value)}
                          disabled={disableInputs}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          placeholder="robots"
                        />
                        <input
                          value={tag.value}
                          onChange={(event) => handleMetaTagChange(index, 'value', event.target.value)}
                          disabled={disableInputs}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                          placeholder="noarchive"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMetaTag(index)}
                          disabled={disableInputs}
                          className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500">
                    No custom meta tags yet. Add tags to support niche crawler directives.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <input
                    type="checkbox"
                    checked={Boolean(formState.noindex)}
                    onChange={handleToggleNoindex}
                    disabled={disableInputs}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Mark as noindex</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Prevent search engines from indexing this route while keeping it available to members.
                    </span>
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="structuredData">
                  Structured data (JSON-LD)
                </label>
                <textarea
                  id="structuredData"
                  value={formState.structuredDataText}
                  onChange={(event) => updateField('structuredDataText', event.target.value)}
                  disabled={disableInputs}
                  rows={8}
                  placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "SoftwareApplication"\n}`}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <p className="text-xs text-slate-500">
                  Paste JSON-LD to enrich search snippets with product, FAQ, or breadcrumb schema. Invalid JSON will block save.
                </p>
              </div>
            </div>
            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
            {mode === 'edit' && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(formState)}
                disabled={disableInputs}
                className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete override
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disableInputs}
                className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
              >
                Save override
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
