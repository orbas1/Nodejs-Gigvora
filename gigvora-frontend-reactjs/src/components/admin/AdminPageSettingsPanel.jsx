import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
  LinkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { createPageSetting, deletePageSetting, listPageSettings, updatePageSetting } from '../../services/pageSettings.js';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'members', label: 'Members' },
  { value: 'public', label: 'Public' },
];

const LAYOUT_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'campaign', label: 'Campaign' },
];

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero' },
  { value: 'metrics', label: 'Metrics' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'faq', label: 'FAQ' },
  { value: 'cta', label: 'Call to action' },
  { value: 'news', label: 'News feed' },
  { value: 'highlights', label: 'Highlights' },
  { value: 'custom', label: 'Custom' },
];

const STATUS_BADGE_CLASSNAMES = {
  draft: 'bg-slate-100 text-slate-700',
  review: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-200 text-slate-500',
};

function slugify(value, fallback = 'page') {
  if (!value) {
    return fallback;
  }
  return value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 180) || fallback;
}

function parseKeywords(value) {
  if (!value) {
    return [];
  }
  return Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 30);
}

function parseRoles(value, fallback = ['admin']) {
  if (!value) {
    return fallback;
  }
  const roles = Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, 20);
  return roles.length ? roles : fallback;
}

function buildInitialDraft(session) {
  const defaultRoles = Array.isArray(session?.memberships)
    ? session.memberships.map((role) => `${role}`.toLowerCase())
    : ['admin'];
  const allowedRoles = defaultRoles.length ? Array.from(new Set(defaultRoles)) : ['admin'];
  return {
    name: '',
    slug: '',
    description: '',
    status: 'draft',
    visibility: 'private',
    layout: 'standard',
    hero: {
      title: '',
      subtitle: '',
      badge: '',
      mediaType: 'image',
      mediaUrl: '',
      backgroundImageUrl: '',
      accentColor: '#2563eb',
      alignment: 'left',
    },
    seo: {
      title: '',
      description: '',
      keywords: [],
    },
    callToAction: {
      primary: { label: '', url: '' },
      secondary: { label: '', url: '' },
    },
    navigation: {
      header: [],
      footer: [],
    },
    sections: [],
    theme: {
      accent: '#2563eb',
      background: '#ffffff',
      text: '#0f172a',
    },
    allowedRoles,
  };
}

function normaliseRecord(record, session) {
  const base = buildInitialDraft(session);
  if (!record) {
    return base;
  }
  return {
    ...base,
    name: record.name ?? base.name,
    slug: record.slug ?? base.slug,
    description: record.description ?? base.description,
    status: record.status ?? base.status,
    visibility: record.visibility ?? base.visibility,
    layout: record.layout ?? base.layout,
    hero: { ...base.hero, ...(record.hero ?? {}) },
    seo: {
      ...base.seo,
      ...(record.seo ?? {}),
      keywords: Array.isArray(record.seo?.keywords) ? record.seo.keywords : base.seo.keywords,
    },
    callToAction: {
      primary: { ...base.callToAction.primary, ...(record.callToAction?.primary ?? {}) },
      secondary: { ...base.callToAction.secondary, ...(record.callToAction?.secondary ?? {}) },
    },
    navigation: {
      header: Array.isArray(record.navigation?.header) ? record.navigation.header : [],
      footer: Array.isArray(record.navigation?.footer) ? record.navigation.footer : [],
    },
    sections: Array.isArray(record.sections)
      ? record.sections.map((section, index) => ({
          id: section.id ?? `section-${index + 1}`,
          title: section.title ?? '',
          type: section.type ?? 'custom',
          summary: section.summary ?? '',
          enabled: section.enabled !== false,
          order: typeof section.order === 'number' ? section.order : index,
          media: {
            type: section.media?.type ?? 'image',
            url: section.media?.url ?? '',
            altText: section.media?.altText ?? '',
          },
          cta: {
            label: section.cta?.label ?? '',
            url: section.cta?.url ?? '',
            external: Boolean(section.cta?.external),
          },
        }))
      : [],
    theme: { ...base.theme, ...(record.theme ?? {}) },
    allowedRoles: Array.isArray(record.roleAccess?.allowedRoles)
      ? record.roleAccess.allowedRoles
      : Array.isArray(record.allowedRoles)
      ? record.allowedRoles
      : base.allowedRoles,
  };
}

