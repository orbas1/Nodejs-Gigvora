import { useMemo } from 'react';
import TokenInput from './TokenInput.jsx';

const DEFAULT_VALIDATION = {
  errors: {},
  warnings: {},
  hasBlockingErrors: false,
};

function isValidAbsoluteUrl(value, { requireHttps = false } = {}) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    const protocols = requireHttps ? ['https:'] : ['https:', 'http:'];
    if (!protocols.includes(parsed.protocol)) {
      return false;
    }
    return Boolean(parsed.hostname);
  } catch (error) {
    return false;
  }
}

function validateCanonicalBaseUrl(value) {
  if (!value) return null;
  if (!isValidAbsoluteUrl(value, { requireHttps: true })) {
    return 'Enter a valid https:// base URL without extra path segments.';
  }
  try {
    const parsed = new URL(value);
    if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname !== '') {
      return 'Base URL should not include path segments.';
    }
    if (parsed.search || parsed.hash) {
      return 'Remove query parameters and fragments from the base URL.';
    }
  } catch (error) {
    return 'Enter a valid https:// base URL without extra path segments.';
  }
  return null;
}

function validateSitemapUrl(value) {
  if (!value) return null;
  if (!isValidAbsoluteUrl(value)) {
    return 'Enter a valid sitemap URL ending in .xml.';
  }
  try {
    const parsed = new URL(value);
    if (!parsed.pathname?.endsWith('.xml')) {
      return 'Enter a valid sitemap URL ending in .xml.';
    }
  } catch (error) {
    return 'Enter a valid sitemap URL ending in .xml.';
  }
  return null;
}

