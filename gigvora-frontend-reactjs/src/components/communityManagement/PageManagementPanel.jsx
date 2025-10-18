import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import pagesService from '../../services/pages.js';

const PAGE_MANAGER_ROLES = new Set(['owner', 'admin']);
const PAGE_VISIBILITIES = ['public', 'members', 'private'];
const PAGE_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
const PAGE_POST_VISIBILITIES = ['public', 'followers', 'members', 'private'];
const PAGE_INVITE_ROLES = ['owner', 'admin', 'editor', 'moderator', 'author'];
const PAGE_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired'];
const PAGE_MEMBER_ROLES = ['owner', 'admin', 'editor', 'moderator', 'author', 'viewer'];
const PAGE_MEMBER_STATUSES = ['active', 'invited', 'pending', 'suspended'];

function formatDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (input) => `${input}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseJsonInput(value, fallback = null) {
  if (!value || value.trim() === '') {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error('Provide valid JSON or leave blank.');
  }
}

function Modal({ open, title, onClose, children, footer, size = 'max-w-3xl' }) {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 px-4 py-10">
      <div className={`w-full ${size} overflow-hidden rounded-3xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  footer: PropTypes.node,
  size: PropTypes.string,
};

Modal.defaultProps = {
  children: null,
  footer: null,
  size: 'max-w-3xl',
};

function Fieldset({ legend, description, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-slate-800">{legend}</legend>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      {children}
    </fieldset>
  );
}

Fieldset.propTypes = {
  legend: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Fieldset.defaultProps = {
  description: null,
};

function PageFormModal({ open, mode, page, submitting, error, onClose, onSubmit }) {
  const [values, setValues] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    websiteUrl: '',
    contactEmail: '',
    callToAction: '',
    visibility: 'public',
    avatarColor: '#0f172a',
    bannerImageUrl: '',
    settings: '',
    metadata: '',
  });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLocalError(null);
    if (mode === 'edit' && page) {
      setValues({
        name: page.name ?? '',
        slug: page.slug ?? '',
        description: page.description ?? '',
        category: page.category ?? '',
        websiteUrl: page.websiteUrl ?? '',
        contactEmail: page.contactEmail ?? '',
        callToAction: page.callToAction ?? '',
        visibility: page.visibility ?? 'public',
        avatarColor: page.avatarColor ?? '#0f172a',
        bannerImageUrl: page.bannerImageUrl ?? '',
        settings: page.settings ? JSON.stringify(page.settings, null, 2) : '',
        metadata: page.metadata ? JSON.stringify(page.metadata, null, 2) : '',
      });
    } else {
      setValues({
        name: '',
        slug: '',
        description: '',
        category: '',
        websiteUrl: '',
        contactEmail: '',
        callToAction: '',
        visibility: 'public',
        avatarColor: '#0f172a',
        bannerImageUrl: '',
        settings: '',
        metadata: '',
      });
    }
  }, [mode, open, page]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);
    let settingsPayload = null;
    let metadataPayload = null;
    try {
      settingsPayload = parseJsonInput(values.settings, null);
      metadataPayload = parseJsonInput(values.metadata, null);
    } catch (parseError) {
      setLocalError(parseError.message);
      return;
    }

    const payload = {
      name: values.name?.trim(),
      slug: values.slug?.trim() || undefined,
      description: values.description?.trim() || undefined,
      category: values.category?.trim() || undefined,
      websiteUrl: values.websiteUrl?.trim() || undefined,
      contactEmail: values.contactEmail?.trim() || undefined,
      callToAction: values.callToAction?.trim() || undefined,
      visibility: values.visibility,
      avatarColor: values.avatarColor || undefined,
      bannerImageUrl: values.bannerImageUrl?.trim() || undefined,
      settings: settingsPayload,
      metadata: metadataPayload,
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Update page settings' : 'Create a page'}
      size="max-w-3xl"
      footer={
        <div className="flex flex-wrap justify-between gap-3">
          <div className="text-sm text-rose-600">{localError || error}</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="page-management-form"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create page'}
            </button>
          </div>
        </div>
      }
    >
      <form id="page-management-form" onSubmit={handleSubmit} className="space-y-6">
        <Fieldset legend="Brand details" description="Name, slug, and description shown on the live page.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input
                required
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder="Program or organisation name"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Slug
              <input
                name="slug"
                value={values.slug}
                onChange={handleChange}
                placeholder="brand-page"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              name="description"
              value={values.description}
              onChange={handleChange}
              rows={3}
              placeholder="Pitch, offerings, and context for visitors."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Category
              <input
                name="category"
                value={values.category}
                onChange={handleChange}
                placeholder="Community, Program, Event"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Call to action
              <input
                name="callToAction"
                value={values.callToAction}
                onChange={handleChange}
                placeholder="Join waitlist"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
          </div>
        </Fieldset>
        <Fieldset legend="Contact & visibility" description="Make sure members know how to reach you.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Website
              <input
                name="websiteUrl"
                value={values.websiteUrl}
                onChange={handleChange}
                placeholder="https://gigvora.com/program"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Contact email
              <input
                name="contactEmail"
                type="email"
                value={values.contactEmail}
                onChange={handleChange}
                placeholder="contact@gigvora.com"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,160px)_1fr]">
            <label className="text-sm font-medium text-slate-700">
              Visibility
              <select
                name="visibility"
                value={values.visibility}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {PAGE_VISIBILITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Accent colour
                <input
                  type="color"
                  name="avatarColor"
                  value={values.avatarColor}
                  onChange={handleChange}
                  className="mt-2 h-10 w-24 rounded-2xl border border-slate-300 bg-white px-2"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Banner image URL
                <input
                  name="bannerImageUrl"
                  value={values.bannerImageUrl}
                  onChange={handleChange}
                  placeholder="https://cdn.gigvora.com/banner.png"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>
          </div>
        </Fieldset>
        <Fieldset legend="Advanced" description="Optional JSON for integrations, AI prompts, or automation.">
          <label className="block text-sm font-medium text-slate-700">
            Settings JSON
            <textarea
              name="settings"
              value={values.settings}
              onChange={handleChange}
              rows={4}
              placeholder='{ "feature": true }'
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Metadata JSON
            <textarea
              name="metadata"
              value={values.metadata}
              onChange={handleChange}
              rows={4}
              placeholder='{ "tags": ["community", "launchpad"] }'
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </Fieldset>
      </form>
    </Modal>
  );
}

PageFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  page: PropTypes.object,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

PageFormModal.defaultProps = {
  page: null,
  submitting: false,
  error: null,
};

function InviteManagerModal({ open, page, invites, loading, submitting, error, onClose, onCreate, onRemove }) {
  const [values, setValues] = useState({ email: '', role: 'editor', status: 'pending', expiresAt: '', message: '' });

  useEffect(() => {
    if (!open) {
      return;
    }
    setValues({ email: '', role: 'editor', status: 'pending', expiresAt: '', message: '' });
  }, [open, page]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate({
      ...values,
      email: values.email?.trim(),
      expiresAt: values.expiresAt || undefined,
    });
    setValues({ email: '', role: values.role, status: 'pending', expiresAt: '', message: '' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Page invites · ${page?.name ?? ''}`}
      size="max-w-4xl"
      footer={
        <div className="flex justify-between gap-3 text-sm">
          <div className="text-rose-600">{error}</div>
          <p className="text-xs text-slate-500">Invites can assign admin, editor, or author level roles immediately.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-inner">
          <h4 className="text-sm font-semibold text-slate-800">Invite teammate</h4>
          <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
              <input
                required
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                placeholder="leader@gigvora.com"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {PAGE_INVITE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
              <select
                name="status"
                value={values.status}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {PAGE_INVITE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Expiry
              <input
                type="datetime-local"
                name="expiresAt"
                value={values.expiresAt}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
          </div>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Personal message
            <textarea
              name="message"
              value={values.message}
              onChange={handleChange}
              rows={2}
              placeholder="Share onboarding notes, assets, or deadlines."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800">Invites</h4>
            {loading ? <span className="text-xs text-slate-500">Loading…</span> : null}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {invites.length ? (
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Expires</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="transition hover:bg-accentSoft/40">
                      <td className="px-4 py-2">
                        <p className="font-medium text-slate-800">{invite.email}</p>
                        {invite.invitedBy?.name ? (
                          <p className="text-xs text-slate-500">Invited by {invite.invitedBy.name}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 capitalize">{invite.role}</td>
                      <td className="px-4 py-2 capitalize">{invite.status}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">{invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onRemove(invite)}
                          className="inline-flex items-center justify-center rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-slate-500">No invites yet — invite admins, editors, or guest authors.</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

InviteManagerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  page: PropTypes.object,
  invites: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

InviteManagerModal.defaultProps = {
  page: null,
  loading: false,
  submitting: false,
  error: null,
};

function PostManagerModal({
  open,
  page,
  posts,
  loading,
  submitting,
  error,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [activePostId, setActivePostId] = useState(null);
  const [values, setValues] = useState({
    title: '',
    summary: '',
    content: '',
    status: 'draft',
    visibility: 'public',
    scheduledAt: '',
    attachments: '',
  });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLocalError(null);
    if (!activePostId) {
      setValues({ title: '', summary: '', content: '', status: 'draft', visibility: 'public', scheduledAt: '', attachments: '' });
    }
  }, [open]);

  useEffect(() => {
    if (!activePostId) {
      setValues({ title: '', summary: '', content: '', status: 'draft', visibility: 'public', scheduledAt: '', attachments: '' });
      return;
    }
    const selected = posts.find((post) => post.id === activePostId);
    if (!selected) {
      return;
    }
    setValues({
      title: selected.title ?? '',
      summary: selected.summary ?? '',
      content: selected.content ?? '',
      status: selected.status ?? 'draft',
      visibility: selected.visibility ?? 'public',
      scheduledAt: formatDateTimeLocal(selected.scheduledAt),
      attachments: Array.isArray(selected.attachments) ? selected.attachments.join('\n') : '',
    });
  }, [activePostId, posts]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);
    const payload = {
      title: values.title?.trim(),
      summary: values.summary?.trim() || undefined,
      content: values.content?.trim(),
      status: values.status,
      visibility: values.visibility,
      scheduledAt: values.scheduledAt || undefined,
      attachments: values.attachments
        ? values.attachments
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        : undefined,
    };

    if (!payload.title || !payload.content) {
      setLocalError('Title and content are required.');
      return;
    }

    if (activePostId) {
      await onUpdate(activePostId, payload);
    } else {
      await onCreate(payload);
      setActivePostId(null);
      setValues({ title: '', summary: '', content: '', status: 'draft', visibility: 'public', scheduledAt: '', attachments: '' });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Page posts · ${page?.name ?? ''}`}
      size="max-w-5xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-rose-600">{error || localError}</div>
          <div className="flex gap-3">
            {activePostId ? (
              <button
                type="button"
                onClick={() => setActivePostId(null)}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
              >
                Start new post
              </button>
            ) : null}
            {activePostId ? (
              <button
                type="button"
                onClick={() => onDelete(activePostId)}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 px-5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Delete
              </button>
            ) : null}
            <button
              type="submit"
              form="page-post-form"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : activePostId ? 'Update post' : 'Publish post'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,230px)_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Posts</h4>
            {loading ? <span className="text-xs text-slate-500">Loading…</span> : null}
          </div>
          <button
            type="button"
            onClick={() => setActivePostId(null)}
            className={`w-full rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition hover:border-accent/50 hover:text-accent ${
              activePostId ? 'border-slate-200 text-slate-600' : 'border-slate-900/50 bg-slate-900/10 text-slate-900'
            }`}
          >
            Create new post
          </button>
          <div className="max-h-[320px] space-y-2 overflow-y-auto">
            {posts.map((post) => (
              <button
                type="button"
                key={post.id}
                onClick={() => setActivePostId(post.id)}
                className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition hover:border-accent/40 hover:text-accent ${
                  activePostId === post.id ? 'border-slate-900/50 bg-slate-900/10 text-slate-900' : 'border-slate-200 text-slate-600'
                }`}
              >
                <p className="font-semibold">{post.title}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{post.status}</p>
                <p className="text-xs text-slate-500">
                  {post.updatedAt ? new Date(post.updatedAt).toLocaleString() : '—'}
                </p>
              </button>
            ))}
            {!posts.length ? (
              <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-500">
                Publish launch updates, recaps, and featured stories for followers.
              </p>
            ) : null}
          </div>
        </div>
        <form id="page-post-form" onSubmit={handleSubmit} className="space-y-4">
          <Fieldset legend="Post details" description="Headline, summary, and visibility options.">
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                required
                name="title"
                value={values.title}
                onChange={handleChange}
                placeholder="Launch recap"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Summary
              <textarea
                name="summary"
                value={values.summary}
                onChange={handleChange}
                rows={2}
                placeholder="Optional summary for feeds and previews."
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  name="status"
                  value={values.status}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {PAGE_POST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Visibility
                <select
                  name="visibility"
                  value={values.visibility}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {PAGE_POST_VISIBILITIES.map((visibility) => (
                    <option key={visibility} value={visibility}>
                      {visibility}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Schedule
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={values.scheduledAt}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>
          </Fieldset>
          <Fieldset legend="Content" description="Tell the story — long-form posts are supported.">
            <textarea
              required
              name="content"
              value={values.content}
              onChange={handleChange}
              rows={8}
              placeholder="Share impact, metrics, or product updates."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <label className="block text-sm font-medium text-slate-700">
              Attachments (one per line)
              <textarea
                name="attachments"
                value={values.attachments}
                onChange={handleChange}
                rows={3}
                placeholder={'https://cdn.gigvora.com/assets/deck.pdf\nhttps://www.canva.com/design'}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
          </Fieldset>
        </form>
      </div>
    </Modal>
  );
}

PostManagerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  page: PropTypes.object,
  posts: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

PostManagerModal.defaultProps = {
  page: null,
  loading: false,
  submitting: false,
  error: null,
};

function MembershipManagerModal({
  open,
  page,
  memberships,
  loading,
  submittingId,
  error,
  onClose,
  onRefresh,
  onUpdate,
}) {
  const [edits, setEdits] = useState({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setEdits({});
  }, [open, memberships]);

  const handleChange = (membershipId, field, value) => {
    setEdits((prev) => ({ ...prev, [membershipId]: { ...prev[membershipId], [field]: value } }));
  };

  const handleSave = async (membership) => {
    const pending = edits[membership.id] ?? {};
    const payload = {};
    if (pending.role && pending.role !== membership.role) {
      payload.role = pending.role;
    }
    if (pending.status && pending.status !== membership.status) {
      payload.status = pending.status;
    }
    if (pending.notes !== undefined && pending.notes !== membership.notes) {
      payload.notes = pending.notes;
    }
    if (!Object.keys(payload).length) {
      return;
    }
    await onUpdate(membership, payload);
    setEdits((prev) => ({ ...prev, [membership.id]: {} }));
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Memberships · ${page?.name ?? ''}`}
      size="max-w-5xl"
      footer={<div className="text-sm text-rose-600">{error}</div>}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-800">Team members</h4>
          {loading ? <span className="text-xs text-slate-500">Loading…</span> : null}
        </div>
        <div className="max-h-[420px] overflow-y-auto rounded-3xl border border-slate-200">
          {memberships.length ? (
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberships.map((membership) => {
                  const pending = edits[membership.id] ?? {};
                  return (
                    <tr key={membership.id} className="transition hover:bg-accentSoft/40">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{membership.member?.name ?? membership.member?.email ?? 'Member'}</p>
                        <p className="text-xs text-slate-500">{membership.member?.email ?? '—'} </p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={pending.role ?? membership.role}
                          onChange={(event) => handleChange(membership.id, 'role', event.target.value)}
                          className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          {PAGE_MEMBER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={pending.status ?? membership.status}
                          onChange={(event) => handleChange(membership.id, 'status', event.target.value)}
                          className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          {PAGE_MEMBER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={pending.notes ?? membership.notes ?? ''}
                          onChange={(event) => handleChange(membership.id, 'notes', event.target.value)}
                          placeholder="Optional role notes"
                          className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSave(membership)}
                          disabled={submittingId === membership.id}
                          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingId === membership.id ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-slate-500">
              No members yet — invite admins or editors to collaborate.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

MembershipManagerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  page: PropTypes.object,
  memberships: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  submittingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  onUpdate: PropTypes.func.isRequired,
};

MembershipManagerModal.defaultProps = {
  page: null,
  loading: false,
  submittingId: null,
  error: null,
  onRefresh: undefined,
};

function PageCard({ page, canManage, onEdit, onInvites, onPosts, onMembers }) {
  const stats = page.stats ?? {};
  const statusBadge = page.visibility === 'private' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{page.name}</h3>
            <p className="text-xs uppercase tracking-wide text-slate-500">{page.category || 'Page'}</p>
            {page.description ? <p className="mt-3 text-sm text-slate-600">{page.description}</p> : null}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge}`}>
              {page.visibility}
            </span>
            {page.websiteUrl ? (
              <a
                href={page.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
              >
                Visit site →
              </a>
            ) : null}
          </div>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Active members</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{stats.active ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Pending invites</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{stats.pending ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Total members</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">{stats.total ?? 0}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onEdit(page)}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent"
        >
          Settings
        </button>
        {canManage ? (
          <>
            <button
              type="button"
              onClick={() => onInvites(page)}
              className="inline-flex items-center justify-center rounded-full border border-slate-900/40 bg-slate-900/10 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-900/20"
            >
              Invites
            </button>
            <button
              type="button"
              onClick={() => onMembers(page)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent"
            >
              Roles &amp; access
            </button>
            <button
              type="button"
              onClick={() => onPosts(page)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent"
            >
              Posts
            </button>
          </>
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400">
            View-only access
          </span>
        )}
      </div>
    </div>
  );
}

PageCard.propTypes = {
  page: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onInvites: PropTypes.func.isRequired,
  onPosts: PropTypes.func.isRequired,
  onMembers: PropTypes.func.isRequired,
};

export default function PageManagementPanel({ pages, userId, onRefresh }) {
  const allPages = Array.isArray(pages?.items) ? pages.items : [];
  const manageablePages = useMemo(() => allPages.filter((page) => PAGE_MANAGER_ROLES.has(page.role)), [allPages]);

  const [formMode, setFormMode] = useState('create');
  const [activePage, setActivePage] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteList, setInviteList] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  const [postsModalOpen, setPostsModalOpen] = useState(false);
  const [postList, setPostList] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsSubmitting, setPostsSubmitting] = useState(false);
  const [postsError, setPostsError] = useState(null);

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membershipSavingId, setMembershipSavingId] = useState(null);
  const [membershipError, setMembershipError] = useState(null);

  useEffect(() => {
    if (!inviteModalOpen || !activePage || !userId) {
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setInviteLoading(true);
        const response = await pagesService.listPageInvites(userId, activePage.id);
        if (!mounted) {
          return;
        }
        setInviteList(Array.isArray(response) ? response : Array.isArray(response?.invites) ? response.invites : []);
        setInviteError(null);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setInviteError(error.message || 'Unable to load invites.');
      } finally {
        if (mounted) {
          setInviteLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activePage, inviteModalOpen, userId]);

  useEffect(() => {
    if (!postsModalOpen || !activePage || !userId) {
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setPostsLoading(true);
        const response = await pagesService.listPagePosts(userId, activePage.id, { limit: 50 });
        if (!mounted) {
          return;
        }
        setPostList(Array.isArray(response?.posts) ? response.posts : []);
        setPostsError(null);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setPostsError(error.message || 'Unable to load posts.');
      } finally {
        if (mounted) {
          setPostsLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activePage, postsModalOpen, userId]);

  useEffect(() => {
    if (!membersModalOpen || !activePage || !userId) {
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setMembersLoading(true);
        const response = await pagesService.listPageMemberships(userId, activePage.id);
        if (!mounted) {
          return;
        }
        setMemberships(Array.isArray(response) ? response : []);
        setMembershipError(null);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setMembershipError(error.message || 'Unable to load memberships.');
      } finally {
        if (mounted) {
          setMembersLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activePage, membersModalOpen, userId]);

  const handleCreatePage = () => {
    setFormMode('create');
    setActivePage(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEditPage = (page) => {
    setFormMode('edit');
    setActivePage(page);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmitPage = async (payload) => {
    if (!userId) {
      setFormError('A valid user session is required.');
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formMode === 'create') {
        await pagesService.createUserPage(userId, payload);
      } else if (activePage) {
        await pagesService.updateUserPage(userId, activePage.id, payload);
      }
      setFormOpen(false);
      setActivePage(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setFormError(error.message || 'Unable to save page.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenInvites = (page) => {
    setActivePage(page);
    setInviteModalOpen(true);
  };

  const handleCreateInvite = async (payload) => {
    if (!userId || !activePage) {
      setInviteError('A valid user session is required.');
      return;
    }
    setInviteSubmitting(true);
    try {
      const invite = await pagesService.createPageInvite(userId, activePage.id, payload);
      setInviteList((prev) => [invite, ...prev.filter((item) => item.id !== invite.id)]);
      setInviteError(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setInviteError(error.message || 'Unable to send invite.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRemoveInvite = async (invite) => {
    if (!userId || !activePage) {
      setInviteError('A valid user session is required.');
      return;
    }
    try {
      await pagesService.deletePageInvite(userId, activePage.id, invite.id);
      setInviteList((prev) => prev.filter((item) => item.id !== invite.id));
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setInviteError(error.message || 'Unable to cancel invite.');
    }
  };

  const handleOpenPosts = (page) => {
    setActivePage(page);
    setPostsModalOpen(true);
  };

  const handleCreatePost = async (payload) => {
    if (!userId || !activePage) {
      setPostsError('A valid user session is required.');
      return;
    }
    setPostsSubmitting(true);
    try {
      const post = await pagesService.createPagePost(userId, activePage.id, payload);
      setPostList((prev) => [post, ...prev]);
      setPostsError(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setPostsError(error.message || 'Unable to publish post.');
    } finally {
      setPostsSubmitting(false);
    }
  };

  const handleUpdatePost = async (postId, payload) => {
    if (!userId || !activePage) {
      setPostsError('A valid user session is required.');
      return;
    }
    setPostsSubmitting(true);
    try {
      const updated = await pagesService.updatePagePost(userId, activePage.id, postId, payload);
      setPostList((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
      setPostsError(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setPostsError(error.message || 'Unable to update post.');
    } finally {
      setPostsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!userId || !activePage) {
      setPostsError('A valid user session is required.');
      return;
    }
    setPostsSubmitting(true);
    try {
      await pagesService.deletePagePost(userId, activePage.id, postId);
      setPostList((prev) => prev.filter((post) => post.id !== postId));
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setPostsError(error.message || 'Unable to delete post.');
    } finally {
      setPostsSubmitting(false);
    }
  };

  const handleOpenMembers = (page) => {
    setActivePage(page);
    setMembersModalOpen(true);
  };

  const handleUpdateMembership = async (membership, payload) => {
    if (!userId || !activePage) {
      setMembershipError('A valid user session is required.');
      return;
    }
    setMembershipSavingId(membership.id);
    try {
      const updated = await pagesService.updatePageMembership(userId, activePage.id, membership.id, payload);
      setMemberships((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setMembershipError(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setMembershipError(error.message || 'Unable to update member.');
    } finally {
      setMembershipSavingId(null);
    }
  };

  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Pages</h3>
          <p className="text-sm text-slate-600">Build branded destinations, manage contributors, and publish updates.</p>
        </div>
        <button
          type="button"
          onClick={handleCreatePage}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
        >
          Create page
        </button>
      </div>

      <div className="grid gap-5">
        {allPages.length ? (
          allPages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              canManage={PAGE_MANAGER_ROLES.has(page.role)}
              onEdit={handleEditPage}
              onInvites={handleOpenInvites}
              onPosts={handleOpenPosts}
              onMembers={handleOpenMembers}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Launch a page to showcase programs, cohorts, or brand updates. Use “Create page” to get started.
          </div>
        )}
      </div>

      <PageFormModal
        open={formOpen}
        mode={formMode}
        page={formMode === 'edit' ? activePage : null}
        submitting={formSubmitting}
        error={formError}
        onClose={() => {
          setFormOpen(false);
          setActivePage(null);
        }}
        onSubmit={handleSubmitPage}
      />

      <InviteManagerModal
        open={inviteModalOpen}
        page={activePage}
        invites={inviteList}
        loading={inviteLoading}
        submitting={inviteSubmitting}
        error={inviteError}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteError(null);
        }}
        onCreate={handleCreateInvite}
        onRemove={handleRemoveInvite}
      />

      <PostManagerModal
        open={postsModalOpen}
        page={activePage}
        posts={postList}
        loading={postsLoading}
        submitting={postsSubmitting}
        error={postsError}
        onClose={() => {
          setPostsModalOpen(false);
          setPostsError(null);
        }}
        onCreate={handleCreatePost}
        onUpdate={handleUpdatePost}
        onDelete={handleDeletePost}
      />

      <MembershipManagerModal
        open={membersModalOpen}
        page={activePage}
        memberships={memberships}
        loading={membersLoading}
        submittingId={membershipSavingId}
        error={membershipError}
        onClose={() => {
          setMembersModalOpen(false);
          setMembershipError(null);
        }}
        onRefresh={onRefresh}
        onUpdate={handleUpdateMembership}
      />
    </div>
  );
}

PageManagementPanel.propTypes = {
  pages: PropTypes.shape({ items: PropTypes.array }).isRequired,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func,
};

PageManagementPanel.defaultProps = {
  userId: null,
  onRefresh: undefined,
};
