import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BeakerIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import analytics from '../../../services/analytics.js';
import { fetchSeoSchemaTemplates } from '../../../services/seoConsole.js';

const FALLBACK_TEMPLATES = [
  {
    slug: 'article',
    label: 'Article',
    schemaType: 'Article',
    description: 'Long-form editorial with author and publisher metadata.',
    jsonTemplate: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'How Gigvora elevates mentorship marketplaces',
      description: 'Discover the frameworks Gigvora uses to match founders, mentors, and investors with precision.',
      author: {
        '@type': 'Person',
        name: 'Nia Chen',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Gigvora',
        logo: {
          '@type': 'ImageObject',
          url: 'https://cdn.gigvora.com/logos/wordmark.png',
        },
      },
      datePublished: '2024-05-10',
      image: 'https://cdn.gigvora.com/og/story-mentorship.png',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://gigvora.com/stories/mentorship-operating-system',
      },
    },
    recommendedFields: ['headline', 'description', 'author', 'datePublished'],
    richResultPreview: {
      title: 'Gigvora · Editorial insight',
      description: 'Mentorship operating system for elite founders.',
      url: 'https://gigvora.com/stories/mentorship-operating-system',
    },
  },
  {
    slug: 'product',
    label: 'Product',
    schemaType: 'Product',
    description: 'Merchandised product with offer metadata and aggregate ratings.',
    jsonTemplate: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Launchpad by Gigvora',
      description: 'AI scouting platform built for recruiters and venture teams.',
      image: 'https://cdn.gigvora.com/og/launchpad.png',
      brand: {
        '@type': 'Brand',
        name: 'Gigvora',
      },
      offers: {
        '@type': 'Offer',
        price: '499',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://gigvora.com/launchpad',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: 124,
      },
    },
    recommendedFields: ['name', 'description', 'offers'],
    richResultPreview: {
      title: 'Launchpad by Gigvora',
      description: 'AI scouting platform · Rated 4.9★',
      url: 'https://gigvora.com/launchpad',
      badges: ['In stock', '$499 USD'],
    },
  },
  {
    slug: 'event',
    label: 'Event',
    schemaType: 'Event',
    description: 'Hybrid events with schedule, location, and organiser metadata.',
    jsonTemplate: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Gigvora Mentor Summit',
      description: 'An invite-only gathering for operators, founders, and career mentors.',
      startDate: '2024-08-21T09:00',
      endDate: '2024-08-21T17:00',
      eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: 'Gigvora HQ',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '470 Mission Street',
          addressLocality: 'San Francisco',
          addressRegion: 'CA',
          postalCode: '94105',
          addressCountry: 'US',
        },
      },
      image: ['https://cdn.gigvora.com/events/mentor-summit.png'],
      performer: {
        '@type': 'Organization',
        name: 'Gigvora',
      },
    },
    recommendedFields: ['name', 'startDate', 'location'],
    richResultPreview: {
      title: 'Gigvora Mentor Summit',
      description: 'Hybrid summit · August 21, 2024',
      url: 'https://gigvora.com/events/mentor-summit',
      badges: ['Starts 8/21/2024'],
    },
  },
  {
    slug: 'job-posting',
    label: 'Job Posting',
    schemaType: 'JobPosting',
    description: 'Job listings with salary, employer, and location metadata.',
    jsonTemplate: {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Founding Product Designer',
      description: 'Shape the premium professional network for ambitious operators at Gigvora.',
      datePosted: '2024-05-09',
      employmentType: 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Gigvora',
        sameAs: 'https://gigvora.com',
        logo: 'https://cdn.gigvora.com/logos/wordmark.png',
      },
      jobLocationType: 'TELECOMMUTE',
      validThrough: '2024-07-01',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'US',
      },
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: {
          '@type': 'QuantitativeValue',
          value: 180000,
          unitText: 'YEAR',
        },
      },
    },
    recommendedFields: ['title', 'description', 'hiringOrganization'],
    richResultPreview: {
      title: 'Founding Product Designer',
      description: 'Gigvora · Remote · $180,000/year',
      url: 'https://gigvora.com/jobs/founding-product-designer',
      badges: ['Remote', 'Full time'],
    },
  },
];

