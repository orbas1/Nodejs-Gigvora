import { useEffect, useMemo, useState } from 'react';
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
  const [feedback, setFeedback] = useState({ rating: '', message: '', submitted: false });
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? null);
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

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch (clipboardError) {
      console.warn('Unable to copy link', clipboardError);
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
      return;
    }
    setFeedback((prev) => ({ ...prev, submitted: true }));
  };

  const metadataItems = useMemo(() => {
    const items = [];
    if (metadata?.lastUpdated) {
      items.push({ label: 'Last updated', value: formatDate(metadata.lastUpdated) });
    }
    if (metadata?.version) {
      items.push({ label: 'Version', value: metadata.version });
    }
    if (metadata?.jurisdiction) {
      items.push({ label: 'Jurisdiction', value: metadata.jurisdiction });
    }
    if (usingFallback) {
      items.push({ label: 'Offline copy', value: 'Showing cached legal text' });
    }
    return items;
  }, [metadata, usingFallback]);

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
                  className="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contents</p>
              <nav className="mt-3 space-y-2 text-sm">
                {sections.map((section) => {
                  const isActive = section.id === activeSectionId;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        const element = document.getElementById(section.id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        setActiveSectionId(section.id);
                      }}
                      className={classNames(
                        'block w-full rounded-2xl border px-3 py-2 text-left transition',
                        isActive
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-transparent text-slate-600 hover:border-accent/40 hover:bg-accent/5 hover:text-accent',
                      )}
                    >
                      {section.title}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              {metadataItems.map((item) => (
                <div key={item.label} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
                  <span className="text-slate-700">{item.value}</span>
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
            actions={[
              <button
                key="download"
                type="button"
                onClick={() => downloadDocument({ title: hero?.title, sections, fileName: `${metadata?.documentCode}.txt` })}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark"
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Download copy
              </button>,
              <button
                key="print"
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                <PrinterIcon className="h-4 w-4" /> Print
              </button>,
              <button
                key="share"
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                <ShareIcon className="h-4 w-4" /> Copy link
              </button>,
            ]}
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
                <section key={section.id} id={section.id} className="scroll-mt-28 space-y-4">
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
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                Was this page helpful?
              </div>
              <div className="flex flex-wrap gap-2">
                {['Yes, it answered my question', 'Partially helpful', 'No, I still need help'].map((label) => {
                  const value = label.split(' ')[0].toLowerCase();
                  const isActive = feedback.rating === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedback((prev) => ({ ...prev, rating: value }))}
                      className={classNames(
                        'rounded-full px-4 py-2 text-sm font-semibold transition',
                        isActive
                          ? 'bg-emerald-500 text-white shadow'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-600',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <label className="block text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Share optional feedback</span>
                <textarea
                  rows={3}
                  value={feedback.message}
                  onChange={(event) => setFeedback((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Let us know what you were looking for."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
              >
                Submit feedback
              </button>
              {feedback.submitted ? (
                <p className="text-xs text-emerald-600">Thank you. We review feedback within two UK business days.</p>
              ) : null}
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
