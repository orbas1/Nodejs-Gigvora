import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import {
  createExplorerRecord,
  deleteExplorerRecord,
  fetchExplorerRecords,
  updateExplorerRecord,
} from '../../services/explorerData.js';

const DEFAULT_FORM_STATE = {
  id: null,
  title: '',
  summary: '',
  description: '',
  longDescription: '',
  status: 'draft',
  organization: '',
  location: '',
  employmentType: '',
  duration: '',
  experienceLevel: '',
  availability: '',
  isRemote: false,
  skills: '',
  tags: '',
  priceAmount: '',
  priceCurrency: '',
  priceUnit: '',
  heroImage: '',
  gallery: '',
  videoUrl: '',
  detailUrl: '',
  applicationUrl: '',
  rating: '',
  reviewCount: '',
  geoLat: '',
  geoLng: '',
};

function buildPayloadFromForm(formState) {
  const payload = {
    title: formState.title.trim(),
    summary: formState.summary.trim(),
    description: formState.description.trim(),
    status: formState.status.trim() || 'draft',
    organization: formState.organization.trim() || undefined,
    location: formState.location.trim() || undefined,
    employmentType: formState.employmentType.trim() || undefined,
    duration: formState.duration.trim() || undefined,
    experienceLevel: formState.experienceLevel.trim() || undefined,
    availability: formState.availability.trim() || undefined,
    isRemote: Boolean(formState.isRemote),
    skills: formState.skills
      ? formState.skills
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    tags: formState.tags
      ? formState.tags
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    heroImage: formState.heroImage.trim() || undefined,
    gallery: formState.gallery
      ? formState.gallery
          .split(/\r?\n|,/)
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined,
    videoUrl: formState.videoUrl.trim() || undefined,
    detailUrl: formState.detailUrl.trim() || undefined,
    applicationUrl: formState.applicationUrl.trim() || undefined,
    longDescription: formState.longDescription.trim() || undefined,
  };

  if (formState.priceAmount || formState.priceCurrency || formState.priceUnit) {
    const amount = Number.parseFloat(formState.priceAmount);
    payload.price = {
      amount: Number.isNaN(amount) ? undefined : amount,
      currency: formState.priceCurrency.trim() || undefined,
      unit: formState.priceUnit.trim() || undefined,
    };
  }

  if (formState.rating) {
    const rating = Number.parseFloat(formState.rating);
    if (!Number.isNaN(rating)) {
      payload.rating = rating;
    }
  }

  if (formState.reviewCount) {
    const reviewCount = Number.parseInt(formState.reviewCount, 10);
    if (!Number.isNaN(reviewCount)) {
      payload.reviewCount = reviewCount;
    }
  }

  const lat = formState.geoLat ? Number.parseFloat(formState.geoLat) : undefined;
  const lng = formState.geoLng ? Number.parseFloat(formState.geoLng) : undefined;
  if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat != null && lng != null) {
    payload.geo = { lat, lng };
  }

  return payload;
}

function buildFormState(record) {
  if (!record) {
    return DEFAULT_FORM_STATE;
  }
  return {
    id: record.id ?? null,
    title: record.title ?? '',
    summary: record.summary ?? '',
    description: record.description ?? '',
    longDescription: record.longDescription ?? '',
    status: record.status ?? 'draft',
    organization: record.organization ?? '',
    location: record.location ?? '',
    employmentType: record.employmentType ?? '',
    duration: record.duration ?? '',
    experienceLevel: record.experienceLevel ?? '',
    availability: record.availability ?? '',
    isRemote: Boolean(record.isRemote),
    skills: Array.isArray(record.skills) ? record.skills.join(', ') : '',
    tags: Array.isArray(record.tags) ? record.tags.join(', ') : '',
    priceAmount: record.price?.amount ?? '',
    priceCurrency: record.price?.currency ?? '',
    priceUnit: record.price?.unit ?? '',
    heroImage: record.heroImage ?? '',
    gallery: Array.isArray(record.gallery) ? record.gallery.join('\n') : '',
    videoUrl: record.videoUrl ?? '',
    detailUrl: record.detailUrl ?? '',
    applicationUrl: record.applicationUrl ?? '',
    rating: record.rating ?? '',
    reviewCount: record.reviewCount ?? '',
    geoLat: record.geo?.lat ?? '',
    geoLng: record.geo?.lng ?? '',
  };
}

