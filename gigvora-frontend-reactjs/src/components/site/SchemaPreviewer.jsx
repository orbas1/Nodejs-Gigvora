import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CheckCircleIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

const DEFAULT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Gigvora',
  url: 'https://gigvora.com',
  logo: 'https://cdn.gigvora.com/brand/logomark.png',
  sameAs: [
    'https://www.linkedin.com/company/gigvora',
    'https://www.instagram.com/gigvora',
  ],
};

const SCHEMA_TEMPLATES = [
  {
    id: 'article',
    label: 'Thought leadership article',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Inside the Gigvora executive growth engine',
      datePublished: new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: 'Nadia Shepard',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Gigvora',
        logo: {
          '@type': 'ImageObject',
          url: 'https://cdn.gigvora.com/brand/logomark.png',
        },
      },
      image: 'https://cdn.gigvora.com/content/exec-growth.jpg',
      description:
        'Gigvora unlocks executive-calibre mentorship, curated opportunities, and concierge support for ambitious teams.',
    },
  },
  {
    id: 'event',
    label: 'Executive summit event',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Gigvora Enterprise Growth Summit',
      startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 31).toISOString(),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: 'Gigvora HQ & Virtual Campus',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '850 Market Street',
          addressLocality: 'San Francisco',
          addressRegion: 'CA',
          postalCode: '94102',
          addressCountry: 'US',
        },
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://gigvora.com/events/enterprise-growth-summit',
      },
    },
  },
  {
    id: 'product',
    label: 'Gig service productised offer',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Gigvora Concierge Growth Pod',
      description: 'Dedicated squad blending strategists, mentors, and analysts for rapid scale-ups.',
      image: 'https://cdn.gigvora.com/products/concierge-pod.jpg',
      brand: {
        '@type': 'Brand',
        name: 'Gigvora',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: '4999',
        availability: 'https://schema.org/PreOrder',
        url: 'https://gigvora.com/pods/concierge',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: 128,
      },
    },
  },
];

function formatJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return '';
  }
}

