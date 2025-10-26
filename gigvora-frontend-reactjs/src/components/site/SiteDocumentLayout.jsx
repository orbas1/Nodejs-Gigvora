import { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../PageHeader.jsx';
import { scrollToElement, announcePolite } from '../../utils/accessibility.js';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatches(text, query) {
  if (!query) {
    return text;
  }
  const pattern = new RegExp(escapeRegExp(query), 'gi');
  const parts = text.split(pattern);
  const matches = text.match(pattern);
  if (!matches) {
    return text;
  }
  const fragments = [];
  parts.forEach((part, index) => {
    fragments.push(<span key={`text-${index}`}>{part}</span>);
    if (matches[index]) {
      fragments.push(
        <mark key={`match-${index}`} className="rounded bg-accent/20 px-0.5 text-accent">
          {matches[index]}
        </mark>,
      );
    }
  });
  return fragments;
}

function formatDate(date) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date instanceof Date ? date : new Date(date));
  } catch (error) {
    return '';
  }
}

function blocksToPlainText(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === 'list') {
        return block.items.map((item) => `- ${item}`).join('\n');
      }
      return block.text || '';
    })
    .join('\n\n');
}

function buildDownloadPayload(title, sections = []) {
  const header = `# ${title}\n`;
  const content = sections
    .map((section) => `\n## ${section.title}\n\n${blocksToPlainText(section.blocks)}`)
    .join('\n');
  return `${header}${content}`.trim();
}