function ExplorerManagementPanel({ category, categoryLabel, isOpen, onClose, onMutate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
  const [activeId, setActiveId] = useState(null);
  const [forceRefreshToken, setForceRefreshToken] = useState(0);

  const refreshRecords = useCallback(async () => {
    if (!category) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchExplorerRecords(category, { pageSize: 100 });
      setRecords(response.items ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (isOpen) {
      refreshRecords();
    } else {
      setRecords([]);
      setFormState(DEFAULT_FORM_STATE);
      setActiveId(null);
      setError(null);
    }
  }, [isOpen, refreshRecords, forceRefreshToken]);

  const handleEdit = useCallback((record) => {
    setActiveId(record.id);
    setFormState(buildFormState(record));
  }, []);

  const handleCreateNew = useCallback(() => {
    setActiveId(null);
    setFormState(DEFAULT_FORM_STATE);
  }, []);

  const handleFieldChange = useCallback((field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : typeof event.target.value === 'string' ? event.target.value : '';
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!category) {
        return;
      }
      setSaving(true);
      setError(null);
      const payload = buildPayloadFromForm(formState);
      try {
        if (formState.id) {
          await updateExplorerRecord(category, formState.id, payload);
        } else {
          await createExplorerRecord(category, payload);
        }
        if (typeof onMutate === 'function') {
          onMutate();
        }
        setForceRefreshToken((token) => token + 1);
        await refreshRecords();
        if (!formState.id) {
          setFormState(DEFAULT_FORM_STATE);
        }
      } catch (err) {
        setError(err);
      } finally {
        setSaving(false);
      }
    },
    [category, formState, onMutate, refreshRecords],
  );

  const handleDelete = useCallback(
    async (record) => {
      if (!category || !record?.id) {
        return;
      }
      setDeletingId(record.id);
      setError(null);
      try {
        await deleteExplorerRecord(category, record.id);
        if (typeof onMutate === 'function') {
          onMutate();
        }
        setForceRefreshToken((token) => token + 1);
        if (formState.id === record.id) {
          setFormState(DEFAULT_FORM_STATE);
        }
        await refreshRecords();
      } catch (err) {
        setError(err);
      } finally {
        setDeletingId(null);
      }
    },
    [category, formState.id, onMutate, refreshRecords],
  );

  const isEditing = Boolean(formState.id);

  const panelTitle = useMemo(() => `Manage ${categoryLabel}`, [categoryLabel]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[120]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
              enterTo="translate-y-0 opacity-100 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="translate-y-0 opacity-100 sm:scale-100"
              leaveTo="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{panelTitle}</Dialog.Title>
                    <p className="mt-1 text-sm text-slate-500">
                      Create, edit, and publish explorer records in real time. Updates are immediately reflected in the explorer
                      search experience.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                    >
                      <PlusIcon className="h-4 w-4" aria-hidden="true" /> New {categoryLabel.slice(0, -1)}
                    </button>
                    <button
                      type="button"
                      onClick={refreshRecords}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
                    </button>
                  </div>
                </header>

                <div className="grid gap-0 border-t border-slate-100 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <div className="max-h-[560px] overflow-y-auto border-r border-slate-100">
                    <div className="p-6">
                      <DataStatus
                        loading={loading}
                        error={error}
                        emptyMessage={`No ${categoryLabel.toLowerCase()} have been created yet.`}
                        items={records}
                      >
                        <ul className="space-y-4">
                          {records.map((record) => (
                            <li key={record.id}>
                              <article
                                className={`rounded-3xl border p-4 transition ${
                                  activeId === record.id
                                    ? 'border-accent shadow-soft'
                                    : 'border-slate-200 hover:border-accent'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h3 className="text-sm font-semibold text-slate-900">{record.title}</h3>
                                    <p className="mt-1 text-xs text-slate-500 line-clamp-3">{record.summary}</p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
                                      {record.status ? <span>{record.status}</span> : null}
                                      {record.location ? <span>{record.location}</span> : null}
                                      {record.employmentType ? <span>{record.employmentType}</span> : null}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEdit(record)}
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                                    >
                                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(record)}
                                      disabled={deletingId === record.id}
                                      className="inline-flex items-center gap-1 rounded-full border border-red-100 px-3 py-1 text-xs font-semibold text-red-500 transition hover:border-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                      {deletingId === record.id ? 'Deleting…' : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                              </article>
                            </li>
                          ))}
                        </ul>
                      </DataStatus>
                    </div>
                  </div>

                  <div className="max-h-[560px] overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Title
                          <input
                            type="text"
                            required
                            value={formState.title}
                            onChange={handleFieldChange('title')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Status
                          <input
                            type="text"
                            required
                            value={formState.status}
                            onChange={handleFieldChange('status')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <label className="block text-sm font-medium text-slate-700">
                        Summary
                        <textarea
                          required
                          value={formState.summary}
                          onChange={handleFieldChange('summary')}
                          rows={2}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Description
                        <textarea
                          required
                          value={formState.description}
                          onChange={handleFieldChange('description')}
                          rows={4}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Long form description
                        <textarea
                          value={formState.longDescription}
                          onChange={handleFieldChange('longDescription')}
                          rows={4}
                          placeholder="Rich story, success metrics, deliverables, or testimonials."
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Organization / Poster
                          <input
                            type="text"
                            value={formState.organization}
                            onChange={handleFieldChange('organization')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Location
                          <input
                            type="text"
                            value={formState.location}
                            onChange={handleFieldChange('location')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <label className="block text-sm font-medium text-slate-700">
                          Employment type
                          <input
                            type="text"
                            value={formState.employmentType}
                            onChange={handleFieldChange('employmentType')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Duration
                          <input
                            type="text"
                            value={formState.duration}
                            onChange={handleFieldChange('duration')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Availability
                          <input
                            type="text"
                            value={formState.availability}
                            onChange={handleFieldChange('availability')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <label className="block text-sm font-medium text-slate-700">
                          Experience level
                          <input
                            type="text"
                            value={formState.experienceLevel}
                            onChange={handleFieldChange('experienceLevel')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Skills (comma separated)
                          <input
                            type="text"
                            value={formState.skills}
                            onChange={handleFieldChange('skills')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Tags (comma separated)
                          <input
                            type="text"
                            value={formState.tags}
                            onChange={handleFieldChange('tags')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <fieldset className="grid gap-4 rounded-3xl border border-slate-200 p-4 lg:grid-cols-3">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Pricing</legend>
                        <label className="block text-sm font-medium text-slate-700">
                          Amount
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formState.priceAmount}
                            onChange={handleFieldChange('priceAmount')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Currency
                          <input
                            type="text"
                            value={formState.priceCurrency}
                            onChange={handleFieldChange('priceCurrency')}
                            placeholder="USD"
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Unit
                          <input
                            type="text"
                            value={formState.priceUnit}
                            onChange={handleFieldChange('priceUnit')}
                            placeholder="hour, project, program"
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </fieldset>

                      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={formState.isRemote}
                          onChange={handleFieldChange('isRemote')}
                          className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/40"
                        />
                        Remote friendly
                      </label>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Hero image URL
                          <input
                            type="url"
                            value={formState.heroImage}
                            onChange={handleFieldChange('heroImage')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Video URL
                          <input
                            type="url"
                            value={formState.videoUrl}
                            onChange={handleFieldChange('videoUrl')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <label className="block text-sm font-medium text-slate-700">
                        Gallery URLs (one per line)
                        <textarea
                          value={formState.gallery}
                          onChange={handleFieldChange('gallery')}
                          rows={3}
                          className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Detail URL
                          <input
                            type="url"
                            value={formState.detailUrl}
                            onChange={handleFieldChange('detailUrl')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Application / checkout URL
                          <input
                            type="url"
                            value={formState.applicationUrl}
                            onChange={handleFieldChange('applicationUrl')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Rating
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.01"
                            value={formState.rating}
                            onChange={handleFieldChange('rating')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Review count
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formState.reviewCount}
                            onChange={handleFieldChange('reviewCount')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Latitude
                          <input
                            type="number"
                            step="0.000001"
                            value={formState.geoLat}
                            onChange={handleFieldChange('geoLat')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-700">
                          Longitude
                          <input
                            type="number"
                            step="0.000001"
                            value={formState.geoLng}
                            onChange={handleFieldChange('geoLng')}
                            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">
                          {isEditing
                            ? 'Updating this record refreshes explorer search immediately.'
                            : 'New records are indexed instantly after saving.'}
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {saving ? 'Saving…' : isEditing ? 'Update record' : 'Create record'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

ExplorerManagementPanel.propTypes = {
  category: PropTypes.string.isRequired,
  categoryLabel: PropTypes.string.isRequired,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onMutate: PropTypes.func,
};

ExplorerManagementPanel.defaultProps = {
  isOpen: false,
  onClose: undefined,
  onMutate: undefined,
};

export default ExplorerManagementPanel;