const REQUIRED_FIELDS = {
  Article: ['headline', 'description', 'author', 'datePublished'],
  Product: ['name', 'description', 'offers'],
  Event: ['name', 'startDate', 'location'],
  JobPosting: ['title', 'description', 'hiringOrganization'],
};
function normaliseTemplate(template) {
  if (!template) {
    return null;
  }
  return {
    slug: template.slug || template.schemaType || template.label,
    label: template.label || template.schemaType || template.slug,
    schemaType: template.schemaType || template.slug || 'Custom',
    description: template.description || '',
    jsonTemplate: template.jsonTemplate || template.template || {},
    recommendedFields: Array.isArray(template.recommendedFields) ? template.recommendedFields : [],
    richResultPreview: template.richResultPreview || null,
    sampleData: template.sampleData || null,
    isActive: template.isActive !== false,
  };
}

function determineInitialTemplate(templates, initialType) {
  if (!templates.length) {
    return null;
  }
  if (initialType) {
    const bySlug = templates.find((template) => template.slug === initialType);
    if (bySlug) {
      return bySlug.slug;
    }
    const bySchemaType = templates.find((template) => template.schemaType === initialType);
    if (bySchemaType) {
      return bySchemaType.slug;
    }
  }
  const articleTemplate = templates.find((template) => template.schemaType === 'Article');
  return (articleTemplate || templates[0]).slug;
}

function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return '';
  }
}

function parseSchema(input) {
  if (!input) {
    return { error: 'Schema input cannot be empty.' };
  }
  try {
    return { value: JSON.parse(input) };
  } catch (error) {
    return { error: error.message };
  }
}

function collectIssues(schema, template) {
  const issues = [];
  if (!schema) {
    issues.push({ severity: 'error', message: 'No schema supplied.' });
    return issues;
  }
  const required = Array.isArray(template?.recommendedFields) && template.recommendedFields.length
    ? template.recommendedFields
    : REQUIRED_FIELDS[template?.schemaType] ?? [];
  required.forEach((field) => {
    if (!(field in schema)) {
      issues.push({ severity: 'error', message: `${field} is required for ${template?.schemaType ?? 'this'} schema.` });
    }
  });
  if (schema.image && !Array.isArray(schema.image) && typeof schema.image !== 'string') {
    issues.push({ severity: 'warning', message: 'Image should be a string or array of URLs.' });
  }
  if (schema.description && schema.description.length < 50) {
    issues.push({ severity: 'warning', message: 'Descriptions under 50 characters rarely rank well.' });
  }
  if (!schema['@context']) {
    issues.push({ severity: 'warning', message: 'Missing @context property; search engines expect schema.org context.' });
  }
  if (schema['@type'] && template?.schemaType && schema['@type'] !== template.schemaType) {
    issues.push({ severity: 'warning', message: `@type is ${schema['@type']} but template selected is ${template.schemaType}.` });
  }
  return issues;
}

function buildPreview(schema, template) {
  if (!schema && template?.richResultPreview) {
    return {
      title: template.richResultPreview.title,
      description: template.richResultPreview.description,
      url: template.richResultPreview.url,
      badges: template.richResultPreview.badges ?? [],
    };
  }
  if (!schema) {
    return {
      title: `${template?.schemaType ?? 'Schema'} preview`,
      description: 'Paste structured data to preview search snippets.',
      url: 'https://gigvora.com',
      badges: [],
    };
  }
  const title = schema.headline || schema.name || schema.title || template?.richResultPreview?.title || `${template?.schemaType ?? 'Schema'} preview`;
  const description =
    schema.description || template?.richResultPreview?.description || 'Add a description to improve engagement.';
  const url = schema.mainEntityOfPage?.['@id'] || schema.url || template?.richResultPreview?.url || 'https://gigvora.com';
  const badges = [];
  if (schema.aggregateRating?.ratingValue) {
    badges.push(`${schema.aggregateRating.ratingValue}★ rating`);
  }
  if (schema.offers?.price) {
    badges.push(`$${schema.offers.price} ${schema.offers.priceCurrency ?? ''}`.trim());
  }
  if (schema.startDate) {
    badges.push(`Starts ${new Date(schema.startDate).toLocaleDateString()}`);
  }
  if (schema.baseSalary?.value?.value) {
    badges.push(`$${schema.baseSalary.value.value.toLocaleString()} ${schema.baseSalary.value.unitText ?? ''}`.trim());
  }
  if (Array.isArray(template?.richResultPreview?.badges)) {
    badges.push(...template.richResultPreview.badges);
  }
  return { title, description, url, badges };
}