function downloadDocument({ title, sections, fileName }) {
  if (typeof window === 'undefined') {
    return;
  }
  const payload = buildDownloadPayload(title, sections);
  const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || `${title.replace(/\s+/g, '-').toLowerCase()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function renderBlock(block, query) {
  if (block.type === 'list') {
    return (
      <ul className="ml-5 list-disc space-y-2 text-sm leading-6 text-slate-700">
        {block.items.map((item, index) => (
          <li key={index}>{highlightMatches(item, query)}</li>
        ))}
      </ul>
    );
  }
  return <p className="text-sm leading-7 text-slate-700">{highlightMatches(block.text ?? '', query)}</p>;
}

export default function SiteDocumentLayout({
  hero,
  sections = [],
  metadata,
  loading,
  error,
  onRetry,
  usingFallback,
  refresh,
}) {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState({ rating: '', message: '' });
  const [feedbackStatus, setFeedbackStatus] = useState({ type: 'idle', message: '' });
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? null);
  const [shareStatus, setShareStatus] = useState({ type: 'idle', message: '' });
  const [resultsAnnouncement, setResultsAnnouncement] = useState('');
  const shareFeedbackTimeout = useRef(null);
  const shareFeedbackId = useId();
  const feedbackStatusId = useId();
  const resultsLiveRegionId = useId();
  const filteredSections = useMemo(() => {
    if (!query.trim()) {
      return sections;
    }
    const term = query.trim().toLowerCase();
    return sections.filter((section) => {
      const inTitle = section.title.toLowerCase().includes(term);
      const inContent = section.blocks.some((block) => {
        if (block.type === 'list') {
          return block.items.some((item) => item.toLowerCase().includes(term));
        }
        return (block.text ?? '').toLowerCase().includes(term);
      });
      return inTitle || inContent;
    });
  }, [query, sections]);

  useEffect(() => {
    if (!sections.length) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      },
    );
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });
    return () => {
      observer.disconnect();
    };
  }, [sections]);

  useEffect(() => {
    if (sections.length && !sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0]?.id ?? null);
    }
  }, [activeSectionId, sections]);

  useEffect(() => {
    if (!sections.length) {
      setResultsAnnouncement('This document has no sections yet.');
      return;
    }
    if (!query.trim()) {
      const total = sections.length;
      setResultsAnnouncement(`Showing all ${total} ${total === 1 ? 'section' : 'sections'}.`);
      return;
    }
    const matches = filteredSections.length;
    setResultsAnnouncement(
      `${matches} ${matches === 1 ? 'section' : 'sections'} matching “${query.trim()}”.`,
    );
  }, [filteredSections.length, query, sections.length]);

  useEffect(() => {
    if (resultsAnnouncement) {
      announcePolite(resultsAnnouncement);
    }
  }, [resultsAnnouncement]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!shareStatus.message) {
      return undefined;
    }
    if (shareFeedbackTimeout.current) {
      window.clearTimeout(shareFeedbackTimeout.current);
    }
    shareFeedbackTimeout.current = window.setTimeout(() => {
      setShareStatus({ type: 'idle', message: '' });
    }, 4000);

    return () => {
      if (shareFeedbackTimeout.current) {
        window.clearTimeout(shareFeedbackTimeout.current);
      }
    };
  }, [shareStatus.message]);

  useEffect(() => {
    if (shareStatus.message) {
      announcePolite(shareStatus.message);
    }
  }, [shareStatus.message]);

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus({ type: 'success', message: 'Link copied to clipboard.' });
    } catch (clipboardError) {
      console.warn('Unable to copy link', clipboardError);
      setShareStatus({
        type: 'error',
        message: 'Unable to copy link automatically. Use your browser share controls instead.',
      });
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleSubmitFeedback = (event) => {
    event.preventDefault();
    if (!feedback.rating) {
      setFeedbackStatus({ type: 'error', message: 'Select a response before submitting your feedback.' });
      return;
    }
    setFeedbackStatus({
      type: 'success',
      message: 'Thank you for your feedback. Our legal and support teams review submissions within two UK business days.',
    });
  };

  const metadataItems = useMemo(() => {
    const items = [];
    if (metadata?.lastUpdated) {
      items.push({ label: 'Last updated', value: formatDate(metadata.lastUpdated) });
    }
    if (metadata?.lastReviewed) {
      items.push({ label: 'Last reviewed', value: formatDate(metadata.lastReviewed) });
    }
    if (metadata?.publishedAt) {
      items.push({ label: 'Published', value: formatDate(metadata.publishedAt) });
    }
    if (metadata?.version) {
      items.push({ label: 'Version', value: metadata.version });
    }
    if (metadata?.jurisdiction) {
      items.push({ label: 'Jurisdiction', value: metadata.jurisdiction });
    }
    if (metadata?.documentCode) {
      items.push({ label: 'Document code', value: metadata.documentCode });
    }
    if (metadata?.contactEmail) {
      items.push({ label: 'Email', value: metadata.contactEmail, href: `mailto:${metadata.contactEmail}` });
    }
    if (metadata?.contactPhone) {
      const tel = metadata.contactPhone.replace(/\s+/g, '');
      items.push({ label: 'Phone', value: metadata.contactPhone, href: `tel:${tel}` });
    }
    if (usingFallback) {
      items.push({ label: 'Offline copy', value: 'Showing cached legal text' });
    }
    return items;
  }, [metadata, usingFallback]);

  const headerActions = useMemo(() => {
    const actions = [
      <button
        key="download"
        type="button"
        onClick={() => downloadDocument({ title: hero?.title, sections, fileName: `${metadata?.documentCode}.txt` })}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentDark"
        aria-label={`Download a copy of ${hero?.title ?? 'this document'}`}
      >
        <ArrowDownTrayIcon className="h-4 w-4" /> Download copy
      </button>,
      <button
        key="print"
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <PrinterIcon className="h-4 w-4" /> Print
      </button>,
      <button
        key="share"
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-describedby={shareStatus.message ? shareFeedbackId : undefined}
      >
        <ShareIcon className="h-4 w-4" /> Copy link
      </button>,
      <span key="share-feedback" id={shareFeedbackId} role="status" aria-live="polite" className="sr-only">
        {shareStatus.message}
      </span>,
    ];
    if (hero?.ctaLabel && hero?.ctaUrl) {
      actions.unshift(
        <a
          key="primary-cta"
          href={hero.ctaUrl}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
          target={hero.ctaUrl.startsWith('http') ? '_blank' : undefined}
          rel={hero.ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          <CheckCircleIcon className="h-4 w-4" /> {hero.ctaLabel}
        </a>,
      );
    }
    return actions;
  }, [handlePrint, handleShare, hero?.ctaLabel, hero?.ctaUrl, hero?.title, metadata?.documentCode, sections, shareStatus.message]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white/70 p-10 shadow-soft">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-8 w-3/5 animate-pulse rounded-full bg-slate-200" />
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !sections.length) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="space-y-4 rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700">
          <InformationCircleIcon className="mx-auto h-10 w-10" />
          <p className="text-lg font-semibold">We could not load this document.</p>
          <p className="text-sm">
            {error?.message || 'Please refresh the page or contact support@gigvora.com.'}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
            >
              <ArrowPathIcon className="h-4 w-4" /> Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row">
        <aside className="order-2 w-full lg:order-1 lg:w-72 lg:flex-shrink-0">
          <div className="sticky top-28 space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft">
            <div>
              <label htmlFor="document-search" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Search document
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                <input
                  id="document-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter sections"
                  aria-describedby={resultsLiveRegionId}
                  className="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contents</p>
              <nav className="mt-3 space-y-2 text-sm" aria-label="Document sections">
                {sections.map((section) => {
                  const isActive = section.id === activeSectionId;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        const element = document.getElementById(section.id);
                        if (element) {
                          scrollToElement(element, { focus: true });
                        }
                        setActiveSectionId(section.id);
                      }}
                      className={classNames(
                        'block w-full rounded-2xl border px-3 py-2 text-left transition',
                        isActive
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-transparent text-slate-600 hover:border-accent/40 hover:bg-accent/5 hover:text-accent',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      )}
                      aria-controls={section.id}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="block font-semibold">{section.title}</span>
                      {section.summary ? (
                        <span className="mt-1 block text-xs text-slate-500">{section.summary}</span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
              <p id={resultsLiveRegionId} role="status" aria-live="polite" className="sr-only">
                {resultsAnnouncement}
              </p>
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              {metadataItems.map((item) => (
                <div key={item.label} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
                  {item.href ? (
                    <a href={item.href} className="text-slate-700 underline-offset-2 hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    <span className="text-slate-700">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="order-1 flex-1 space-y-10 lg:order-2">
          <PageHeader
            eyebrow={hero?.eyebrow}
            title={hero?.title}
            description={hero?.description || metadata?.heroSubtitle}
            meta={hero?.meta || metadata?.summary}
            actions={headerActions}
          />

          {error ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
              <p className="font-semibold">We could not load the latest revision.</p>
              <p className="mt-2">Showing the cached fallback until the network recovers.</p>
              <button
                type="button"
                onClick={refresh}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-400"
              >
                <ArrowPathIcon className="h-4 w-4" /> Retry fetch
              </button>
            </div>
          ) : null}

          <article className="space-y-10 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-soft">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-600">
                No sections match “{query}”. Try a different keyword or clear the filter.
              </div>
            ) : (
              filteredSections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4" tabIndex={-1}>
                  <div className="flex items-center gap-3">
                    <ClipboardDocumentCheckIcon className="h-6 w-6 text-accent" />
                    <h2 className="text-2xl font-semibold text-slate-900">{section.title}</h2>
                  </div>
                  <div className="space-y-4">
                    {section.blocks.map((block, index) => (
                      <div key={`${section.id}-${index}`}>{renderBlock(block, query)}</div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </article>

          <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-soft lg:grid-cols-2">
            <form
              onSubmit={handleSubmitFeedback}
              className="space-y-4"
              aria-describedby={feedbackStatus.message ? feedbackStatusId : undefined}
            >
              <fieldset className="space-y-4">
                <legend className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                  Was this page helpful?
                </legend>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Yes, it answered my question', value: 'yes' },
                    { label: 'Partially helpful', value: 'partially' },
                    { label: 'No, I still need help', value: 'no' },
                  ].map(({ label, value }) => {
                    const isActive = feedback.rating === value;
                    return (
                      <label
                        key={value}
                        className={classNames(
                          'cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-500',
                          isActive
                            ? 'bg-emerald-500 text-white shadow'
                            : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-600',
                        )}
                      >
                        <input
                          type="radio"
                          name="document-feedback-rating"
                          value={value}
                          checked={isActive}
                          onChange={() => {
                            setFeedback((prev) => ({ ...prev, rating: value }));
                            if (feedbackStatus.type !== 'idle') {
                              setFeedbackStatus({ type: 'idle', message: '' });
                            }
                          }}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <label className="block text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Share optional feedback</span>
                <textarea
                  rows={3}
                  value={feedback.message}
                  onChange={(event) => {
                    setFeedback((prev) => ({ ...prev, message: event.target.value }));
                    if (feedbackStatus.type === 'error') {
                      setFeedbackStatus({ type: 'idle', message: '' });
                    }
                  }}
                  placeholder="Let us know what you were looking for."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                Submit feedback
              </button>
              <p
                id={feedbackStatusId}
                role="status"
                aria-live="polite"
                className={classNames(
                  'text-xs',
                  feedbackStatus.type === 'success'
                    ? 'text-emerald-600'
                    : feedbackStatus.type === 'error'
                      ? 'text-rose-600'
                      : 'text-slate-500',
                )}
              >
                {feedbackStatus.message}
              </p>
            </form>
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-700">
              <h3 className="text-lg font-semibold text-slate-900">Need tailored guidance?</h3>
              <p>
                Email <a href="mailto:legal@gigvora.com" className="font-semibold text-accent transition hover:text-accentDark">legal@gigvora.com</a>{' '}
                for contract assistance or <a href="tel:+442038079410" className="font-semibold text-accent transition hover:text-accentDark">+44 203 807 9410</a> for urgent matters.
              </p>
              <p className="text-xs text-slate-500">Office hours: 9:00–17:30 UK time, Monday to Friday.</p>
              <a
                href="mailto:legal@gigvora.com?subject=Gigvora%20policy%20support"
                className="inline-flex items-center justify-center rounded-full border border-accent bg-accent/10 px-5 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
              >
                Contact legal support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

SiteDocumentLayout.propTypes = {
  hero: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    meta: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    ctaLabel: PropTypes.string,
    ctaUrl: PropTypes.string,
  }),
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string,
      blocks: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.oneOf(['text', 'list']),
          text: PropTypes.string,
          items: PropTypes.arrayOf(PropTypes.string),
        })
      ),
    })
  ),
  metadata: PropTypes.shape({
    documentCode: PropTypes.string,
    summary: PropTypes.string,
    heroSubtitle: PropTypes.string,
    lastUpdated: PropTypes.string,
    lastReviewed: PropTypes.string,
    publishedAt: PropTypes.string,
    version: PropTypes.string,
    jurisdiction: PropTypes.string,
    contactEmail: PropTypes.string,
    contactPhone: PropTypes.string,
  }),
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  onRetry: PropTypes.func,
  usingFallback: PropTypes.bool,
  refresh: PropTypes.func,
};

SiteDocumentLayout.defaultProps = {
  hero: null,
  sections: [],
  metadata: null,
  loading: false,
  error: null,
  onRetry: undefined,
  usingFallback: false,
  refresh: undefined,
};