function formatRelative(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default function AdminPageSettingsPanel({ session }) {
  const computeInitialDraft = useCallback(() => buildInitialDraft(session), [session]);
  const [pages, setPages] = useState([]);
  const [meta, setMeta] = useState({ total: 0, limit: 25, offset: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(() => computeInitialDraft());
  const [slugTouched, setSlugTouched] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState('');
  const [rolesInput, setRolesInput] = useState(() => draft.allowedRoles.join(', '));
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [initialised, setInitialised] = useState(false);

  const authorisedRoles = useMemo(() => new Set(draft.allowedRoles), [draft.allowedRoles]);
  const previewUrl = draft.slug?.trim() ? `/pages/${draft.slug.trim()}` : '';
  const disableActions = saving || deleting;

  const assignRecordToDraft = useCallback(
    (record) => {
      const normalised = normaliseRecord(record, session);
      setDraft(normalised);
      setKeywordsInput(normalised.seo.keywords.join(', '));
      setRolesInput(normalised.allowedRoles.join(', '));
      const derivedSlug = slugify(normalised.name, normalised.slug || 'page');
      const shouldLockSlug = Boolean(record?.id) || (normalised.slug && normalised.slug !== derivedSlug);
      setSlugTouched(shouldLockSlug);
      setDirty(false);
    },
    [session],
  );

  const loadPages = useCallback(
    async ({ force } = {}) => {
      setError('');
      setStatusMessage('');
      if (!initialised || force) {
        setLoading(true);
      } else {
        setReloading(true);
      }
      try {
        const response = await listPageSettings();
        const items = Array.isArray(response?.items) ? response.items : [];
        setPages(items);
        setMeta(response?.meta ?? { total: items.length, limit: items.length, offset: 0 });

        if (!items.length) {
          setSelectedId(null);
          assignRecordToDraft(computeInitialDraft());
          setInitialised(true);
          return;
        }

        const currentSelection = selectedId
          ? items.find((item) => item.id === selectedId)
          : items[0];

        if (!currentSelection) {
          const fallback = items[0];
          setSelectedId(fallback.id);
          if (!dirty) {
            assignRecordToDraft(fallback);
          }
        } else if (!dirty) {
          assignRecordToDraft(currentSelection);
        }
        if (!selectedId && items[0]) {
          setSelectedId(items[0].id);
        }
      } catch (err) {
        setError(err?.message || 'Unable to load page settings.');
      } finally {
        setLoading(false);
        setReloading(false);
        setInitialised(true);
      }
    },
    [assignRecordToDraft, computeInitialDraft, dirty, initialised, selectedId],
  );

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleSelectPage = (page) => {
    if (!page) {
      return;
    }
    if (dirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    setSelectedId(page.id);
    assignRecordToDraft(page);
  };

  const handleCreateNew = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    const fresh = computeInitialDraft();
    setSelectedId(null);
    assignRecordToDraft(fresh);
    setSlugTouched(false);
  };

  const handleDuplicate = () => {
    if (dirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    const duplicateName = draft.name ? `${draft.name} copy` : 'New page';
    const duplicateSlug = draft.slug ? `${draft.slug}-copy` : slugify(duplicateName, 'page-copy');
    const duplicateDraft = {
      ...draft,
      name: duplicateName,
      slug: duplicateSlug,
      status: 'draft',
    };
    setSelectedId(null);
    setDraft(duplicateDraft);
    setDirty(true);
    setSlugTouched(true);
  };

  const handleDelete = async () => {
    if (!selectedId) {
      return;
    }
    if (!window.confirm('Delete this page? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    setFormError('');
    setStatusMessage('');
    try {
      await deletePageSetting(selectedId);
      setPages((prev) => {
        const next = Array.isArray(prev) ? prev.filter((item) => item.id !== selectedId) : [];
        if (next.length) {
          const nextSelection = next[0];
          setSelectedId(nextSelection.id);
          assignRecordToDraft(nextSelection);
        } else {
          setSelectedId(null);
          assignRecordToDraft(computeInitialDraft());
        }
        return next;
      });
      setMeta((prev) => {
        const previousTotal = typeof prev.total === 'number' ? prev.total : 0;
        return { ...prev, total: Math.max(0, previousTotal - 1) };
      });
      setDirty(false);
      setStatusMessage('Page deleted successfully.');
      window.setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      setFormError(err?.body?.message || err?.message || 'Unable to delete page configuration.');
    } finally {
      setDeleting(false);
    }
  };

  const handleGeneralChange = (event) => {
    const { name, value } = event.target;
    if (name === 'slug') {
      setSlugTouched(true);
      setDraft((prev) => ({ ...prev, slug: value }));
    } else if (name === 'name') {
      setDraft((prev) => {
        const next = { ...prev, name: value };
        if (!slugTouched) {
          next.slug = slugify(value, prev.slug || 'page');
        }
        return next;
      });
    } else {
      setDraft((prev) => ({ ...prev, [name]: value }));
    }
    setDirty(true);
  };

  const handleHeroChange = (field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
    setDirty(true);
  };

  const handleHeroSelectChange = (field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
    setDirty(true);
  };

  const handleSeoChange = (field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => ({ ...prev, seo: { ...prev.seo, [field]: value } }));
    setDirty(true);
  };

  const handleKeywordsChange = (event) => {
    const value = event.target.value;
    setKeywordsInput(value);
    const keywords = parseKeywords(value);
    setDraft((prev) => ({ ...prev, seo: { ...prev.seo, keywords } }));
    setDirty(true);
  };

  const handleRolesChange = (event) => {
    const value = event.target.value;
    setRolesInput(value);
    const roles = parseRoles(value, draft.allowedRoles);
    setDraft((prev) => ({ ...prev, allowedRoles: roles }));
    setDirty(true);
  };

  const handleCtaChange = (slot, field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => ({
      ...prev,
      callToAction: {
        ...prev.callToAction,
        [slot]: {
          ...prev.callToAction?.[slot],
          [field]: value,
        },
      },
    }));
    setDirty(true);
  };

  const handleNavigationChange = (target, index, field) => (event) => {
    const value = field === 'external' ? event.target.checked : event.target.value;
    setDraft((prev) => {
      const header = Array.isArray(prev.navigation?.header) ? [...prev.navigation.header] : [];
      const footer = Array.isArray(prev.navigation?.footer) ? [...prev.navigation.footer] : [];
      const list = target === 'header' ? header : footer;
      if (!list[index]) {
        return prev;
      }
      list[index] = { ...list[index], [field]: value };
      return {
        ...prev,
        navigation: {
          header,
          footer,
        },
      };
    });
    setDirty(true);
  };

  const handleNavigationAdd = (target) => () => {
    setDraft((prev) => {
      const header = Array.isArray(prev.navigation?.header) ? [...prev.navigation.header] : [];
      const footer = Array.isArray(prev.navigation?.footer) ? [...prev.navigation.footer] : [];
      const list = target === 'header' ? header : footer;
      list.push({
        id: `link-${target}-${Date.now()}`,
        label: '',
        url: '',
        external: false,
      });
      return {
        ...prev,
        navigation: {
          header,
          footer,
        },
      };
    });
    setDirty(true);
  };

  const handleNavigationRemove = (target, index) => () => {
    setDraft((prev) => {
      const header = Array.isArray(prev.navigation?.header) ? [...prev.navigation.header] : [];
      const footer = Array.isArray(prev.navigation?.footer) ? [...prev.navigation.footer] : [];
      const list = target === 'header' ? header : footer;
      list.splice(index, 1);
      return {
        ...prev,
        navigation: {
          header,
          footer,
        },
      };
    });
    setDirty(true);
  };

  const handleNavigationMove = (target, index, direction) => () => {
    setDraft((prev) => {
      const header = Array.isArray(prev.navigation?.header) ? [...prev.navigation.header] : [];
      const footer = Array.isArray(prev.navigation?.footer) ? [...prev.navigation.footer] : [];
      const list = target === 'header' ? header : footer;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= list.length) {
        return prev;
      }
      const temp = list[index];
      list[index] = list[nextIndex];
      list[nextIndex] = temp;
      return {
        ...prev,
        navigation: {
          header: header.map((item, order) => ({ ...item, order })),
          footer: footer.map((item, order) => ({ ...item, order })),
        },
      };
    });
    setDirty(true);
  };

  const handleSectionChange = (index, field) => (event) => {
    const value = field === 'enabled' ? event.target.checked : event.target.value;
    setDraft((prev) => {
      const sections = Array.isArray(prev.sections) ? [...prev.sections] : [];
      if (!sections[index]) {
        return prev;
      }
      sections[index] = { ...sections[index], [field]: value };
      return { ...prev, sections };
    });
    setDirty(true);
  };

  const handleSectionMediaChange = (index, field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => {
      const sections = Array.isArray(prev.sections) ? [...prev.sections] : [];
      if (!sections[index]) {
        return prev;
      }
      const media = { ...(sections[index].media ?? { type: 'image', url: '', altText: '' }) };
      media[field] = value;
      sections[index] = { ...sections[index], media };
      return { ...prev, sections };
    });
    setDirty(true);
  };

  const handleSectionCtaChange = (index, field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => {
      const sections = Array.isArray(prev.sections) ? [...prev.sections] : [];
      if (!sections[index]) {
        return prev;
      }
      const cta = { ...(sections[index].cta ?? { label: '', url: '', external: false }) };
      cta[field] = value;
      sections[index] = { ...sections[index], cta };
      return { ...prev, sections };
    });
    setDirty(true);
  };

  const handleSectionRemove = (index) => () => {
    setDraft((prev) => {
      const sections = Array.isArray(prev.sections) ? [...prev.sections] : [];
      sections.splice(index, 1);
      return { ...prev, sections };
    });
    setDirty(true);
  };

  const handleSectionReorder = (index, direction) => () => {
    setDraft((prev) => {
      const sections = Array.isArray(prev.sections) ? [...prev.sections] : [];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= sections.length) {
        return prev;
      }
      const temp = sections[index];
      sections[index] = sections[nextIndex];
      sections[nextIndex] = temp;
      return {
        ...prev,
        sections: sections.map((section, order) => ({ ...section, order })),
      };
    });
    setDirty(true);
  };

  const handleSectionAdd = () => {
    setDraft((prev) => {
      const sections = Array.isArray(prev.sections) ? [...prev.sections] : [];
      sections.push({
        id: `section-${Date.now()}`,
        title: 'New content block',
        type: 'custom',
        summary: '',
        enabled: true,
        order: sections.length,
        media: { type: 'image', url: '', altText: '' },
        cta: { label: '', url: '', external: false },
      });
      return { ...prev, sections };
    });
    setDirty(true);
  };

  const handleThemeChange = (field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => ({ ...prev, theme: { ...prev.theme, [field]: value } }));
    setDirty(true);
  };

  const handleReset = () => {
    if (selectedId) {
      const selectedRecord = pages.find((item) => item.id === selectedId);
      if (selectedRecord) {
        assignRecordToDraft(selectedRecord);
        return;
      }
    }
    assignRecordToDraft(computeInitialDraft());
  };

  const handleRefresh = () => {
    loadPages({ force: true });
  };

  const handlePreview = useCallback(() => {
    if (!previewUrl) {
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(previewUrl, '_blank', 'noreferrer');
    }
  }, [previewUrl]);

  const handleSave = async () => {
    setFormError('');
    setStatusMessage('');
    setSaving(true);
    try {
      const payload = {
        ...draft,
        seo: {
          ...draft.seo,
          keywords: parseKeywords(keywordsInput),
        },
        allowedRoles: parseRoles(rolesInput, draft.allowedRoles),
      };
      let response;
      if (selectedId) {
        response = await updatePageSetting(selectedId, payload);
      } else {
        response = await createPageSetting(payload);
      }
      const normalised = normaliseRecord(response, session);
      setDraft(normalised);
      setKeywordsInput(normalised.seo.keywords.join(', '));
      setRolesInput(normalised.allowedRoles.join(', '));
      setDirty(false);
      setSelectedId(response.id);
      setPages((prev) => {
        const items = Array.isArray(prev) ? [...prev] : [];
        const index = items.findIndex((item) => item.id === response.id);
        if (index >= 0) {
          items[index] = response;
        } else {
          items.unshift(response);
        }
        return items;
      });
      setMeta((prev) => {
        const previousTotal = typeof prev.total === 'number' ? prev.total : 0;
        const nextTotal = selectedId ? previousTotal : previousTotal + 1;
        return { ...prev, total: nextTotal };
      });
      setStatusMessage('Page configuration saved successfully.');
      window.setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      setFormError(err?.body?.message || err?.message || 'Unable to save page configuration.');
    } finally {
      setSaving(false);
    }
  };

  const disabledSave = disableActions || !draft.name?.trim();

  return (
    <section
      id="admin-pages-settings"
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Pages workspace</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Configure Gigvora pages with editable hero content, SEO, navigation, and publishing controls.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              {loading ? 'Loading…' : `Total ${meta.total ?? pages.length} pages`}
            </span>
            {dirty ? (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Unsaved changes
              </span>
            ) : null}
            {reloading ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                <ArrowPathIcon className="h-4 w-4 animate-spin" /> Syncing
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={disableActions}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className="mr-2 h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={disableActions}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <DocumentDuplicateIcon className="mr-2 h-4 w-4" /> Duplicate
          </button>
          <button
            type="button"
            onClick={handleCreateNew}
            disabled={disableActions}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> New page
          </button>
          {previewUrl ? (
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> Preview
            </button>
          ) : null}
          {selectedId ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <TrashIcon className="mr-2 h-4 w-4" /> Delete
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(240px,280px)_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Configured pages</h3>
            {error ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>
            ) : null}
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((key) => (
                    <div key={key} className="h-12 animate-pulse rounded-xl bg-slate-200/60" />
                  ))}
                </div>
              ) : pages.length ? (
                pages.map((page) => {
                  const isActive = page.id === selectedId;
                  const badgeClass = STATUS_BADGE_CLASSNAMES[page.status] ?? STATUS_BADGE_CLASSNAMES.draft;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => handleSelectPage(page)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-blue-300 bg-white shadow-sm'
                          : 'border-transparent bg-white/80 hover:border-blue-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">{page.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
                        >
                          {page.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{page.slug}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                        Updated {formatRelative(page.updatedAt)}
                      </p>
                    </button>
                  );
                })
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500">
                  No pages configured yet. Create a page to get started.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <h4 className="text-sm font-semibold text-slate-800">Role access</h4>
            <p className="mt-2 text-xs text-slate-500">Roles allowed to modify page settings.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from(authorisedRoles).map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </aside>
        <div className="space-y-6">
          {formError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>
          ) : null}
          {statusMessage ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircleIcon className="h-5 w-5" /> {statusMessage}
            </div>
          ) : null}

          <div id="page-settings-general" className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Page name</span>
              <input
                name="name"
                value={draft.name}
                onChange={handleGeneralChange}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Gigvora Labs"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Slug</span>
              <input
                name="slug"
                value={draft.slug}
                onChange={handleGeneralChange}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="gigvora-labs"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Status</span>
              <select
                name="status"
                value={draft.status}
                onChange={handleGeneralChange}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Visibility</span>
              <select
                name="visibility"
                value={draft.visibility}
                onChange={handleGeneralChange}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-800">Layout</span>
              <select
                name="layout"
                value={draft.layout}
                onChange={handleGeneralChange}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {LAYOUT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
              <span className="font-semibold text-slate-800">Description</span>
              <textarea
                name="description"
                value={draft.description}
                onChange={handleGeneralChange}
                rows={3}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Short description for internal reference"
              />
            </label>
          </div>
          <div id="page-settings-hero" className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Hero & header</h3>
                <p className="text-xs text-slate-500">Primary messaging, media, and alignment.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Alignment: {draft.hero.alignment}
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Headline</span>
                <input
                  value={draft.hero.title}
                  onChange={handleHeroChange('title')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Build the future of work with Gigvora"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Subheadline</span>
                <input
                  value={draft.hero.subtitle}
                  onChange={handleHeroChange('subtitle')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Highlight the value proposition"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Media type</span>
                <select
                  value={draft.hero.mediaType}
                  onChange={handleHeroSelectChange('mediaType')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="embed">Embed</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Media URL</span>
                <input
                  value={draft.hero.mediaUrl}
                  onChange={handleHeroChange('mediaUrl')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="https://cdn.gigvora.com/hero.jpg"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Background image</span>
                <input
                  value={draft.hero.backgroundImageUrl}
                  onChange={handleHeroChange('backgroundImageUrl')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="https://cdn.gigvora.com/background.png"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Accent colour</span>
                <input
                  value={draft.hero.accentColor}
                  onChange={handleHeroChange('accentColor')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="#2563eb"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Alignment</span>
                <select
                  value={draft.hero.alignment}
                  onChange={handleHeroSelectChange('alignment')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Badge text</span>
                <input
                  value={draft.hero.badge}
                  onChange={handleHeroChange('badge')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Featured"
                />
              </label>
            </div>
          </div>
          <div id="page-settings-seo" className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">SEO & sharing</h3>
                <p className="text-xs text-slate-500">Optimise metadata for search and social previews.</p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">SEO title</span>
                <input
                  value={draft.seo.title}
                  onChange={handleSeoChange('title')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Gigvora Labs — Future of work innovation"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">SEO description</span>
                <textarea
                  value={draft.seo.description}
                  onChange={handleSeoChange('description')}
                  rows={3}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Short description shown on search and social cards"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Keywords</span>
                <input
                  value={keywordsInput}
                  onChange={handleKeywordsChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="talent marketplace, future of work"
                />
                <span className="text-xs text-slate-500">Comma separated — up to 30 entries.</span>
              </label>
            </div>
          </div>
          <div id="page-settings-cta" className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Navigation & actions</h3>
                <p className="text-xs text-slate-500">Manage primary calls-to-action and header/footer links.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Primary CTA label</span>
                <input
                  value={draft.callToAction.primary?.label ?? ''}
                  onChange={handleCtaChange('primary', 'label')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Join the waitlist"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Primary CTA URL</span>
                <input
                  value={draft.callToAction.primary?.url ?? ''}
                  onChange={handleCtaChange('primary', 'url')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="https://gigvora.com/waitlist"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Secondary CTA label</span>
                <input
                  value={draft.callToAction.secondary?.label ?? ''}
                  onChange={handleCtaChange('secondary', 'label')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Book a demo"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Secondary CTA URL</span>
                <input
                  value={draft.callToAction.secondary?.url ?? ''}
                  onChange={handleCtaChange('secondary', 'url')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="https://gigvora.com/demo"
                />
              </label>
            </div>
            <div id="page-settings-navigation" className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white bg-white p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Header links</h4>
                  <button
                    type="button"
                    onClick={handleNavigationAdd('header')}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <PlusIcon className="mr-1 h-3 w-3" /> Link
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {draft.navigation.header.length ? (
                    draft.navigation.header.map((link, index) => (
                      <div key={link.id ?? index} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Link {index + 1}</p>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleNavigationMove('header', index, -1)}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                              disabled={index === 0}
                              aria-label="Move link up"
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleNavigationMove('header', index, 1)}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                              disabled={index === draft.navigation.header.length - 1}
                              aria-label="Move link down"
                            >
                              <ArrowDownIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleNavigationRemove('header', index)}
                              className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <input
                            value={link.label}
                            onChange={handleNavigationChange('header', index, 'label')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="Label"
                          />
                          <input
                            value={link.url}
                            onChange={handleNavigationChange('header', index, 'url')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="https://"
                          />
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={Boolean(link.external)}
                              onChange={handleNavigationChange('header', index, 'external')}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Open in new tab
                          </label>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
                      No header links configured.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Footer links</h4>
                  <button
                    type="button"
                    onClick={handleNavigationAdd('footer')}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <PlusIcon className="mr-1 h-3 w-3" /> Link
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {draft.navigation.footer.length ? (
                    draft.navigation.footer.map((link, index) => (
                      <div key={link.id ?? index} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Link {index + 1}</p>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleNavigationMove('footer', index, -1)}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                              disabled={index === 0}
                              aria-label="Move link up"
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleNavigationMove('footer', index, 1)}
                              className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                              disabled={index === draft.navigation.footer.length - 1}
                              aria-label="Move link down"
                            >
                              <ArrowDownIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleNavigationRemove('footer', index)}
                              className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <input
                            value={link.label}
                            onChange={handleNavigationChange('footer', index, 'label')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="Label"
                          />
                          <input
                            value={link.url}
                            onChange={handleNavigationChange('footer', index, 'url')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="https://"
                          />
                          <label className="flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={Boolean(link.external)}
                              onChange={handleNavigationChange('footer', index, 'external')}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Open in new tab
                          </label>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-500">
                      No footer links configured.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div id="page-settings-sections" className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Content blocks</h3>
                <p className="text-xs text-slate-500">Add hero alternates, testimonials, metrics, and custom sections.</p>
              </div>
              <button
                type="button"
                onClick={handleSectionAdd}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                <PlusIcon className="mr-1 h-3 w-3" /> Block
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {draft.sections.length ? (
                draft.sections.map((section, index) => (
                  <div key={section.id ?? index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{section.title || `Block ${index + 1}`}</h4>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Type: {section.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleSectionReorder(index, -1)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                            disabled={index === 0}
                            aria-label="Move block up"
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleSectionReorder(index, 1)}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                            disabled={index === draft.sections.length - 1}
                            aria-label="Move block down"
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(section.enabled)}
                            onChange={handleSectionChange(index, 'enabled')}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          Enabled
                        </label>
                        <button
                          type="button"
                          onClick={handleSectionRemove(index)}
                          className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Title</span>
                        <input
                          value={section.title}
                          onChange={handleSectionChange(index, 'title')}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="Section title"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Section type</span>
                        <select
                          value={section.type}
                          onChange={handleSectionChange(index, 'type')}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          {SECTION_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700 md:col-span-2">
                        <span className="font-semibold text-slate-800">Summary</span>
                        <textarea
                          value={section.summary}
                          onChange={handleSectionChange(index, 'summary')}
                          rows={3}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="Add supporting copy or guidance"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Media URL</span>
                        <input
                          value={section.media?.url ?? ''}
                          onChange={handleSectionMediaChange(index, 'url')}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="https://"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Media alt text</span>
                        <input
                          value={section.media?.altText ?? ''}
                          onChange={handleSectionMediaChange(index, 'altText')}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="Describe the media"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">CTA label</span>
                        <input
                          value={section.cta?.label ?? ''}
                          onChange={handleSectionCtaChange(index, 'label')}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="Learn more"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">CTA URL</span>
                        <input
                          value={section.cta?.url ?? ''}
                          onChange={handleSectionCtaChange(index, 'url')}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="https://"
                        />
                      </label>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
                  No content blocks configured yet.
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div id="page-settings-theme" className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-base font-semibold text-slate-900">Theme</h3>
              <p className="mt-1 text-xs text-slate-500">Adjust accent, background, and text colours.</p>
              <div className="mt-4 space-y-3">
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">Accent colour</span>
                  <input
                    value={draft.theme.accent}
                    onChange={handleThemeChange('accent')}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="#2563eb"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">Background colour</span>
                  <input
                    value={draft.theme.background}
                    onChange={handleThemeChange('background')}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="#ffffff"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-800">Text colour</span>
                  <input
                    value={draft.theme.text}
                    onChange={handleThemeChange('text')}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="#0f172a"
                  />
                </label>
              </div>
            </div>
            <div id="page-settings-permissions" className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <h3 className="text-base font-semibold text-slate-900">Role restrictions</h3>
              <p className="mt-1 text-xs text-slate-500">Comma separated list of roles that can edit pages.</p>
              <input
                value={rolesInput}
                onChange={handleRolesChange}
                className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="admin, marketing, ops"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={disableActions}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset form
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={disabledSave}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