function computeScore(issues, schema) {
  let score = 100;
  score -= issues.filter((issue) => issue.severity === 'error').length * 15;
  score -= issues.filter((issue) => issue.severity === 'warning').length * 7;
  if (!schema) {
    score -= 40;
  }
  return Math.max(0, Math.min(100, score));
}

function buildRecommendations(issues, schema, template) {
  const tips = [];
  if (!schema) {
    tips.push('Insert a template and tailor it to your page to unlock previews.');
    return tips;
  }
  const schemaType = template?.schemaType;
  if (!schema.author && schemaType === 'Article') {
    tips.push('Add an author object to strengthen trust and E-E-A-T signals.');
  }
  if (!schema.offers && schemaType === 'Product') {
    tips.push('Provide an Offer block so pricing renders directly in search results.');
  }
  if (schema.description && schema.description.length > 160) {
    tips.push('Trim description to 160 characters for richer snippets.');
  }
  if (!schema.image) {
    tips.push('Attach imagery or logos to unlock Google Discover eligibility.');
  }
  if (!issues.length) {
    tips.push('All checks passed—ship to production and monitor Search Console rich result status.');
  }
  return tips;
}
export default function SchemaPreviewer({
  initialType = 'Article',
  initialSchema,
  analyticsMetadata = {},
  onSchemaChange,
}) {
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState(null);
  const [schemaInput, setSchemaInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadTemplates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchSeoSchemaTemplates();
        if (!active) return;
        const resolved = Array.isArray(response?.templates)
          ? response.templates
              .map(normaliseTemplate)
              .filter((template) => template && template.isActive !== false)
          : [];
        const merged = resolved.length ? resolved : FALLBACK_TEMPLATES;
        setTemplates(merged);
        const initialSlug = determineInitialTemplate(merged, initialType);
        setSelectedTemplateSlug(initialSlug);
        const template = merged.find((item) => item.slug === initialSlug) ?? merged[0];
        const startingValue = initialSchema ? safeStringify(initialSchema) : safeStringify(template?.jsonTemplate ?? {});
        setSchemaInput(startingValue);
      } catch (err) {
        if (!active) return;
        setError(err);
        setTemplates(FALLBACK_TEMPLATES);
        const initialSlug = determineInitialTemplate(FALLBACK_TEMPLATES, initialType);
        setSelectedTemplateSlug(initialSlug);
        const template = FALLBACK_TEMPLATES.find((item) => item.slug === initialSlug) ?? FALLBACK_TEMPLATES[0];
        const startingValue = initialSchema ? safeStringify(initialSchema) : safeStringify(template?.jsonTemplate ?? {});
        setSchemaInput(startingValue);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadTemplates();
    return () => {
      active = false;
    };
  }, [initialSchema, initialType]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.slug === selectedTemplateSlug) ?? null,
    [templates, selectedTemplateSlug],
  );

  const schemaType = selectedTemplate?.schemaType ?? initialType;
  const parsed = useMemo(() => parseSchema(schemaInput), [schemaInput]);
  const schema = parsed.value ?? null;
  const issues = useMemo(() => collectIssues(schema, selectedTemplate), [schema, selectedTemplate]);
  const preview = useMemo(() => buildPreview(schema, selectedTemplate), [schema, selectedTemplate]);
  const score = useMemo(() => computeScore(issues, schema), [issues, schema]);
  const recommendations = useMemo(
    () => buildRecommendations(issues, schema, selectedTemplate),
    [issues, schema, selectedTemplate],
  );

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    analytics.track(
      'seo_schema_previewer_viewed',
      { schemaType: selectedTemplate.schemaType },
      { source: analyticsMetadata.source ?? 'seo_console' },
    );
  }, [analyticsMetadata.source, selectedTemplate]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    onSchemaChange?.(schema, { schemaType: selectedTemplate.schemaType, issues, score, template: selectedTemplate });
  }, [schema, selectedTemplate, issues, score, onSchemaChange]);

  const handleTemplateChange = (slug) => {
    const template = templates.find((item) => item.slug === slug);
    setSelectedTemplateSlug(slug);
    if (!template) {
      return;
    }
    setSchemaInput(safeStringify(template.jsonTemplate));
    setCopied(false);
    analytics.track(
      'seo_schema_template_applied',
      { schemaType: template.schemaType, template: slug },
      { source: analyticsMetadata.source ?? 'seo_console' },
    );
  };

  const handleBeautify = () => {
    if (!schema || parsed.error) return;
    setSchemaInput(JSON.stringify(schema, null, 2));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(schemaInput);
      setCopied(true);
      analytics.track(
        'seo_schema_copied',
        { schemaType: selectedTemplate?.schemaType, hasErrors: issues.some((issue) => issue.severity === 'error') },
        { source: analyticsMetadata.source ?? 'seo_console' },
      );
      setTimeout(() => setCopied(false), 1500);
    } catch (copyError) {
      setCopied(false);
    }
  };

  const handleReset = () => {
    if (!selectedTemplate) return;
    setSchemaInput(JSON.stringify(selectedTemplate.jsonTemplate, null, 2));
    setCopied(false);
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 text-white shadow-[0_60px_200px_rgba(30,64,175,0.45)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_65%)]" aria-hidden="true" />
        <div className="flex min-h-[240px] items-center justify-center text-sm text-white/60">Loading structured data lab…</div>
      </section>
    );
  }
  const templateOptions = templates.filter((template) => template); // guard against null entries
  const activeTemplate = selectedTemplate || templateOptions[0] || FALLBACK_TEMPLATES[0];

  return (
    <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 text-white shadow-[0_60px_200px_rgba(30,64,175,0.45)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_65%)]" aria-hidden="true" />
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex w-full flex-col gap-8 lg:w-2/3">
          <header className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200/30 bg-indigo-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-100">
              Structured data lab
              <SparklesIcon className="h-4 w-4" aria-hidden="true" />
            </p>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Preview rich results before they reach Google.</h2>
              <p className="text-sm text-white/70">
                Switch between schema types, validate requirements instantly, and showcase how Gigvora pages appear in search, messaging apps, and social cards.
              </p>
            </div>
            {error ? (
              <div className="rounded-3xl border border-amber-300/60 bg-amber-300/10 p-4 text-xs text-amber-100 shadow-[0_12px_32px_rgba(251,191,36,0.25)]">
                <p className="font-semibold uppercase tracking-[0.32em]">Template service unavailable</p>
                <p>{error?.message ?? 'Using fallback templates while the template service recovers.'}</p>
              </div>
            ) : null}
          </header>

          <div className="flex flex-wrap gap-3">
            {templateOptions.map((template) => (
              <button
                key={template.slug}
                type="button"
                onClick={() => handleTemplateChange(template.slug)}
                className={clsx(
                  'rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] transition',
                  selectedTemplateSlug === template.slug
                    ? 'border-indigo-200/60 bg-indigo-200/20 text-white shadow-[0_14px_40px_rgba(99,102,241,0.4)]'
                    : 'border-white/15 bg-transparent text-white/60 hover:border-indigo-200/40 hover:text-white',
                )}
              >
                {template.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(30,64,175,0.4)]">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">JSON-LD markup</span>
              <textarea
                value={schemaInput}
                onChange={(event) => setSchemaInput(event.target.value)}
                rows={18}
                className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 font-mono text-xs text-indigo-100 shadow-inner focus:border-indigo-200 focus:outline-none"
              />
            </label>
            {parsed.error ? (
              <div className="flex items-start gap-3 rounded-3xl border border-rose-400/60 bg-rose-400/10 p-4 text-xs text-rose-100 shadow-inner">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
                <div>
                  <p className="font-semibold uppercase tracking-[0.32em]">Parsing error</p>
                  <p>{parsed.error}</p>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleBeautify}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/80 transition hover:border-indigo-200/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
              >
                <CodeBracketIcon className="h-4 w-4" aria-hidden="true" />
                Beautify
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-slate-950 shadow-[0_18px_48px_rgba(129,140,248,0.45)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
              >
                <ClipboardDocumentCheckIcon className="h-4 w-4" aria-hidden="true" />
                {copied ? 'Copied' : 'Copy JSON-LD'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/80 transition hover:border-indigo-200/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                Reset template
              </button>
            </div>
          </div>

          <footer className="flex flex-col gap-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_110px_rgba(30,64,175,0.45)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <BeakerIcon className="h-6 w-6 text-indigo-200" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-white">Schema score {score}/100</p>
                <p className="text-xs text-white/60">{issues.length ? `${issues.length} issue(s) detected` : 'All validations passing'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.32em] text-white/60">
              <span className="rounded-full border border-white/15 px-4 py-2">Type {activeTemplate?.schemaType}</span>
              <span className="rounded-full border border-white/15 px-4 py-2">Size {schemaInput.length} chars</span>
            </div>
          </footer>
        </div>

        <aside className="flex w-full flex-col gap-6 lg:w-1/3">
          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_100px_rgba(30,64,175,0.4)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Rich result preview</h3>
            <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-inner">
              <p className="text-xs uppercase tracking-[0.32em] text-indigo-200">{preview.url.replace(/^https?:\/\//, '')}</p>
              <p className="text-lg font-semibold text-white">{preview.title}</p>
              <p className="text-sm text-white/70">{preview.description}</p>
              <div className="flex flex-wrap gap-2">
                {preview.badges.map((badge) => (
                  <span key={badge} className="rounded-full border border-indigo-200/40 bg-indigo-200/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-indigo-100">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-xs text-white/60 shadow-inner">
              <p className="mb-2 font-semibold uppercase tracking-[0.32em] text-white/50">Channel preview</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4 text-indigo-200" aria-hidden="true" />
                  <span>Google result snippet</span>
                </div>
                <div className="flex items-center gap-2">
                  <GlobeAltIcon className="h-4 w-4 text-indigo-200" aria-hidden="true" />
                  <span>Messenger embed &amp; Slack unfurl</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-4xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_100px_rgba(30,64,175,0.4)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Validation results</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {issues.length === 0 ? <li className="flex items-start gap-2 text-emerald-200"><CheckCircleIcon className="mt-0.5 h-4 w-4" aria-hidden="true" /> Schema is production-ready.</li> : null}
              {issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  {issue.severity === 'error' ? (
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 text-rose-400" aria-hidden="true" />
                  ) : (
                    <InformationCircleIcon className="mt-0.5 h-4 w-4 text-amber-300" aria-hidden="true" />
                  )}
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-xs text-white/60 shadow-inner">
              <p className="mb-2 font-semibold uppercase tracking-[0.32em] text-white/50">Recommendations</p>
              <ul className="space-y-2">
                {recommendations.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <AdjustmentsHorizontalIcon className="mt-0.5 h-4 w-4 text-indigo-200" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

SchemaPreviewer.propTypes = {
  initialType: PropTypes.string,
  initialSchema: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  analyticsMetadata: PropTypes.shape({
    source: PropTypes.string,
  }),
  onSchemaChange: PropTypes.func,
};

SchemaPreviewer.defaultProps = {
  initialType: 'Article',
  initialSchema: undefined,
  analyticsMetadata: {},
  onSchemaChange: undefined,
};
