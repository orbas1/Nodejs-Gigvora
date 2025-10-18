import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { withDefaults, clonePreferences } from './defaults.js';
import BasicsForm from './forms/BasicsForm.jsx';
import BrandForm from './forms/BrandForm.jsx';
import HeroForm from './forms/HeroForm.jsx';
import OffersForm from './forms/OffersForm.jsx';
import ProofForm from './forms/ProofForm.jsx';
import ContactForm from './forms/ContactForm.jsx';
import SeoForm from './forms/SeoForm.jsx';
import SocialForm from './forms/SocialForm.jsx';
import WebsitePreferencesPreview from './WebsitePreferencesPreview.jsx';
import { saveWebsitePreferences } from '../../services/websitePreferences.js';

const SECTION_CONFIG = [
  { id: 'basics', label: 'Basics' },
  { id: 'brand', label: 'Brand' },
  { id: 'hero', label: 'Hero' },
  { id: 'offers', label: 'Offers' },
  { id: 'proof', label: 'Proof' },
  { id: 'contact', label: 'Contact' },
  { id: 'seo', label: 'Seo' },
  { id: 'social', label: 'Social' },
];

export default function WebsitePreferencesDesigner({
  open,
  initialPreferences,
  initialSection = 'basics',
  userId,
  canEdit,
  onClose,
  onSaved,
}) {
  const [draft, setDraft] = useState(() => withDefaults(initialPreferences));
  const [activeSection, setActiveSection] = useState(initialSection);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(initialPreferences?.updatedAt ?? null);

  useEffect(() => {
    if (open) {
      setDraft(withDefaults(initialPreferences));
      setActiveSection(initialSection);
      setError(null);
      setSavedAt(initialPreferences?.updatedAt ?? null);
    }
  }, [open, initialPreferences, initialSection]);

  const sectionComponent = useMemo(() => {
    switch (activeSection) {
      case 'brand':
        return (
          <BrandForm theme={draft.theme} onChange={(next) => setDraft((current) => ({ ...current, theme: next }))} canEdit={canEdit} />
        );
      case 'hero':
        return (
          <HeroForm
            hero={draft.hero}
            about={draft.about}
            onHeroChange={(next) => setDraft((current) => ({ ...current, hero: next }))}
            onAboutChange={(next) => setDraft((current) => ({ ...current, about: next }))}
            canEdit={canEdit}
          />
        );
      case 'offers':
        return (
          <OffersForm
            services={draft.services}
            onChange={(next) => setDraft((current) => ({ ...current, services: { ...current.services, ...next } }))}
            canEdit={canEdit}
          />
        );
      case 'proof':
        return (
          <ProofForm
            testimonials={draft.testimonials}
            gallery={draft.gallery}
            onTestimonialsChange={(next) => setDraft((current) => ({ ...current, testimonials: { ...current.testimonials, ...next } }))}
            onGalleryChange={(next) => setDraft((current) => ({ ...current, gallery: { ...current.gallery, ...next } }))}
            canEdit={canEdit}
          />
        );
      case 'contact':
        return (
          <ContactForm
            contact={draft.contact}
            onChange={(next) => setDraft((current) => ({ ...current, contact: next }))}
            canEdit={canEdit}
          />
        );
      case 'seo':
        return (
          <SeoForm seo={draft.seo} onChange={(next) => setDraft((current) => ({ ...current, seo: next }))} canEdit={canEdit} />
        );
      case 'social':
        return (
          <SocialForm
            social={draft.social}
            onChange={(next) => setDraft((current) => ({ ...current, social: { ...current.social, ...next } }))}
            canEdit={canEdit}
          />
        );
      case 'basics':
      default:
        return (
          <BasicsForm
            settings={draft.settings}
            navigation={draft.navigation}
            onSettingsChange={(next) => setDraft((current) => ({ ...current, settings: next }))}
            onNavigationChange={(next) => setDraft((current) => ({ ...current, navigation: { ...current.navigation, ...next } }))}
            canEdit={canEdit}
          />
        );
    }
  }, [activeSection, draft, canEdit]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = clonePreferences(draft);
      const response = await saveWebsitePreferences(userId, payload);
      setDraft(withDefaults(response));
      setSavedAt(response?.updatedAt ?? new Date().toISOString());
      onSaved?.(response);
    } catch (caught) {
      const message = caught?.response?.data?.message ?? caught?.message ?? 'Unable to save preferences.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(withDefaults(initialPreferences));
    setError(null);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={saving ? () => {} : onClose}>
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

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-4xl bg-white shadow-2xl">
                <div className="flex w-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">Website designer</Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-1 overflow-hidden">
                    <nav className="hidden w-44 shrink-0 border-r border-slate-200 bg-slate-50/80 px-4 py-6 md:block">
                      <ul className="space-y-2 text-sm font-medium text-slate-600">
                        {SECTION_CONFIG.map((section) => (
                          <li key={section.id}>
                            <button
                              type="button"
                              onClick={() => setActiveSection(section.id)}
                              className={`w-full rounded-xl px-3 py-2 text-left ${
                                activeSection === section.id
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : 'hover:bg-white hover:text-slate-900'
                              }`}
                            >
                              {section.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                    <div className="flex-1 overflow-y-auto bg-slate-50/60 px-6 py-6">
                      {sectionComponent}
                    </div>
                    <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-white px-5 py-6 xl:block">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Preview</p>
                      <div className="mt-4 h-[calc(100%-2rem)] overflow-y-auto">
                        <WebsitePreferencesPreview preferences={draft} />
                      </div>
                    </aside>
                  </div>
                  <div className="border-t border-slate-200 bg-white px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        {saving ? (
                          <span className="inline-flex items-center gap-2 text-slate-500">
                            <ArrowPathIcon className="h-4 w-4 animate-spin" /> Saving...
                          </span>
                        ) : savedAt ? (
                          <span className="inline-flex items-center gap-2 text-emerald-600">
                            <CheckCircleIcon className="h-4 w-4" /> Updated
                          </span>
                        ) : null}
                        {error ? <span className="text-rose-500">{error}</span> : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleReset}
                          disabled={saving}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={!canEdit || saving}
                          className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Save
                        </button>
                      </div>
                    </div>
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
