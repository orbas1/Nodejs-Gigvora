import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
];

const VISIBILITY_OPTIONS = [
  { value: 'internal', label: 'Internal only' },
  { value: 'client', label: 'Client shared' },
  { value: 'public', label: 'Public' },
];

function normaliseTags(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function TimelinePostComposer({ open, initialPost, availableChannels, onClose, onSubmit, submitting, errorMessage }) {
  const [formState, setFormState] = useState({
    title: '',
    status: 'draft',
    visibility: 'internal',
    scheduledAt: '',
    excerpt: '',
    content: '',
    distributionChannels: [],
    tags: '',
    heroImageUrl: '',
    thumbnailUrl: '',
    attachments: [],
  });

  useEffect(() => {
    if (!initialPost) {
      setFormState({
        title: '',
        status: 'draft',
        visibility: 'internal',
        scheduledAt: '',
        excerpt: '',
        content: '',
        distributionChannels: [],
        tags: '',
        heroImageUrl: '',
        thumbnailUrl: '',
        attachments: [],
      });
      return;
    }
    setFormState({
      title: initialPost.title || '',
      status: initialPost.status || 'draft',
      visibility: initialPost.visibility || 'internal',
      scheduledAt: initialPost.scheduledAt ? new Date(initialPost.scheduledAt).toISOString().slice(0, 16) : '',
      excerpt: initialPost.excerpt || '',
      content: initialPost.content || '',
      distributionChannels: initialPost.distributionChannels || [],
      tags: (initialPost.tags || []).join(', '),
      heroImageUrl: initialPost.heroImageUrl || '',
      thumbnailUrl: initialPost.thumbnailUrl || '',
      attachments: initialPost.attachments || [],
    });
  }, [initialPost]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleChannelToggle = (channel) => {
    setFormState((previous) => {
      const hasChannel = previous.distributionChannels.includes(channel);
      const nextChannels = hasChannel
        ? previous.distributionChannels.filter((item) => item !== channel)
        : [...previous.distributionChannels, channel];
      return { ...previous, distributionChannels: nextChannels };
    });
  };

  const handleAttachmentChange = (index, field, value) => {
    setFormState((previous) => {
      const nextAttachments = previous.attachments.map((attachment, attachmentIndex) =>
        attachmentIndex === index ? { ...attachment, [field]: value } : attachment,
      );
      return { ...previous, attachments: nextAttachments };
    });
  };

  const handleAddAttachment = () => {
    setFormState((previous) => ({
      ...previous,
      attachments: [...previous.attachments, { id: `att-${previous.attachments.length + 1}`, label: '', type: '', url: '' }],
    }));
  };

  const handleRemoveAttachment = (index) => {
    setFormState((previous) => ({
      ...previous,
      attachments: previous.attachments.filter((_, attachmentIndex) => attachmentIndex !== index),
    }));
  };

  const parsedScheduledAt = useMemo(() => {
    if (!formState.scheduledAt) return undefined;
    try {
      return new Date(formState.scheduledAt);
    } catch (error) {
      return undefined;
    }
  }, [formState.scheduledAt]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      title: formState.title,
      status: formState.status,
      visibility: formState.visibility,
      scheduledAt: parsedScheduledAt ? parsedScheduledAt.toISOString() : undefined,
      excerpt: formState.excerpt,
      content: formState.content,
      distributionChannels: formState.distributionChannels,
      tags: normaliseTags(formState.tags),
      heroImageUrl: formState.heroImageUrl || undefined,
      thumbnailUrl: formState.thumbnailUrl || undefined,
      attachments: formState.attachments,
    };
    onSubmit(payload);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={submitting ? () => {} : onClose}>
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

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-end p-6">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-slate-900">
                        {initialPost ? 'Edit post' : 'New post'}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-600">Draft copy, timing, and channels.</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      disabled={submitting}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </header>

                  <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Title</span>
                        <input
                          required
                          type="text"
                          name="title"
                          value={formState.title}
                          onChange={handleFieldChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Status</span>
                        <select
                          name="status"
                          value={formState.status}
                          onChange={handleFieldChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {formState.status === 'scheduled' ? (
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Scheduled for</span>
                        <input
                          type="datetime-local"
                          name="scheduledAt"
                          value={formState.scheduledAt}
                          onChange={handleFieldChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          required
                        />
                      </label>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Visibility</span>
                        <select
                          name="visibility"
                          value={formState.visibility}
                          onChange={handleFieldChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        >
                          {VISIBILITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Tags</span>
                        <input
                          type="text"
                          name="tags"
                          value={formState.tags}
                          onChange={handleFieldChange}
                          placeholder="Product, Launch, Partnership"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <span className="text-[11px] text-slate-400">Comma separated.</span>
                      </label>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Excerpt</span>
                      <textarea
                        name="excerpt"
                        value={formState.excerpt}
                        onChange={handleFieldChange}
                        rows={2}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Body content</span>
                      <textarea
                        name="content"
                        value={formState.content}
                        onChange={handleFieldChange}
                        rows={6}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>

                    <div className="space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Distribution channels</span>
                      <div className="flex flex-wrap gap-2">
                        {availableChannels.map((channel) => {
                          const active = formState.distributionChannels.includes(channel);
                          return (
                            <button
                              type="button"
                              key={channel}
                              onClick={() => handleChannelToggle(channel)}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                active
                                  ? 'border-accent bg-accent/10 text-accent'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {channel.replace(/_/g, ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Hero image URL</span>
                        <input
                          type="url"
                          name="heroImageUrl"
                          value={formState.heroImageUrl}
                          onChange={handleFieldChange}
                          placeholder="https://example.com/banner.jpg"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Thumbnail URL</span>
                        <input
                          type="url"
                          name="thumbnailUrl"
                          value={formState.thumbnailUrl}
                          onChange={handleFieldChange}
                          placeholder="https://example.com/thumb.jpg"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Attachments</span>
                        <button
                          type="button"
                          onClick={handleAddAttachment}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <PlusIcon className="h-4 w-4" /> Add file
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formState.attachments.length ? (
                          formState.attachments.map((attachment, index) => (
                            <div
                              key={attachment.id || index}
                              className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]"
                            >
                              <input
                                type="text"
                                value={attachment.label || ''}
                                onChange={(event) => handleAttachmentChange(index, 'label', event.target.value)}
                                placeholder="Attachment label"
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                              <input
                                type="text"
                                value={attachment.type || ''}
                                onChange={(event) => handleAttachmentChange(index, 'type', event.target.value)}
                                placeholder="Type (image, pdf, link)"
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              />
                              <div className="flex items-center gap-2 sm:col-span-3">
                                <input
                                  type="url"
                                  value={attachment.url || ''}
                                  onChange={(event) => handleAttachmentChange(index, 'url', event.target.value)}
                                  placeholder="https://"
                                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(index)}
                                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">No files.</p>
                        )}
                      </div>
                    </div>

                    {errorMessage ? <p className="text-sm font-semibold text-rose-600">{errorMessage}</p> : null}
                  </div>

                  <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={submitting}
                    >
                      {submitting ? 'Saving…' : initialPost ? 'Save changes' : 'Publish post'}
                    </button>
                  </footer>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

TimelinePostComposer.propTypes = {
  open: PropTypes.bool.isRequired,
  initialPost: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    status: PropTypes.string,
    visibility: PropTypes.string,
    scheduledAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    excerpt: PropTypes.string,
    content: PropTypes.string,
    distributionChannels: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    heroImageUrl: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
        type: PropTypes.string,
        url: PropTypes.string,
      }),
    ),
  }),
  availableChannels: PropTypes.arrayOf(PropTypes.string),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  errorMessage: PropTypes.string,
};

TimelinePostComposer.defaultProps = {
  initialPost: null,
  availableChannels: [],
  submitting: false,
  errorMessage: null,
};

export default TimelinePostComposer;