function parseSchema(text) {
  try {
    const parsed = JSON.parse(text);
    return { data: parsed, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

function getEntityCards(schema) {
  if (!schema || typeof schema !== 'object') {
    return [];
  }
  if (Array.isArray(schema)) {
    return schema.flatMap((item) => getEntityCards(item));
  }
  const root = schema['@graph'] ? schema['@graph'] : [schema];
  const entities = Array.isArray(root) ? root : [root];
  return entities.map((entity, index) => ({
    id: entity['@id'] ?? `${entity['@type'] ?? 'Entity'}-${index}`,
    type: entity['@type'] ?? 'Thing',
    headline: entity.name || entity.headline || entity.title || 'Untitled entity',
    description:
      entity.description ||
      entity.abstract ||
      entity.tagline ||
      'Add a compelling description to help searchers understand your proposition.',
    highlights: [
      entity.url && `URL: ${entity.url}`,
      entity.startDate && `Starts: ${new Date(entity.startDate).toLocaleString()}`,
      entity.offers?.price && `Price: ${entity.offers.price} ${entity.offers.priceCurrency ?? ''}`,
      entity.aggregateRating?.ratingValue && `Rating: ${entity.aggregateRating.ratingValue}`,
      entity.author?.name && `Author: ${entity.author.name}`,
    ].filter(Boolean),
  }));
}

function validateSchema(schema) {
  const messages = [];
  if (!schema) {
    messages.push({ level: 'error', message: 'Schema is empty. Paste JSON-LD or load a template to begin.' });
    return messages;
  }
  const entities = getEntityCards(schema);
  if (!entities.length) {
    messages.push({ level: 'error', message: 'No entities detected. Ensure @graph or @type is present.' });
  }
  entities.forEach((entity) => {
    if (!entity.description || entity.description.includes('Add a compelling')) {
      messages.push({
        level: 'warning',
        message: `${entity.type}: Provide a human-readable description to maximise discoverability.`,
      });
    }
  });
  if (!schema['@context']) {
    messages.push({ level: 'error', message: 'Missing @context. Most search engines require https://schema.org context.' });
  }
  if (schema['@type'] === 'Event' && !schema.location) {
    messages.push({ level: 'error', message: 'Events require a location or virtual location definition.' });
  }
  if (schema['@type'] === 'Product' && !schema.offers) {
    messages.push({ level: 'warning', message: 'Add an offers block so pricing appears in search listings.' });
  }
  if (schema['@graph'] && !Array.isArray(schema['@graph'])) {
    messages.push({ level: 'warning', message: '@graph should be an array to list multiple entities.' });
  }
  return messages;
}

function buildRecommendations(schema) {
  if (!schema) {
    return ['Load a template to jumpstart your schema design.'];
  }
  const recommendations = [];
  if (schema['@type'] === 'Organization' && !schema.contactPoint) {
    recommendations.push('Add contactPoint data to surface support and sales channels.');
  }
  if (schema.sameAs && schema.sameAs.length < 3) {
    recommendations.push('Link more authoritative profiles under sameAs to strengthen credibility.');
  }
  if (!schema.description && !schema.tagline) {
    recommendations.push('Provide a succinct description so the knowledge panel feels complete.');
  }
  if (schema['@type'] === 'Article' && !schema.articleSection) {
    recommendations.push('Include articleSection and keywords to align with topical authority clusters.');
  }
  if (!recommendations.length) {
    recommendations.push("Schema looks strong. Submit to Search Console's Rich Results Test to validate externally.");
  }
  return recommendations;
}

export default function SchemaPreviewer({ schema, onSchemaChange }) {
  const [rawSchema, setRawSchema] = useState(() => formatJson(schema ?? DEFAULT_SCHEMA));
  const [activeTemplate, setActiveTemplate] = useState(null);

  useEffect(() => {
    setRawSchema(formatJson(schema ?? DEFAULT_SCHEMA));
  }, [schema]);

  const { data: parsedSchema, error } = useMemo(() => parseSchema(rawSchema), [rawSchema]);
  const cards = useMemo(() => getEntityCards(parsedSchema), [parsedSchema]);
  const validation = useMemo(() => validateSchema(parsedSchema), [parsedSchema]);
  const recommendations = useMemo(() => buildRecommendations(parsedSchema), [parsedSchema]);

  const handleTemplateSelect = (template) => {
    setActiveTemplate(template.id);
    const formatted = formatJson(template.schema);
    setRawSchema(formatted);
    onSchemaChange?.(template.schema);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawSchema);
    } catch (clipboardError) {
      // Ignore clipboard failure in unsupported environments
    }
  };

  const handleTextareaChange = (event) => {
    const next = event.target.value;
    setRawSchema(next);
    const { data } = parseSchema(next);
    if (data) {
      onSchemaChange?.(data);
    }
  };

  return (
    <section className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Schema Intelligence</p>
            <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">Design rich results with confidence</h2>
            <p className="max-w-2xl text-sm text-white/80">
              Preview and validate JSON-LD instantly. Multi-entity support keeps Gigvora experiences polished across knowledge
              panels, events, and product listings.
            </p>
          </div>
          <div className="flex min-w-[220px] flex-col gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <span className="text-xs uppercase tracking-wide text-white/70">Entities detected</span>
            <p className="text-4xl font-semibold leading-none">{cards.length}</p>
            <p className="text-xs text-white/70">{parsedSchema?.['@type'] ?? 'Multiple types'} • Real-time validation</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.22)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Schema editor</h3>
                <p className="text-sm text-slate-500">Load a template or paste JSON-LD. Errors surface instantly as you type.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {SCHEMA_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                      activeTemplate === template.id
                        ? 'bg-slate-900 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {error && (
                <div className="flex items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                  <ExclamationCircleIcon className="mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-semibold">JSON parsing error</p>
                    <p className="mt-1 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>JSON-LD</span>
                <span>{rawSchema.length.toLocaleString()} characters</span>
              </div>
              <textarea
                className="h-[420px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 font-mono text-xs text-slate-800 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                value={rawSchema}
                onChange={handleTextareaChange}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="inline-flex items-center gap-2">
                  <CodeBracketIcon className="h-4 w-4 text-indigo-500" />
                  Press Cmd/Ctrl + Enter to trigger external validation.
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                  Copy schema
                </button>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.22)]">
            <h3 className="text-lg font-semibold text-slate-900">Recommendations</h3>
            <p className="mt-1 text-sm text-slate-500">Prioritise these enhancements to secure rich result eligibility.</p>
            <ul className="mt-4 space-y-3">
              {recommendations.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">
                  <SparklesIcon className="mt-0.5 h-5 w-5 text-indigo-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          {validation.length > 0 && (
            <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.22)]">
              <h3 className="text-lg font-semibold text-slate-900">Validation feed</h3>
              <p className="mt-1 text-sm text-slate-500">Resolve these flags before pushing schema to production.</p>
              <ul className="mt-4 space-y-3">
                {validation.map((item, index) => (
                  <li key={`${item.message}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4 text-sm text-slate-700">
                    {item.level === 'error' ? (
                      <ExclamationCircleIcon className="mt-0.5 h-5 w-5 text-rose-500" />
                    ) : (
                      <InformationCircleIcon className="mt-0.5 h-5 w-5 text-amber-500" />
                    )}
                    <span>{item.message}</span>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>

        <aside className="space-y-8">
          <article className="rounded-3xl border border-slate-200/60 bg-slate-900 p-6 text-white shadow-[0_40px_80px_-34px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/50">
              <span>Rich result cards</span>
              <span>Preview</span>
            </div>
            <div className="mt-6 space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
                    <span>{card.type}</span>
                    <Squares2X2Icon className="h-4 w-4 text-indigo-300" />
                  </div>
                  <h4 className="mt-2 text-lg font-semibold text-white">{card.headline}</h4>
                  <p className="mt-2 text-sm text-white/70">{card.description}</p>
                  <ul className="mt-3 space-y-1 text-xs text-white/60">
                    {card.highlights.map((highlight, index) => (
                      <li key={`${card.id}-${index}`} className="flex items-center gap-2">
                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {cards.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/20 p-5 text-sm text-white/60">
                  Load or craft schema to visualise rich result previews instantly.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.22)]">
            <h3 className="text-lg font-semibold text-slate-900">Governance checklist</h3>
            <p className="mt-1 text-sm text-slate-500">Embed schema QA into every launch rhythm.</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                <CheckCircleIcon className="mt-1 h-5 w-5 text-indigo-500" />
                <span>Schedule automated validation runs in staging and production nightly.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                <CheckCircleIcon className="mt-1 h-5 w-5 text-indigo-500" />
                <span>Log schema versioning in Git with PR templates referencing Search Console tickets.</span>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
                <CheckCircleIcon className="mt-1 h-5 w-5 text-indigo-500" />
                <span>Pair schema updates with content, design, and analytics stakeholders for holistic launches.</span>
              </li>
            </ul>
          </article>
        </aside>
      </div>
    </section>
  );
}

SchemaPreviewer.propTypes = {
  schema: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onSchemaChange: PropTypes.func,
};

SchemaPreviewer.defaultProps = {
  schema: DEFAULT_SCHEMA,
  onSchemaChange: undefined,
};
