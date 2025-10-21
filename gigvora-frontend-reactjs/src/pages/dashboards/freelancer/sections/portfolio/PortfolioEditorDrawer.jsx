import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowUturnLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const STEPS = [
  { id: 'cover', label: 'Cover' },
  { id: 'story', label: 'Story' },
  { id: 'links', label: 'Links' },
  { id: 'publish', label: 'Publish' },
];

function toInputDate(value) {
  if (!value) {
    return '';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  } catch (error) {
    return '';
  }
}

function parseList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const DEFAULT_FORM = Object.freeze({
  title: '',
  tagline: '',
  clientName: '',
  clientIndustry: '',
  role: '',
  summary: '',
  problemStatement: '',
  approachSummary: '',
  outcomeSummary: '',
  tags: '',
  industries: '',
  services: '',
  technologies: '',
  callToActionLabel: '',
  callToActionUrl: '',
  repositoryUrl: '',
  liveUrl: '',
  heroImageUrl: '',
  heroVideoUrl: '',
  visibility: 'public',
  status: 'draft',
  isFeatured: false,
  featuredOrder: '',
  startDate: '',
  endDate: '',
});

const DEFAULT_METRICS = Object.freeze([
  { id: 'metric-1', label: '', value: '', tone: 'positive' },
]);

