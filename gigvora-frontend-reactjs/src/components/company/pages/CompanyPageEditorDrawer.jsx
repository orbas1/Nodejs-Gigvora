import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  XMarkIcon,
  LinkIcon,
  Squares2X2Icon,
  UserPlusIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const DEFAULT_SECTION = {
  title: '',
  variant: 'custom',
  headline: '',
  body: '',
  ctaLabel: '',
  ctaUrl: '',
  visibility: 'public',
  orderIndex: 0,
};

const DEFAULT_COLLABORATOR = {
  collaboratorEmail: '',
  collaboratorName: '',
  role: 'editor',
  status: 'invited',
};

export default function CompanyPageEditorDrawer({
  open,
  page,
  loading,
  onClose,
  onSaveBasics,
  onSaveSections,
  onSaveCollaborators,
  sectionLibrary,
  collaboratorRoles,
  visibilityOptions,
  statusOptions,
}) {
  const [basics, setBasics] = useState(null);
  const [sections, setSections] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [activeTab, setActiveTab] = useState('basics');
  const [savingBasics, setSavingBasics] = useState(false);
  const [savingSections, setSavingSections] = useState(false);
  const [savingCollaborators, setSavingCollaborators] = useState(false);
  const [error, setError] = useState(null);

  const variants = sectionLibrary?.length
    ? sectionLibrary
    : [
        { variant: 'hero', label: 'Hero' },
        { variant: 'story_block', label: 'Story block' },
        { variant: 'metrics_grid', label: 'Metrics grid' },
        { variant: 'media_gallery', label: 'Media gallery' },
        { variant: 'custom', label: 'Custom block' },
      ];

  const collaboratorRoleOptions = useMemo(() => {
    if (!collaboratorRoles?.length) {
      return [
        { value: 'owner', label: 'Owner' },
        { value: 'editor', label: 'Editor' },
        { value: 'approver', label: 'Approver' },
        { value: 'viewer', label: 'Viewer' },
      ];
    }
    return collaboratorRoles.map((role) => ({
      value: typeof role === 'string' ? role : role.value ?? role,
      label: typeof role === 'string' ? role.replace(/_/g, ' ') : role.label ?? role.value ?? role,
    }));
  }, [collaboratorRoles]);

  const visibilityChoices = useMemo(() => {
    if (!visibilityOptions?.length) {
      return [
        { value: 'private', label: 'Private' },
        { value: 'internal', label: 'Internal' },
        { value: 'public', label: 'Public' },
      ];
    }
    return visibilityOptions.map((item) => ({
      value: item.value ?? item,
      label: item.label ?? (typeof item === 'string' ? item.replace(/_/g, ' ') : item.value ?? item),
    }));
  }, [visibilityOptions]);

  const statusChoices = useMemo(() => {
    if (!statusOptions?.length) {
      return [
        { value: 'draft', label: 'Draft' },
        { value: 'in_review', label: 'In review' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' },
      ];
    }
    return statusOptions.map((item) => ({
      value: item.value ?? item,
      label: item.label ?? (typeof item === 'string' ? item.replace(/_/g, ' ') : item.value ?? item),
    }));
  }, [statusOptions]);

  useEffect(() => {
    if (page) {
      setBasics({
        title: page.title ?? '',
        slug: page.slug ?? '',
        headline: page.headline ?? '',
        summary: page.summary ?? '',
        blueprint: page.blueprint ?? 'employer_brand',
        visibility: page.visibility ?? 'private',
        status: page.status ?? 'draft',
        heroImageUrl: page.heroImageUrl ?? '',
        scheduledFor: page.scheduledFor ? page.scheduledFor.slice(0, 16) : '',
        seoTitle: page.seo?.title ?? '',
        seoDescription: page.seo?.description ?? '',
      });
      setSections(
        (page.sections ?? []).map((section, index) => ({
          ...DEFAULT_SECTION,
          ...section,
          orderIndex: section.orderIndex ?? index,
        })),
      );
      setCollaborators(
        (page.collaborators ?? []).map((collaborator) => ({
          ...DEFAULT_COLLABORATOR,
          ...collaborator,
        })),
      );
      setError(null);
    }
  }, [page]);

  useEffect(() => {
    if (!open) {
      setActiveTab('basics');
      setError(null);
    }
  }, [open]);

  const handleBasicsChange = (event) => {
    const { name, value } = event.target;
    setBasics((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (index, name, value) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [name]: value };
      return next;
    });
  };

  const handleCollaboratorChange = (index, name, value) => {
    setCollaborators((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [name]: value };
      return next;
    });
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        ...DEFAULT_SECTION,
        orderIndex: prev.length,
      },
    ]);
  };

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addCollaborator = () => {
    setCollaborators((prev) => [...prev, { ...DEFAULT_COLLABORATOR }]);
  };

  const removeCollaborator = (index) => {
    setCollaborators((prev) => prev.filter((_, idx) => idx !== index));
  };

  const saveBasics = async () => {
    if (!onSaveBasics || !basics) return;
    setSavingBasics(true);
    setError(null);
    try {
      await onSaveBasics({
        title: basics.title,
        slug: basics.slug,
        headline: basics.headline,
        summary: basics.summary,
        blueprint: basics.blueprint,
        visibility: basics.visibility,
        status: basics.status,
        heroImageUrl: basics.heroImageUrl,
        scheduledFor: basics.scheduledFor ? new Date(basics.scheduledFor).toISOString() : null,
        seo: {
          title: basics.seoTitle,
          description: basics.seoDescription,
        },
      });
    } catch (saveError) {
      setError(saveError?.message ?? 'Unable to save page settings.');
    } finally {
      setSavingBasics(false);
    }
  };

  const saveSections = async () => {
    if (!onSaveSections) return;
    setSavingSections(true);
    setError(null);
    try {
      await onSaveSections(
        sections.map((section, index) => ({
          ...section,
          orderIndex: index,
        })),
      );
    } catch (saveError) {
      setError(saveError?.message ?? 'Unable to save sections.');
    } finally {
      setSavingSections(false);
    }
  };

  const saveCollaborators = async () => {
    if (!onSaveCollaborators) return;
    setSavingCollaborators(true);
    setError(null);
    try {
      await onSaveCollaborators(
        collaborators
          .filter((collaborator) => collaborator.collaboratorEmail || collaborator.collaboratorId)
          .map((collaborator) => ({
            ...collaborator,
            collaboratorEmail: collaborator.collaboratorEmail?.trim() || null,
            collaboratorName: collaborator.collaboratorName?.trim() || null,
          })),
      );
    } catch (saveError) {
      setError(saveError?.message ?? 'Unable to save collaborators.');
    } finally {
      setSavingCollaborators(false);
    }
  };

  const tabs = [
    { id: 'basics', label: 'Basics', icon: Squares2X2Icon },
    { id: 'sections', label: 'Sections', icon: LinkIcon },
    { id: 'collaborators', label: 'Collaborators', icon: UserPlusIcon },
  ];

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl bg-white shadow-2xl">
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">
                          {page?.title ?? 'Edit page'}
                        </Dialog.Title>
                        <p className="text-xs text-slate-500">Update settings, sections, and collaborators.</p>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      {error ? (
                        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {error}
                        </div>
                      ) : null}

                      <Tab.Group selectedIndex={tabs.findIndex((tab) => tab.id === activeTab)} onChange={(index) => setActiveTab(tabs[index].id)}>
                        <Tab.List className="flex gap-2 rounded-2xl bg-slate-100 p-1">
                          {tabs.map((tab) => (
                            <Tab
                              key={tab.id}
                              className={({ selected }) =>
                                classNames(
                                  'flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition',
                                  selected
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700',
                                )
                              }
                            >
                              <tab.icon className="h-4 w-4" />
                              {tab.label}
                            </Tab>
                          ))}
                        </Tab.List>

                        <Tab.Panels className="mt-4">
                          <Tab.Panel>
                            <div className="space-y-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-title">
                                    Title
                                  </label>
                                  <input
                                    id="page-basic-title"
                                    name="title"
                                    value={basics?.title ?? ''}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-slug">
                                    Slug
                                  </label>
                                  <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
                                    <span className="text-xs text-slate-500">/pages/</span>
                                    <input
                                      id="page-basic-slug"
                                      name="slug"
                                      value={basics?.slug ?? ''}
                                      onChange={handleBasicsChange}
                                      className="w-full border-none bg-transparent py-3 text-sm text-slate-900 focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-blueprint">
                                    Blueprint
                                  </label>
                                  <input
                                    id="page-basic-blueprint"
                                    name="blueprint"
                                    value={basics?.blueprint ?? ''}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-status">
                                    Status
                                  </label>
                                  <select
                                    id="page-basic-status"
                                    name="status"
                                    value={basics?.status ?? 'draft'}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  >
                                    {statusChoices.map((status) => (
                                      <option key={status.value} value={status.value}>
                                        {status.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-visibility">
                                    Visibility
                                  </label>
                                  <select
                                    id="page-basic-visibility"
                                    name="visibility"
                                    value={basics?.visibility ?? 'private'}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  >
                                    {visibilityChoices.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-schedule">
                                    Scheduled launch
                                  </label>
                                  <input
                                    id="page-basic-schedule"
                                    name="scheduledFor"
                                    type="datetime-local"
                                    value={basics?.scheduledFor ?? ''}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-headline">
                                    Headline
                                  </label>
                                  <input
                                    id="page-basic-headline"
                                    name="headline"
                                    value={basics?.headline ?? ''}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-summary">
                                    Summary
                                  </label>
                                  <textarea
                                    id="page-basic-summary"
                                    name="summary"
                                    rows={3}
                                    value={basics?.summary ?? ''}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-hero">
                                    Hero image URL
                                  </label>
                                  <div className="mt-1 flex gap-2">
                                    <input
                                      id="page-basic-hero"
                                      name="heroImageUrl"
                                      value={basics?.heroImageUrl ?? ''}
                                      onChange={handleBasicsChange}
                                      placeholder="https://"
                                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                    />
                                    {basics?.heroImageUrl ? (
                                      <a
                                        href={basics.heroImageUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-accent hover:text-accent"
                                      >
                                        <ArrowUpTrayIcon className="h-4 w-4" />
                                      </a>
                                    ) : null}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-seo-title">
                                    SEO title
                                  </label>
                                  <input
                                    id="page-basic-seo-title"
                                    name="seoTitle"
                                    value={basics?.seoTitle ?? ''}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="page-basic-seo-description">
                                    SEO description
                                  </label>
                                  <textarea
                                    id="page-basic-seo-description"
                                    name="seoDescription"
                                    rows={2}
                                    value={basics?.seoDescription ?? ''}
                                    onChange={handleBasicsChange}
                                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  disabled={savingBasics || loading}
                                  onClick={saveBasics}
                                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                >
                                  {savingBasics ? 'Saving…' : 'Save basics'}
                                </button>
                              </div>
                            </div>
                          </Tab.Panel>
                          <Tab.Panel>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900">Sections</h4>
                                  <p className="text-xs text-slate-500">Order defines the layout from top to bottom.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={addSection}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                                >
                                  <Squares2X2Icon className="h-4 w-4" /> Add section
                                </button>
                              </div>
                              <div className="space-y-3">
                                {sections.map((section, index) => (
                                  <div key={section.id ?? index} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="text-sm font-semibold text-slate-900">Section {index + 1}</div>
                                      <button
                                        type="button"
                                        onClick={() => removeSection(index)}
                                        className="text-xs text-rose-500 transition hover:text-rose-600"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                          Title
                                        </label>
                                        <input
                                          value={section.title ?? ''}
                                          onChange={(event) => handleSectionChange(index, 'title', event.target.value)}
                                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                          Variant
                                        </label>
                                        <select
                                          value={section.variant ?? 'custom'}
                                          onChange={(event) => handleSectionChange(index, 'variant', event.target.value)}
                                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        >
                                          {variants.map((option) => (
                                            <option key={option.variant ?? option.value} value={option.variant ?? option.value}>
                                              {option.label ?? option.name ?? option.variant ?? option.value}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                          Headline
                                        </label>
                                        <input
                                          value={section.headline ?? ''}
                                          onChange={(event) => handleSectionChange(index, 'headline', event.target.value)}
                                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                          Visibility
                                        </label>
                                        <select
                                          value={section.visibility ?? 'public'}
                                          onChange={(event) => handleSectionChange(index, 'visibility', event.target.value)}
                                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        >
                                          {visibilityChoices.map((option) => (
                                            <option key={option.value} value={option.value}>
                                              {option.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                          Body
                                        </label>
                                        <textarea
                                          value={section.body ?? ''}
                                          onChange={(event) => handleSectionChange(index, 'body', event.target.value)}
                                          rows={3}
                                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                          CTA label
                                        </label>
                                        <input
                                          value={section.ctaLabel ?? ''}
                                          onChange={(event) => handleSectionChange(index, 'ctaLabel', event.target.value)}
                                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                          CTA URL
                                        </label>
                                        <input
                                          value={section.ctaUrl ?? ''}
                                          onChange={(event) => handleSectionChange(index, 'ctaUrl', event.target.value)}
                                          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  disabled={savingSections || loading}
                                  onClick={saveSections}
                                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                >
                                  {savingSections ? 'Saving…' : 'Save sections'}
                                </button>
                              </div>
                            </div>
                          </Tab.Panel>
                          <Tab.Panel>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900">Collaborators</h4>
                                  <p className="text-xs text-slate-500">Grant review and editing access to teammates.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={addCollaborator}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                                >
                                  <UserPlusIcon className="h-4 w-4" /> Invite collaborator
                                </button>
                              </div>
                              <div className="space-y-3">
                                {collaborators.map((collaborator, index) => (
                                  <div key={collaborator.id ?? index} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Email
                                      </label>
                                      <input
                                        value={collaborator.collaboratorEmail ?? ''}
                                        onChange={(event) => handleCollaboratorChange(index, 'collaboratorEmail', event.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Name
                                      </label>
                                      <input
                                        value={collaborator.collaboratorName ?? ''}
                                        onChange={(event) => handleCollaboratorChange(index, 'collaboratorName', event.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Role
                                      </label>
                                      <select
                                        value={collaborator.role ?? 'editor'}
                                        onChange={(event) => handleCollaboratorChange(index, 'role', event.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                      >
                                        {collaboratorRoleOptions.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                      </label>
                                      <select
                                        value={collaborator.status ?? 'invited'}
                                        onChange={(event) => handleCollaboratorChange(index, 'status', event.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                      >
                                        <option value="invited">Invited</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                      </select>
                                    </div>
                                    <div className="sm:col-span-2 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => removeCollaborator(index)}
                                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  disabled={savingCollaborators || loading}
                                  onClick={saveCollaborators}
                                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                >
                                  {savingCollaborators ? 'Saving…' : 'Save collaborators'}
                                </button>
                              </div>
                            </div>
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
