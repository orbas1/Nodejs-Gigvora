import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const DEFAULT_SETTINGS = Object.freeze({
  heroHeadline: '',
  heroSubheadline: '',
  coverImageUrl: '',
  coverVideoUrl: '',
  brandAccentColor: '',
  defaultVisibility: 'public',
  allowPublicDownload: false,
  autoShareToFeed: true,
  showMetrics: true,
  showTestimonials: true,
  showContactButton: true,
  contactEmail: '',
  schedulingLink: '',
  customDomain: '',
  previewBasePath: '',
});

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

function isValidEmail(value) {
  if (!value) {
    return true;
  }
  return /.+@.+\..+/.test(value);
}

export default function PortfolioSettingsDialog({ open, settings, canEdit, saving, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        heroHeadline: settings?.heroHeadline ?? '',
        heroSubheadline: settings?.heroSubheadline ?? '',
        coverImageUrl: settings?.coverImageUrl ?? '',
        coverVideoUrl: settings?.coverVideoUrl ?? '',
        brandAccentColor: settings?.brandAccentColor ?? '',
        defaultVisibility: settings?.defaultVisibility ?? 'public',
        allowPublicDownload: Boolean(settings?.allowPublicDownload ?? false),
        autoShareToFeed: Boolean(settings?.autoShareToFeed ?? true),
        showMetrics: Boolean(settings?.showMetrics ?? true),
        showTestimonials: Boolean(settings?.showTestimonials ?? true),
        showContactButton: Boolean(settings?.showContactButton ?? true),
        contactEmail: settings?.contactEmail ?? '',
        schedulingLink: settings?.schedulingLink ?? '',
        customDomain: settings?.customDomain ?? '',
        previewBasePath: settings?.previewBasePath ?? '',
      });
      setError(null);
      setSubmitting(false);
    } else {
      setForm(DEFAULT_SETTINGS);
      setError(null);
      setSubmitting(false);
    }
  }, [open, settings]);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }
    if (!isValidEmail(form.contactEmail)) {
      setError('Enter a valid contact email or leave the field blank.');
      return;
    }
    if (!isValidUrl(form.coverImageUrl) || !isValidUrl(form.coverVideoUrl)) {
      setError('Cover media links must use HTTP or HTTPS.');
      return;
    }
    if (form.schedulingLink && !isValidUrl(form.schedulingLink)) {
      setError('Scheduling link must be a valid HTTP(S) URL.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        heroHeadline: form.heroHeadline?.trim() || null,
        heroSubheadline: form.heroSubheadline?.trim() || null,
        coverImageUrl: form.coverImageUrl?.trim() || null,
        coverVideoUrl: form.coverVideoUrl?.trim() || null,
        brandAccentColor: form.brandAccentColor?.trim() || null,
        defaultVisibility: form.defaultVisibility,
        allowPublicDownload: Boolean(form.allowPublicDownload),
        autoShareToFeed: Boolean(form.autoShareToFeed),
        showMetrics: Boolean(form.showMetrics),
        showTestimonials: Boolean(form.showTestimonials),
        showContactButton: Boolean(form.showContactButton),
        contactEmail: form.contactEmail?.trim() || null,
        schedulingLink: form.schedulingLink?.trim() || null,
        customDomain: form.customDomain?.trim() || null,
        previewBasePath: form.previewBasePath?.trim() || null,
      });
    } catch (err) {
      console.error('Failed to update portfolio settings', err);
      setError(err?.message || 'Unable to update portfolio settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const disableClose = saving || submitting;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={disableClose ? () => {} : onClose}>
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl">
                  <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">Settings</Dialog.Title>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={disableClose}
                      >
                        <ArrowUturnLeftIcon className="h-4 w-4" /> Close
                      </button>
                    </div>

                    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                      <section className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700" htmlFor="settings-hero-headline">
                            Hero headline
                          </label>
                          <input
                            id="settings-hero-headline"
                            name="heroHeadline"
                            type="text"
                            value={form.heroHeadline}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700" htmlFor="settings-hero-subheadline">
                            Hero subheadline
                          </label>
                          <textarea
                            id="settings-hero-subheadline"
                            name="heroSubheadline"
                            rows={2}
                            value={form.heroSubheadline}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-semibold text-slate-700" htmlFor="settings-cover-image">
                              Cover image URL
                            </label>
                            <input
                              id="settings-cover-image"
                              name="coverImageUrl"
                              type="url"
                              value={form.coverImageUrl}
                              onChange={handleChange}
                              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-700" htmlFor="settings-cover-video">
                              Cover video URL
                            </label>
                            <input
                              id="settings-cover-video"
                              name="coverVideoUrl"
                              type="url"
                              value={form.coverVideoUrl}
                              onChange={handleChange}
                              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700" htmlFor="settings-brand-color">
                            Brand accent colour
                          </label>
                          <input
                            id="settings-brand-color"
                            name="brandAccentColor"
                            type="text"
                            value={form.brandAccentColor}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </section>

                      <section className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-semibold text-slate-700" htmlFor="settings-default-visibility">
                            Default visibility
                          </label>
                          <select
                            id="settings-default-visibility"
                            name="defaultVisibility"
                            value={form.defaultVisibility}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          >
                            <option value="public">Public</option>
                            <option value="network">Network</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                          <label className="text-sm font-semibold text-slate-700">Sharing</label>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              name="allowPublicDownload"
                              checked={form.allowPublicDownload}
                              onChange={handleChange}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Allow downloads
                          </label>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              name="autoShareToFeed"
                              checked={form.autoShareToFeed}
                              onChange={handleChange}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Auto share
                          </label>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              name="showMetrics"
                              checked={form.showMetrics}
                              onChange={handleChange}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Show metrics
                          </label>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              name="showTestimonials"
                              checked={form.showTestimonials}
                              onChange={handleChange}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Show testimonials
                          </label>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              name="showContactButton"
                              checked={form.showContactButton}
                              onChange={handleChange}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Show contact button
                          </label>
                        </div>
                      </section>

                      <section className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-semibold text-slate-700" htmlFor="settings-contact-email">
                            Contact email
                          </label>
                          <input
                            id="settings-contact-email"
                            name="contactEmail"
                            type="email"
                            value={form.contactEmail}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700" htmlFor="settings-scheduling-link">
                            Scheduling link
                          </label>
                          <input
                            id="settings-scheduling-link"
                            name="schedulingLink"
                            type="url"
                            value={form.schedulingLink}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700" htmlFor="settings-custom-domain">
                            Custom domain
                          </label>
                          <input
                            id="settings-custom-domain"
                            name="customDomain"
                            type="text"
                            value={form.customDomain}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700" htmlFor="settings-preview-base">
                            Preview base path
                          </label>
                          <input
                            id="settings-preview-base"
                            name="previewBasePath"
                            type="text"
                            value={form.previewBasePath}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </section>

                      {error ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
                      ) : null}
                    </div>

                    <div className="border-t border-slate-200 px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          disabled={saving || submitting || !canEdit}
                          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {saving || submitting ? 'Saving…' : 'Save'}
                        </button>
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

PortfolioSettingsDialog.propTypes = {
  open: PropTypes.bool,
  settings: PropTypes.shape({
    heroHeadline: PropTypes.string,
    heroSubheadline: PropTypes.string,
    coverImageUrl: PropTypes.string,
    coverVideoUrl: PropTypes.string,
    brandAccentColor: PropTypes.string,
    defaultVisibility: PropTypes.string,
    allowPublicDownload: PropTypes.bool,
    autoShareToFeed: PropTypes.bool,
    showMetrics: PropTypes.bool,
    showTestimonials: PropTypes.bool,
    showContactButton: PropTypes.bool,
    contactEmail: PropTypes.string,
    schedulingLink: PropTypes.string,
    customDomain: PropTypes.string,
    previewBasePath: PropTypes.string,
  }),
  canEdit: PropTypes.bool,
  saving: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
};

PortfolioSettingsDialog.defaultProps = {
  open: false,
  settings: null,
  canEdit: false,
  saving: false,
  onClose: () => {},
  onSave: () => {},
};