function isValidUrl(value) {
  if (!value) {
    return true;
  }
  try {
    const url = new URL(value, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

export default function PortfolioEditorDrawer({ open, mode = 'create', item, canEdit, onClose, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (open) {
      setStep(0);
      if (item) {
        setForm({
          title: item.title ?? '',
          tagline: item.tagline ?? '',
          clientName: item.clientName ?? '',
          clientIndustry: item.clientIndustry ?? '',
          role: item.role ?? '',
          summary: item.summary ?? '',
          problemStatement: item.problemStatement ?? '',
          approachSummary: item.approachSummary ?? '',
          outcomeSummary: item.outcomeSummary ?? '',
          tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
          industries: Array.isArray(item.industries) ? item.industries.join(', ') : '',
          services: Array.isArray(item.services) ? item.services.join(', ') : '',
          technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : '',
          callToActionLabel: item.callToActionLabel ?? '',
          callToActionUrl: item.callToActionUrl ?? '',
          repositoryUrl: item.repositoryUrl ?? '',
          liveUrl: item.liveUrl ?? '',
          heroImageUrl: item.heroImageUrl ?? '',
          heroVideoUrl: item.heroVideoUrl ?? '',
          visibility: item.visibility ?? 'public',
          status: item.status ?? 'draft',
          isFeatured: Boolean(item.isFeatured),
          featuredOrder: item.featuredOrder ? String(item.featuredOrder) : '',
          startDate: toInputDate(item.startDate),
          endDate: toInputDate(item.endDate),
        });
        const existingMetrics = Array.isArray(item.impactMetrics)
          ? item.impactMetrics.map((metric, index) => ({
              id: `metric-${index + 1}`,
              label: metric.label ?? '',
              value: metric.value ?? '',
              tone: metric.tone ?? 'positive',
            }))
          : [];
        setMetrics(existingMetrics.length ? existingMetrics : DEFAULT_METRICS);
      } else {
        setForm(DEFAULT_FORM);
        setMetrics(DEFAULT_METRICS);
      }
      setSubmitting(false);
      setError(null);
    } else {
      setForm(DEFAULT_FORM);
      setMetrics(DEFAULT_METRICS);
      setStep(0);
      setSubmitting(false);
      setError(null);
    }
  }, [open, item]);

  const canSubmit = useMemo(() => Boolean(form.title?.trim()), [form.title]);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMetricChange = (metricId, key, value) => {
    setMetrics((previous) =>
      previous.map((metric) => (metric.id === metricId ? { ...metric, [key]: value } : metric)),
    );
  };

  const handleAddMetric = () => {
    setMetrics((previous) => [
      ...previous,
      { id: `metric-${previous.length + 1}`, label: '', value: '', tone: 'positive' },
    ]);
  };

  const handleRemoveMetric = (metricId) => {
    setMetrics((previous) => (previous.length > 1 ? previous.filter((metric) => metric.id !== metricId) : previous));
  };

  const moveToStep = (resolver) => {
    setStep((current) => {
      const resolvedIndex = typeof resolver === 'function' ? resolver(current) : resolver;
      const nextIndex = Math.min(Math.max(resolvedIndex, 0), STEPS.length - 1);
      if (nextIndex !== current) {
        setError(null);
      }
      return nextIndex;
    });
  };

  const handleNext = () => {
    moveToStep((current) => current + 1);
  };

  const handlePrevious = () => {
    moveToStep((current) => current - 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canEdit || !canSubmit) {
      return;
    }
    if (form.callToActionUrl && !isValidUrl(form.callToActionUrl)) {
      setError('Call to action URL must be a valid HTTP(S) link.');
      return;
    }
    if (form.repositoryUrl && !isValidUrl(form.repositoryUrl)) {
      setError('Repository URL must be a valid HTTP(S) link.');
      return;
    }
    if (form.liveUrl && !isValidUrl(form.liveUrl)) {
      setError('Live URL must be a valid HTTP(S) link.');
      return;
    }
    if (form.heroImageUrl && !isValidUrl(form.heroImageUrl)) {
      setError('Hero image URL must be a valid HTTP(S) link.');
      return;
    }
    if (form.heroVideoUrl && !isValidUrl(form.heroVideoUrl)) {
      setError('Hero video URL must be a valid HTTP(S) link.');
      return;
    }
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      setError('End date must be after the start date.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        tagline: form.tagline?.trim() || null,
        clientName: form.clientName?.trim() || null,
        clientIndustry: form.clientIndustry?.trim() || null,
        role: form.role?.trim() || null,
        summary: form.summary?.trim() || null,
        problemStatement: form.problemStatement?.trim() || null,
        approachSummary: form.approachSummary?.trim() || null,
        outcomeSummary: form.outcomeSummary?.trim() || null,
        tags: parseList(form.tags),
        industries: parseList(form.industries),
        services: parseList(form.services),
        technologies: parseList(form.technologies),
        callToActionLabel: form.callToActionLabel?.trim() || null,
        callToActionUrl: form.callToActionUrl?.trim() || null,
        repositoryUrl: form.repositoryUrl?.trim() || null,
        liveUrl: form.liveUrl?.trim() || null,
        heroImageUrl: form.heroImageUrl?.trim() || null,
        heroVideoUrl: form.heroVideoUrl?.trim() || null,
        visibility: form.visibility,
        status: form.status,
        isFeatured: Boolean(form.isFeatured),
        featuredOrder: form.featuredOrder ? Number(form.featuredOrder) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        impactMetrics: metrics
          .filter((metric) => metric.label?.trim() && metric.value?.trim())
          .map((metric) => ({
            label: metric.label.trim(),
            value: metric.value.trim(),
            tone: metric.tone ?? 'positive',
          })),
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Unable to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    const current = STEPS[step]?.id;
    if (current === 'cover') {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-title">
                Title<span className="text-rose-500">*</span>
              </label>
              <input
                id="portfolio-title"
                name="title"
                type="text"
                required
                value={form.title}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-tagline">
                Tagline
              </label>
              <input
                id="portfolio-tagline"
                name="tagline"
                type="text"
                value={form.tagline}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-client">
                Client
              </label>
              <input
                id="portfolio-client"
                name="clientName"
                type="text"
                value={form.clientName}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-industry">
                Industry
              </label>
              <input
                id="portfolio-industry"
                name="clientIndustry"
                type="text"
                value={form.clientIndustry}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-role">
                Role
              </label>
              <input
                id="portfolio-role"
                name="role"
                type="text"
                value={form.role}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-hero-image">
                Hero image URL
              </label>
              <input
                id="portfolio-hero-image"
                name="heroImageUrl"
                type="url"
                value={form.heroImageUrl}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-hero-video">
                Hero video URL
              </label>
              <input
                id="portfolio-hero-video"
                name="heroVideoUrl"
                type="url"
                value={form.heroVideoUrl}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      );
    }

    if (current === 'story') {
      return (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-summary">
              Summary
            </label>
            <textarea
              id="portfolio-summary"
              name="summary"
              rows={3}
              value={form.summary}
              onChange={handleFormChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-problem">
                Problem
              </label>
              <textarea
                id="portfolio-problem"
                name="problemStatement"
                rows={4}
                value={form.problemStatement}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-approach">
                Approach
              </label>
              <textarea
                id="portfolio-approach"
                name="approachSummary"
                rows={4}
                value={form.approachSummary}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-outcome">
                Outcome
              </label>
              <textarea
                id="portfolio-outcome"
                name="outcomeSummary"
                rows={4}
                value={form.outcomeSummary}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Metrics</p>
              <button
                type="button"
                onClick={handleAddMetric}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
              >
                <PlusIcon className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="space-y-3">
              {metrics.map((metric) => (
                <div key={metric.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <label className="text-xs font-semibold text-slate-600" htmlFor={`${metric.id}-label`}>
                      Label
                    </label>
                    <input
                      id={`${metric.id}-label`}
                      type="text"
                      value={metric.label}
                      onChange={(event) => handleMetricChange(metric.id, 'label', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600" htmlFor={`${metric.id}-value`}>
                      Value
                    </label>
                    <input
                      id={`${metric.id}-value`}
                      type="text"
                      value={metric.value}
                      onChange={(event) => handleMetricChange(metric.id, 'value', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <select
                      value={metric.tone}
                      onChange={(event) => handleMetricChange(metric.id, 'tone', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveMetric(metric.id)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (current === 'links') {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-cta-label">
                Call to action label
              </label>
              <input
                id="portfolio-cta-label"
                name="callToActionLabel"
                type="text"
                value={form.callToActionLabel}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-cta-url">
                Call to action URL
              </label>
              <input
                id="portfolio-cta-url"
                name="callToActionUrl"
                type="url"
                value={form.callToActionUrl}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-repository">
                Repository URL
              </label>
              <input
                id="portfolio-repository"
                name="repositoryUrl"
                type="url"
                value={form.repositoryUrl}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-live-url">
                Live URL
              </label>
              <input
                id="portfolio-live-url"
                name="liveUrl"
                type="url"
                value={form.liveUrl}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-tags">
                Tags
              </label>
              <input
                id="portfolio-tags"
                name="tags"
                type="text"
                value={form.tags}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-industries">
                Industries
              </label>
              <input
                id="portfolio-industries"
                name="industries"
                type="text"
                value={form.industries}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-services">
                Services
              </label>
              <input
                id="portfolio-services"
                name="services"
                type="text"
                value={form.services}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-technologies">
                Technologies
              </label>
              <input
                id="portfolio-technologies"
                name="technologies"
                type="text"
                value={form.technologies}
                onChange={handleFormChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-status">
              Status
            </label>
            <select
              id="portfolio-status"
              name="status"
              value={form.status}
              onChange={handleFormChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-visibility">
              Visibility
            </label>
            <select
              id="portfolio-visibility"
              name="visibility"
              value={form.visibility}
              onChange={handleFormChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="network">Network</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-featured-order">
              Feature order
            </label>
            <input
              id="portfolio-featured-order"
              name="featuredOrder"
              type="number"
              value={form.featuredOrder}
              onChange={handleFormChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 pt-8">
            <input
              id="portfolio-featured"
              name="isFeatured"
              type="checkbox"
              checked={Boolean(form.isFeatured)}
              onChange={handleFormChange}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-featured">
              Mark as featured
            </label>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-start-date">
              Start date
            </label>
            <input
              id="portfolio-start-date"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleFormChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="portfolio-end-date">
              End date
            </label>
            <input
              id="portfolio-end-date"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleFormChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-5xl">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        {isEditMode ? 'Edit case' : 'New case'}
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" /> Close
                      </button>
                    </div>

                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
                      <nav className="flex flex-wrap gap-2">
                        {STEPS.map((stepItem, index) => (
                          <button
                            key={stepItem.id}
                            type="button"
                            onClick={() => moveToStep(index)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                              step === index
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {stepItem.label}
                          </button>
                        ))}
                      </nav>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      <div className="mx-auto max-w-4xl space-y-6">
                        {renderStep()}
                        {error ? (
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                      <div>
                        <button
                          type="button"
                          onClick={handlePrevious}
                          disabled={step === 0}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Back
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {step < STEPS.length - 1 ? (
                          <button
                            type="button"
                            onClick={handleNext}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={!canSubmit || submitting || !canEdit}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {submitting ? 'Saving…' : 'Save'}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

PortfolioEditorDrawer.propTypes = {
  open: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'edit']),
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    tagline: PropTypes.string,
    clientName: PropTypes.string,
    clientIndustry: PropTypes.string,
    role: PropTypes.string,
    summary: PropTypes.string,
    problemStatement: PropTypes.string,
    approachSummary: PropTypes.string,
    outcomeSummary: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    industries: PropTypes.arrayOf(PropTypes.string),
    services: PropTypes.arrayOf(PropTypes.string),
    technologies: PropTypes.arrayOf(PropTypes.string),
    callToActionLabel: PropTypes.string,
    callToActionUrl: PropTypes.string,
    repositoryUrl: PropTypes.string,
    liveUrl: PropTypes.string,
    heroImageUrl: PropTypes.string,
    heroVideoUrl: PropTypes.string,
    visibility: PropTypes.string,
    status: PropTypes.string,
    isFeatured: PropTypes.bool,
    featuredOrder: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    impactMetrics: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string,
        tone: PropTypes.string,
      }),
    ),
  }),
  canEdit: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

PortfolioEditorDrawer.defaultProps = {
  open: false,
  mode: 'create',
  item: null,
  canEdit: false,
  onClose: () => {},
  onSubmit: () => {},
};