function formatPathToken(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed}`;
}

function formatKeywordToken(value) {
  return value?.trim().toLowerCase();
}

export default function SeoSettingsForm({
  draft,
  onDraftChange,
  disableInputs,
  onAddOverride,
  onEditOverride,
  onRemoveOverride,
}) {
  if (!draft) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
        Loading SEO configuration…
      </div>
    );
  }

  const handleTopLevelChange = (field) => (event) => {
    const value = event.target.value;
    onDraftChange((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleBooleanChange = (field) => (event) => {
    const value = event.target.checked;
    onDraftChange((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleKeywordChange = (keywords) => {
    const sanitized = (Array.isArray(keywords) ? keywords : [])
      .map((keyword) => formatKeywordToken(keyword))
      .filter(Boolean);
    onDraftChange((previous) => ({
      ...previous,
      defaultKeywords: sanitized,
    }));
  };

  const handleNoindexPathChange = (paths) => {
    const sanitized = (Array.isArray(paths) ? paths : [])
      .map((path) => formatPathToken(path))
      .filter(Boolean);
    onDraftChange((previous) => ({
      ...previous,
      noindexPaths: sanitized,
    }));
  };

  const handleVerificationChange = (field) => (event) => {
    const value = event.target.value;
    onDraftChange((previous) => ({
      ...previous,
      verificationCodes: {
        ...previous.verificationCodes,
        [field]: value.trim(),
      },
    }));
  };

  const handleSocialChange = (field) => (event) => {
    const value = event.target.value;
    onDraftChange((previous) => ({
      ...previous,
      socialDefaults: {
        ...previous.socialDefaults,
        [field]: value,
      },
    }));
  };

  const handleOrganizationChange = (field) => (event) => {
    const value = event.target.value;
    onDraftChange((previous) => ({
      ...previous,
      structuredData: {
        ...previous.structuredData,
        organization: {
          ...previous.structuredData?.organization,
          [field]: value,
        },
      },
    }));
  };

  const handleSameAsChange = (values) => {
    const sanitized = (Array.isArray(values) ? values : [])
      .map((value) => value?.trim())
      .filter(Boolean);
    onDraftChange((previous) => ({
      ...previous,
      structuredData: {
        ...previous.structuredData,
        organization: {
          ...previous.structuredData?.organization,
          sameAs: sanitized,
        },
      },
    }));
  };

  const handleCustomJsonChange = (event) => {
    const value = event.target.value;
    onDraftChange((previous) => ({
      ...previous,
      structuredData: {
        ...previous.structuredData,
        customJsonText: value,
      },
    }));
  };

  const overrides = Array.isArray(draft.pageOverrides) ? draft.pageOverrides : [];

  const validation = useMemo(() => {
    if (!draft) return DEFAULT_VALIDATION;

    const errors = {};
    const warnings = {};

    const canonicalError = validateCanonicalBaseUrl(draft.canonicalBaseUrl);
    if (canonicalError) {
      errors.canonicalBaseUrl = canonicalError;
    }

    const sitemapError = validateSitemapUrl(draft.sitemapUrl);
    if (sitemapError) {
      errors.sitemapUrl = sitemapError;
    }

    const invalidSameAs = (draft.structuredData?.organization?.sameAs ?? []).filter(
      (value) => !isValidAbsoluteUrl(value, { requireHttps: false }),
    );

    if (invalidSameAs.length) {
      warnings.sameAs =
        invalidSameAs.length === 1
          ? 'Review profile URLs – 1 link is not a valid http(s) address.'
          : `Review profile URLs – ${invalidSameAs.length} links are not valid http(s) addresses.`;
    }

    const invalidVerificationProviders = Object.entries(draft.verificationCodes ?? {})
      .filter(([, code]) => (code?.trim().length ?? 0) > 255)
      .map(([provider]) => provider);

    if (invalidVerificationProviders.length) {
      warnings.verificationCodes = `Shorten verification codes for ${invalidVerificationProviders.join(
        ', ',
      )} (255 character limit).`;
    }

    if (draft.socialDefaults?.twitterHandle) {
      const handle = draft.socialDefaults.twitterHandle.trim();
      if (!/^@?[A-Za-z0-9_]{1,15}$/.test(handle)) {
        errors.twitterHandle = 'Provide a valid X (Twitter) handle (letters, numbers, underscore).';
      }
    }

    const jsonText = draft.structuredData?.customJsonText;
    if (jsonText && jsonText.trim()) {
      try {
        JSON.parse(jsonText);
      } catch (error) {
        errors.customJsonText = `Invalid JSON-LD: ${error.message}`;
      }
    }

    const logoUrl = draft.structuredData?.organization?.logoUrl;
    if (logoUrl && !isValidAbsoluteUrl(logoUrl)) {
      warnings.logoUrl = 'Logos should use a fully qualified URL accessible to crawlers.';
    }

    const hasBlockingErrors = Object.keys(errors).length > 0;

    return {
      errors,
      warnings,
      hasBlockingErrors,
    };
  }, [draft]);

  return (
    <div className="space-y-8">
      {validation.hasBlockingErrors ? (
        <div
          className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          role="alert"
        >
          Please resolve the highlighted fields before publishing. Search crawlers require accurate URLs and structured data.
        </div>
      ) : null}
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/40 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Search foundations</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Global metadata defaults</h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Define the default title, description, and keyword strategy that power every public surface across web, mobile,
              and embedded widgets. Changes synchronise instantly with the sitemap service and edge cache.
            </p>
          </div>
          <div className="grid gap-3 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-600">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Indexation</p>
              <p className="mt-1 text-sm text-slate-800">{draft.allowIndexing ? 'Open to crawlers' : 'Blocked from index'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-600">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Keywords in use</p>
              <p className="mt-1 text-sm text-slate-800">{draft.defaultKeywords?.length ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="siteName">
              Site name
            </label>
            <input
              id="siteName"
              value={draft.siteName ?? ''}
              onChange={handleTopLevelChange('siteName')}
              disabled={disableInputs}
              maxLength={180}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Gigvora"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="defaultTitle">
              Default meta title
            </label>
            <input
              id="defaultTitle"
              value={draft.defaultTitle ?? ''}
              onChange={handleTopLevelChange('defaultTitle')}
              disabled={disableInputs}
              maxLength={180}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Gigvora – Global talent operating system"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="defaultDescription">
              Default meta description
            </label>
            <textarea
              id="defaultDescription"
              value={draft.defaultDescription ?? ''}
              onChange={handleTopLevelChange('defaultDescription')}
              disabled={disableInputs}
              rows={4}
              maxLength={5000}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Gigvora connects verified experts with high-trust organisations, unifying hiring, project delivery, and payments in a single compliant workspace."
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TokenInput
            label="Default keywords"
            tokens={draft.defaultKeywords ?? []}
            onTokensChange={handleKeywordChange}
            disabled={disableInputs}
            description="Used as a fallback for landing pages without specific overrides."
            maxTokens={64}
            formatToken={formatKeywordToken}
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="canonicalBaseUrl">
              Canonical base URL
            </label>
            <input
              id="canonicalBaseUrl"
              value={draft.canonicalBaseUrl ?? ''}
              onChange={handleTopLevelChange('canonicalBaseUrl')}
              disabled={disableInputs}
              aria-invalid={Boolean(validation.errors.canonicalBaseUrl)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="https://gigvora.com"
            />
            <p className="text-xs text-slate-500">
              Used to build canonical tags across the platform and sitemap entries.
            </p>
            {validation.errors.canonicalBaseUrl ? (
              <p className="text-xs text-rose-600" role="alert">
                {validation.errors.canonicalBaseUrl}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/30 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Crawler directives</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Indexation controls</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Fine-tune how search engines access Gigvora. Enabling noindex patterns and robots.txt updates takes effect within
              minutes across edge CDN caches.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(draft.allowIndexing)}
              onChange={handleBooleanChange('allowIndexing')}
              disabled={disableInputs}
              className="h-5 w-5 rounded border-slate-300 text-accent focus:ring-accent"
            />
            Allow search indexing
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TokenInput
            label="Noindex paths"
            tokens={draft.noindexPaths ?? []}
            onTokensChange={handleNoindexPathChange}
            disabled={disableInputs}
            description={'Paths listed here emit <meta name="robots" content="noindex"> tags.'}
            formatToken={formatPathToken}
            maxTokens={200}
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="sitemapUrl">
              Sitemap URL
            </label>
            <input
              id="sitemapUrl"
              value={draft.sitemapUrl ?? ''}
              onChange={handleTopLevelChange('sitemapUrl')}
              disabled={disableInputs}
              aria-invalid={Boolean(validation.errors.sitemapUrl)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="https://gigvora.com/sitemap.xml"
            />
            <p className="text-xs text-slate-500">Shared with search engines during verification and ping refresh cycles.</p>
            {validation.errors.sitemapUrl ? (
              <p className="text-xs text-rose-600" role="alert">
                {validation.errors.sitemapUrl}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="robotsPolicy">
            robots.txt policy
          </label>
          <textarea
            id="robotsPolicy"
            value={draft.robotsPolicy ?? ''}
            onChange={handleTopLevelChange('robotsPolicy')}
            disabled={disableInputs}
            rows={6}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder={`User-agent: *\nAllow: /\nDisallow: /beta`}
          />
          <p className="text-xs text-slate-500">
            Updates deploy to CDN edge workers instantly. Keep sensitive workspaces protected from accidental discovery.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/30 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Verification</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Search console ownership</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Prove ownership to the major search platforms. Codes are embedded in the <code>head</code> of every public page and
          refreshed for mobile web instantly.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {['google', 'bing', 'yandex', 'pinterest', 'baidu'].map((provider) => (
            <div key={provider} className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={`verify-${provider}`}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)} verification code
              </label>
              <input
                id={`verify-${provider}`}
                value={draft.verificationCodes?.[provider] ?? ''}
                onChange={handleVerificationChange(provider)}
                disabled={disableInputs}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder={`Paste ${provider} site verification value`}
              />
            </div>
          ))}
        </div>
        {validation.warnings.verificationCodes ? (
          <p className="mt-4 text-xs text-amber-600">{validation.warnings.verificationCodes}</p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/30 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Social graph defaults</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Open Graph & Twitter</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Configure share-ready defaults that apply whenever a page does not include bespoke creative. Provide evergreen copy
          and imagery to maintain a cohesive brand across LinkedIn, Meta, Slack, and X.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ogTitleDefault">
              Open Graph title
            </label>
            <input
              id="ogTitleDefault"
              value={draft.socialDefaults?.ogTitle ?? ''}
              onChange={handleSocialChange('ogTitle')}
              disabled={disableInputs}
              maxLength={180}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ogDescriptionDefault">
              Open Graph description
            </label>
            <textarea
              id="ogDescriptionDefault"
              value={draft.socialDefaults?.ogDescription ?? ''}
              onChange={handleSocialChange('ogDescription')}
              disabled={disableInputs}
              rows={3}
              maxLength={5000}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ogImageDefault">
              Default social image URL
            </label>
            <input
              id="ogImageDefault"
              value={draft.socialDefaults?.ogImageUrl ?? ''}
              onChange={handleSocialChange('ogImageUrl')}
              disabled={disableInputs}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="ogImageAltDefault">
              Social image alt text
            </label>
            <input
              id="ogImageAltDefault"
              value={draft.socialDefaults?.ogImageAlt ?? ''}
              onChange={handleSocialChange('ogImageAlt')}
              disabled={disableInputs}
              maxLength={255}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="twitterHandle">
              X (Twitter) handle
            </label>
            <input
              id="twitterHandle"
              value={draft.socialDefaults?.twitterHandle ?? ''}
              onChange={handleSocialChange('twitterHandle')}
              disabled={disableInputs}
              aria-invalid={Boolean(validation.errors.twitterHandle)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="@gigvora"
            />
            {validation.errors.twitterHandle ? (
              <p className="text-xs text-rose-600" role="alert">
                {validation.errors.twitterHandle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="twitterTitleDefault">
              Twitter title
            </label>
            <input
              id="twitterTitleDefault"
              value={draft.socialDefaults?.twitterTitle ?? ''}
              onChange={handleSocialChange('twitterTitle')}
              disabled={disableInputs}
              maxLength={180}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="twitterDescriptionDefault">
              Twitter description
            </label>
            <textarea
              id="twitterDescriptionDefault"
              value={draft.socialDefaults?.twitterDescription ?? ''}
              onChange={handleSocialChange('twitterDescription')}
              disabled={disableInputs}
              rows={3}
              maxLength={5000}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="twitterCardTypeDefault">
              Twitter card type
            </label>
            <select
              id="twitterCardTypeDefault"
              value={draft.socialDefaults?.twitterCardType ?? 'summary_large_image'}
              onChange={handleSocialChange('twitterCardType')}
              disabled={disableInputs}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="summary_large_image">Summary large image</option>
              <option value="summary">Summary</option>
              <option value="app">App</option>
              <option value="player">Player</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="twitterImageUrlDefault">
              Twitter image URL
            </label>
            <input
              id="twitterImageUrlDefault"
              value={draft.socialDefaults?.twitterImageUrl ?? ''}
              onChange={handleSocialChange('twitterImageUrl')}
              disabled={disableInputs}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/30 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Schema</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Structured data</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Keep search engines informed with organisation-level schema and optional custom JSON-LD. Perfect for enabling rich
          snippets, knowledge panels, and local discovery.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="orgName">
              Organisation name
            </label>
            <input
              id="orgName"
              value={draft.structuredData?.organization?.name ?? ''}
              onChange={handleOrganizationChange('name')}
              disabled={disableInputs}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="orgUrl">
              Organisation URL
            </label>
            <input
              id="orgUrl"
              value={draft.structuredData?.organization?.url ?? ''}
              onChange={handleOrganizationChange('url')}
              disabled={disableInputs}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="orgLogo">
              Logo URL
            </label>
            <input
              id="orgLogo"
              value={draft.structuredData?.organization?.logoUrl ?? ''}
              onChange={handleOrganizationChange('logoUrl')}
              disabled={disableInputs}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="orgContact">
              Contact email
            </label>
            <input
              id="orgContact"
              value={draft.structuredData?.organization?.contactEmail ?? ''}
              onChange={handleOrganizationChange('contactEmail')}
              disabled={disableInputs}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <div className="mt-4">
          <TokenInput
            label="Organisation sameAs profiles"
            tokens={draft.structuredData?.organization?.sameAs ?? []}
            onTokensChange={handleSameAsChange}
            disabled={disableInputs}
            description="Links to social profiles or marketplaces displayed in structured data."
          />
          {validation.warnings.sameAs ? (
            <p className="mt-2 text-xs text-amber-600">{validation.warnings.sameAs}</p>
          ) : null}
        </div>
        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="customJson">
            Additional JSON-LD
          </label>
          <textarea
            id="customJson"
            value={draft.structuredData?.customJsonText ?? ''}
            onChange={handleCustomJsonChange}
            disabled={disableInputs}
            rows={8}
            aria-invalid={Boolean(validation.errors.customJsonText)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": []\n}`}
          />
          <p className="text-xs text-slate-500">
            Provide valid JSON to supplement the organisation schema. Applied to every public route unless overridden.
          </p>
          {validation.errors.customJsonText ? (
            <p className="text-xs text-rose-600" role="alert">
              {validation.errors.customJsonText}
            </p>
          ) : null}
          {validation.warnings.logoUrl ? (
            <p className="text-xs text-amber-600">{validation.warnings.logoUrl}</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-blue-100/30 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Precision overrides</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Page-level controls</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Apply bespoke metadata, social creative, and structured data to high-impact landing pages. Overrides take priority
              over global defaults and propagate to all downstream clients.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddOverride}
            disabled={disableInputs}
            className="inline-flex items-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
          >
            New override
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {overrides.length ? (
            overrides.map((override, index) => (
              <div
                key={override.id ?? `override-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{override.path}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {override.title ? override.title : 'Inherits global title'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
                      <span className={`rounded-full px-3 py-1 font-semibold ${override.noindex ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {override.noindex ? 'Noindex' : 'Indexed'}
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                        {override.keywords?.length ?? 0} keywords
                      </span>
                      {override.metaTags?.length ? (
                        <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700">
                          {override.metaTags.length} meta tags
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onEditOverride(override)}
                      disabled={disableInputs}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveOverride(override)}
                      disabled={disableInputs}
                      className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
              No overrides have been configured yet. Use this to elevate hero campaigns, regional pages, or product launches.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
