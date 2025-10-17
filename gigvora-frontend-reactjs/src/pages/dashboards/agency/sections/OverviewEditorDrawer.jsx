import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `highlight-${Math.random().toString(36).slice(2, 10)}`;
}

const MAX_HIGHLIGHTS = 6;

function coerceNumberInput(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  return `${value}`;
}

const defaultHighlight = () => ({
  id: generateId(),
  title: '',
  summary: '',
  link: '',
  imageUrl: '',
});

const tabs = [
  { id: 'intro', label: 'Intro' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'weather', label: 'Weather' },
  { id: 'wins', label: 'Wins' },
];

export default function OverviewEditorDrawer({
  open,
  onClose,
  initialOverview,
  onSubmit,
  saving,
  workspaceName,
}) {
  const [formState, setFormState] = useState(() => ({
    greetingName: initialOverview?.greetingName ?? workspaceName ?? 'Team',
    greetingHeadline: initialOverview?.greetingHeadline ?? "Let's win today.",
    overviewSummary: initialOverview?.overviewSummary ?? '',
    avatarUrl: initialOverview?.avatarUrl ?? '',
    followerCount: coerceNumberInput(initialOverview?.followerCount ?? 0),
    trustScore: coerceNumberInput(initialOverview?.trustScore ?? ''),
    rating: coerceNumberInput(initialOverview?.rating ?? ''),
    weatherLocation: initialOverview?.weatherLocation ?? '',
    weatherLatitude: coerceNumberInput(initialOverview?.weatherLatitude ?? ''),
    weatherLongitude: coerceNumberInput(initialOverview?.weatherLongitude ?? ''),
    highlights: Array.isArray(initialOverview?.highlights) && initialOverview.highlights.length
      ? initialOverview.highlights.map((highlight) => ({
          id: highlight.id ?? generateId(),
          title: highlight.title ?? '',
          summary: highlight.summary ?? '',
          link: highlight.link ?? '',
          imageUrl: highlight.imageUrl ?? '',
        }))
      : [defaultHighlight()],
  }));
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormError(null);
    setActiveTab(tabs[0].id);
    setFormState({
      greetingName: initialOverview?.greetingName ?? workspaceName ?? 'Team',
      greetingHeadline: initialOverview?.greetingHeadline ?? "Let's win today.",
      overviewSummary: initialOverview?.overviewSummary ?? '',
      avatarUrl: initialOverview?.avatarUrl ?? '',
      followerCount: coerceNumberInput(initialOverview?.followerCount ?? 0),
      trustScore: coerceNumberInput(initialOverview?.trustScore ?? ''),
      rating: coerceNumberInput(initialOverview?.rating ?? ''),
      weatherLocation: initialOverview?.weatherLocation ?? '',
      weatherLatitude: coerceNumberInput(initialOverview?.weatherLatitude ?? ''),
      weatherLongitude: coerceNumberInput(initialOverview?.weatherLongitude ?? ''),
      highlights: Array.isArray(initialOverview?.highlights) && initialOverview.highlights.length
        ? initialOverview.highlights.map((highlight) => ({
            id: highlight.id ?? generateId(),
            title: highlight.title ?? '',
            summary: highlight.summary ?? '',
            link: highlight.link ?? '',
            imageUrl: highlight.imageUrl ?? '',
          }))
        : [defaultHighlight()],
    });
  }, [initialOverview, open, workspaceName]);

  const highlightLimitReached = useMemo(
    () => formState.highlights.length >= MAX_HIGHLIGHTS,
    [formState.highlights.length],
  );

  const handleChange = (field, value) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const handleHighlightChange = (index, field, value) => {
    setFormState((previous) => ({
      ...previous,
      highlights: previous.highlights.map((highlight, highlightIndex) =>
        highlightIndex === index ? { ...highlight, [field]: value } : highlight,
      ),
    }));
  };

  const handleAddHighlight = () => {
    if (highlightLimitReached) {
      return;
    }
    setFormState((previous) => ({
      ...previous,
      highlights: [...previous.highlights, defaultHighlight()],
    }));
  };

  const handleRemoveHighlight = (index) => {
    setFormState((previous) => ({
      ...previous,
      highlights:
        previous.highlights.length > 1
          ? previous.highlights.filter((_, highlightIndex) => highlightIndex !== index)
          : previous.highlights,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const payload = {
      greetingName: formState.greetingName?.trim() || workspaceName || 'Team',
      greetingHeadline: formState.greetingHeadline?.trim() || "Let's win today.",
      overviewSummary: formState.overviewSummary?.trim() || null,
      avatarUrl: formState.avatarUrl?.trim() || null,
      followerCount: Number(formState.followerCount) || 0,
      trustScore:
        formState.trustScore === '' || formState.trustScore === null
          ? null
          : Number(formState.trustScore),
      rating:
        formState.rating === '' || formState.rating === null ? null : Number(formState.rating),
      weatherLocation: formState.weatherLocation?.trim() || null,
      weatherLatitude:
        formState.weatherLatitude === '' || formState.weatherLatitude === null
          ? null
          : Number(formState.weatherLatitude),
      weatherLongitude:
        formState.weatherLongitude === '' || formState.weatherLongitude === null
          ? null
          : Number(formState.weatherLongitude),
      highlights: formState.highlights
        .map((highlight) => ({
          id: highlight.id ?? generateId(),
          title: highlight.title?.trim() || '',
          summary: highlight.summary?.trim() || null,
          link: highlight.link?.trim() || null,
          imageUrl: highlight.imageUrl?.trim() || null,
        }))
        .filter((highlight) => highlight.title.length > 0),
    };

    try {
      await onSubmit?.(payload);
      onClose?.();
    } catch (error) {
      setFormError(error);
    }
  };

  const renderIntroTab = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Name</span>
          <input
            type="text"
            value={formState.greetingName}
            onChange={(event) => handleChange('greetingName', event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            maxLength={150}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Headline</span>
          <input
            type="text"
            value={formState.greetingHeadline}
            onChange={(event) => handleChange('greetingHeadline', event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            maxLength={200}
          />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Summary</span>
        <textarea
          value={formState.overviewSummary}
          onChange={(event) => handleChange('overviewSummary', event.target.value)}
          className="min-h-[96px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          maxLength={400}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Avatar URL</span>
        <input
          type="url"
          value={formState.avatarUrl}
          onChange={(event) => handleChange('avatarUrl', event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          maxLength={2048}
          placeholder="https://"
        />
      </label>
    </div>
  );

  const renderMetricsTab = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Followers</span>
          <input
            type="number"
            min={0}
            value={formState.followerCount}
            onChange={(event) => handleChange('followerCount', event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Trust</span>
          <input
            type="number"
            min={0}
            max={100}
            value={formState.trustScore}
            onChange={(event) => handleChange('trustScore', event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Rating</span>
          <input
            type="number"
            min={0}
            max={5}
            step="0.1"
            value={formState.rating}
            onChange={(event) => handleChange('rating', event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>
    </div>
  );

  const renderWeatherTab = () => (
    <div className="space-y-4">
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Location name</span>
        <input
          type="text"
          value={formState.weatherLocation}
          onChange={(event) => handleChange('weatherLocation', event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          maxLength={180}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Latitude</span>
          <input
            type="number"
            step="0.0001"
            min={-90}
            max={90}
            value={formState.weatherLatitude}
            onChange={(event) => handleChange('weatherLatitude', event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Longitude</span>
          <input
            type="number"
            step="0.0001"
            min={-180}
            max={180}
            value={formState.weatherLongitude}
            onChange={(event) => handleChange('weatherLongitude', event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>
    </div>
  );

  const renderWinsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Cards {formState.highlights.length}/{MAX_HIGHLIGHTS}
        </p>
        <button
          type="button"
          onClick={handleAddHighlight}
          disabled={highlightLimitReached}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add card
        </button>
      </div>

      <div className="space-y-4">
        {formState.highlights.map((highlight, index) => (
          <div key={highlight.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Card {index + 1}</p>
              <button
                type="button"
                onClick={() => handleRemoveHighlight(index)}
                disabled={formState.highlights.length <= 1}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Remove card</span>
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Title</span>
                <input
                  type="text"
                  value={highlight.title}
                  onChange={(event) => handleHighlightChange(index, 'title', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  maxLength={120}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Summary</span>
                <input
                  type="text"
                  value={highlight.summary}
                  onChange={(event) => handleHighlightChange(index, 'summary', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  maxLength={400}
                />
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Link</span>
                <input
                  type="url"
                  value={highlight.link}
                  onChange={(event) => handleHighlightChange(index, 'link', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  maxLength={2048}
                  placeholder="https://"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Image URL</span>
                <input
                  type="url"
                  value={highlight.imageUrl}
                  onChange={(event) => handleHighlightChange(index, 'imageUrl', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                  maxLength={2048}
                  placeholder="https://"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'metrics':
        return renderMetricsTab();
      case 'weather':
        return renderWeatherTab();
      case 'wins':
        return renderWinsTab();
      case 'intro':
      default:
        return renderIntroTab();
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">Edit home</Dialog.Title>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                        onClick={onClose}
                      >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        <span className="sr-only">Close editor</span>
                      </button>
                    </div>

                    <div className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              activeTab === tab.id
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                      {formError ? (
                        <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {formError.message ?? 'Unable to save changes right now. Please try again.'}
                        </div>
                      ) : null}
                      {renderActiveTab()}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
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
