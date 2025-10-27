import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import groupsService from '../../services/groups.js';

const GROUP_MANAGER_ROLES = new Set(['owner', 'moderator']);
const GROUP_VISIBILITIES = ['public', 'private', 'secret'];
const GROUP_MEMBER_POLICIES = ['open', 'request', 'invite'];
const GROUP_POST_STATUSES = ['draft', 'scheduled', 'published', 'archived'];
const GROUP_POST_VISIBILITIES = ['public', 'members', 'admins'];
const GROUP_INVITE_ROLES = ['owner', 'moderator', 'member', 'observer'];
const GROUP_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired'];

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
  if (value == null || value === '') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed;
  } catch (error) {
    throw new Error('Provide valid JSON or leave the field empty.');
  }
}

function formatCount(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  }
  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return numeric.toLocaleString();
}

function formatPercent(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${Math.round(numeric * 100)}%`;
}

function formatDateLabel(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function InsightStat({ label, value, helper, tone = 'default' }) {
  const palette =
    tone === 'accent'
      ? 'border-accent/40 bg-accentSoft/80 text-accent'
      : tone === 'positive'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-white/90 text-slate-700';
  return (
    <div className={`rounded-3xl border p-4 shadow-sm transition hover:shadow-md ${palette}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-600">{helper}</p> : null}
    </div>
  );
}

InsightStat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.node,
  tone: PropTypes.oneOf(['default', 'accent', 'positive', 'warning']),
};

InsightStat.defaultProps = {
  helper: null,
  tone: 'default',
};

function MetricItem({ label, value, helper, tone = 'default' }) {
  const palette =
    tone === 'accent'
      ? 'border-accent/40 bg-accentSoft/60 text-accent'
      : tone === 'positive'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-white text-slate-800';
  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition hover:border-accent/50 hover:shadow-md ${palette}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-600">{helper}</p> : null}
    </div>
  );
}

MetricItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  helper: PropTypes.node,
  tone: PropTypes.oneOf(['default', 'accent', 'positive', 'warning']),
};

MetricItem.defaultProps = {
  helper: null,
  tone: 'default',
};

function TrendingTopicPill({ topic }) {
  return (
    <span className="inline-flex items-center rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
      #{topic}
    </span>
  );
}

TrendingTopicPill.propTypes = {
  topic: PropTypes.string.isRequired,
};

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

function GroupFormModal({ open, mode, group, submitting, error, onClose, onSubmit }) {
  const [values, setValues] = useState({
    name: '',
    slug: '',
    description: '',
    visibility: 'public',
    memberPolicy: 'request',
    avatarColor: '#2563eb',
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
    if (mode === 'edit' && group) {
      setValues({
        name: group.name ?? '',
        slug: group.slug ?? '',
        description: group.description ?? '',
        visibility: group.visibility ?? 'public',
        memberPolicy: group.memberPolicy ?? 'request',
        avatarColor: group.avatarColor ?? '#2563eb',
        bannerImageUrl: group.bannerImageUrl ?? '',
        settings: group.settings ? JSON.stringify(group.settings, null, 2) : '',
        metadata: group.metadata ? JSON.stringify(group.metadata, null, 2) : '',
      });
    } else {
      setValues({
        name: '',
        slug: '',
        description: '',
        visibility: 'public',
        memberPolicy: 'request',
        avatarColor: '#2563eb',
        bannerImageUrl: '',
        settings: '',
        metadata: '',
      });
    }
  }, [group, mode, open]);

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
      name: values.name?.trim() || undefined,
      slug: values.slug?.trim() || undefined,
      description: values.description?.trim() || '',
      visibility: values.visibility,
      memberPolicy: values.memberPolicy,
      avatarColor: values.avatarColor || undefined,
      bannerImageUrl: values.bannerImageUrl?.trim() || '',
      settings: settingsPayload,
      metadata: metadataPayload,
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Update group settings' : 'Create a group'}
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
              form="group-management-form"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create group'}
            </button>
          </div>
        </div>
      }
    >
      <form id="group-management-form" onSubmit={handleSubmit} className="space-y-6">
        <Fieldset legend="Group details" description="Name, slug, and public description shown to members.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input
                required
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder="Community name"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Slug
              <input
                name="slug"
                value={values.slug}
                onChange={handleChange}
                placeholder="future-of-work"
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
              placeholder="What members can expect when joining."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </Fieldset>
        <Fieldset legend="Policies" description="Visibility and join experience.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Visibility
              <select
                name="visibility"
                value={values.visibility}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {GROUP_VISIBILITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Member policy
              <select
                name="memberPolicy"
                value={values.memberPolicy}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {GROUP_MEMBER_POLICIES.map((option) => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,160px)_1fr]">
            <label className="text-sm font-medium text-slate-700">
              Accent colour
              <input
                name="avatarColor"
                type="color"
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
                placeholder="https://cdn.gigvora.com/group-banner.jpg"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
          </div>
        </Fieldset>
        <Fieldset legend="Advanced" description="Optional JSON configuration for automation or integrations.">
          <label className="block text-sm font-medium text-slate-700">
            Settings JSON
            <textarea
              name="settings"
              value={values.settings}
              onChange={handleChange}
              rows={4}
              placeholder='{ "welcomeMessage": "Hello" }'
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
              placeholder='{ "tags": ["design", "community"] }'
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        </Fieldset>
      </form>
    </Modal>
  );
}

GroupFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  group: PropTypes.object,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

GroupFormModal.defaultProps = {
  group: null,
  submitting: false,
  error: null,
};

function InviteManagerModal({ open, group, invites, loading, error, submitting, onClose, onCreate, onRemove }) {
  const [formValues, setFormValues] = useState({ email: '', role: 'member', status: 'pending', expiresAt: '', message: '' });

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormValues({ email: '', role: 'member', status: 'pending', expiresAt: '', message: '' });
  }, [open, group]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate({ ...formValues, email: formValues.email?.trim(), expiresAt: formValues.expiresAt || undefined });
    setFormValues({ email: '', role: formValues.role, status: 'pending', expiresAt: '', message: '' });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Invites · ${group?.name ?? ''}`}
      size="max-w-4xl"
      footer={
        <div className="flex justify-between gap-3 text-sm">
          <div className="text-rose-600">{error}</div>
          <p className="text-xs text-slate-500">Invites respect expiry and role guardrails automatically.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-inner">
          <h4 className="text-sm font-semibold text-slate-800">Send invite</h4>
          <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
              <input
                required
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="person@gigvora.com"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Role
              <select
                name="role"
                value={formValues.role}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {GROUP_INVITE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Status
              <select
                name="status"
                value={formValues.status}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm capitalize focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                {GROUP_INVITE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Expiry
              <input
                type="datetime-local"
                name="expiresAt"
                value={formValues.expiresAt}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </label>
          </div>
          <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Personal message
            <textarea
              name="message"
              value={formValues.message}
              onChange={handleChange}
              rows={2}
              placeholder="Let collaborators know what to post first."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-800">Outstanding invites</h4>
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
              <div className="px-6 py-8 text-center text-sm text-slate-500">No invites yet — send one above to start onboarding.</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

InviteManagerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  group: PropTypes.object,
  invites: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  submitting: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

InviteManagerModal.defaultProps = {
  group: null,
  loading: false,
  error: null,
  submitting: false,
};

function PostManagerModal({
  open,
  group,
  posts,
  loading,
  error,
  submitting,
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
      title={`Posts · ${group?.name ?? ''}`}
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
              form="group-post-form"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
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
              activePostId ? 'border-slate-200 text-slate-600' : 'border-accent/40 bg-accentSoft/70 text-accent'
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
                  activePostId === post.id ? 'border-accent/50 bg-accentSoft/60 text-accent' : 'border-slate-200 text-slate-600'
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
                Draft announcements and publish them instantly or schedule ahead.
              </p>
            ) : null}
          </div>
        </div>
        <form id="group-post-form" onSubmit={handleSubmit} className="space-y-4">
          <Fieldset legend="Post details" description="Title, summary, and visibility controls.">
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                required
                name="title"
                value={values.title}
                onChange={handleChange}
                placeholder="Town hall update"
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
                placeholder="Optional teaser shown on feeds."
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
                  {GROUP_POST_STATUSES.map((status) => (
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
                  {GROUP_POST_VISIBILITIES.map((visibility) => (
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
          <Fieldset legend="Content" description="Write the announcement or link to hosted content.">
            <textarea
              required
              name="content"
              value={values.content}
              onChange={handleChange}
              rows={8}
              placeholder="Share context, wins, resources, or meeting notes. Markdown supported via API."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <label className="block text-sm font-medium text-slate-700">
              Attachments (one per line)
              <textarea
                name="attachments"
                value={values.attachments}
                onChange={handleChange}
                rows={3}
                placeholder={'https://cdn.gigvora.com/assets/deck.pdf\nhttps://figma.com/file/design'}
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
  group: PropTypes.object,
  posts: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  submitting: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

PostManagerModal.defaultProps = {
  group: null,
  loading: false,
  error: null,
  submitting: false,
};

function GroupCard({ group, canManage, onEdit, onManageInvites, onManagePosts }) {
  const metrics = group.metrics ?? {};
  const statusBadge = group.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
  const trendingTopics = Array.isArray(metrics.trendingTopics) ? metrics.trendingTopics : [];
  const latestAnnouncementLabel = formatDateLabel(metrics.latestAnnouncementAt);
  const latestPost = (group.posts ?? []).find((post) => post.status === 'published');
  const upcomingPost = (group.posts ?? []).find((post) => post.status === 'scheduled');
  const engagementTone =
    metrics.engagementLevel === 'surging'
      ? 'accent'
      : metrics.engagementLevel === 'growing'
      ? 'positive'
      : 'default';
  const newMembersHelper =
    metrics.membersJoinedThisWeek && metrics.membersJoinedThisWeek > 0
      ? `+${formatCount(metrics.membersJoinedThisWeek)} this week`
      : 'No new joins yet';
  const invitesHelper =
    metrics.invitesExpiringSoon && metrics.invitesExpiringSoon > 0
      ? `${formatCount(metrics.invitesExpiringSoon)} expiring soon`
      : 'All invites healthy';
  const scheduledHelper =
    metrics.scheduledNext7Days && metrics.scheduledNext7Days > 0
      ? `${formatCount(metrics.scheduledNext7Days)} scheduled next 7 days`
      : 'Fill the schedule';

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
            <p className="text-xs uppercase tracking-wide text-slate-500">@{group.slug}</p>
            {group.description ? <p className="mt-3 text-sm text-slate-600">{group.description}</p> : null}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge}`}>
              {group.status}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              Role: {group.role}
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricItem
            label="Active members"
            value={formatCount(metrics.membersActive ?? 0)}
            helper={newMembersHelper}
            tone={metrics.membersJoinedThisWeek > 0 ? 'accent' : 'default'}
          />
          <MetricItem
            label="Pending invites"
            value={formatCount(metrics.invitesPending ?? 0)}
            helper={invitesHelper}
            tone={metrics.invitesExpiringSoon > 0 ? 'warning' : 'default'}
          />
          <MetricItem
            label="Posts published"
            value={formatCount(metrics.postsPublished ?? 0)}
            helper={
              metrics.postsPublishedThisWeek && metrics.postsPublishedThisWeek > 0
                ? `${formatCount(metrics.postsPublishedThisWeek)} this week`
                : 'Plan the next story'
            }
          />
          <MetricItem
            label="Engagement"
            value={formatPercent(metrics.engagementScore ?? 0)}
            helper={metrics.engagementLevel ? metrics.engagementLevel : 'emerging'}
            tone={engagementTone}
          />
        </div>
        {trendingTopics.length ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Trending topics</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {trendingTopics.map((topic) => (
                <TrendingTopicPill key={topic} topic={topic} />
              ))}
            </div>
          </div>
        ) : null}
        {(latestAnnouncementLabel || metrics.scheduledNext7Days > 0) && (latestPost || upcomingPost) ? (
          <div className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
            {latestPost && latestAnnouncementLabel ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Latest announcement</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{latestPost.title}</p>
                <p className="mt-1 text-xs text-slate-500">{latestAnnouncementLabel}</p>
              </div>
            ) : null}
            {metrics.scheduledNext7Days > 0 ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{scheduledHelper}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {upcomingPost?.title ? `Next: ${upcomingPost.title}` : 'Plan your next drop'}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onEdit(group)}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent"
        >
          Settings
        </button>
        {canManage ? (
          <>
            <button
              type="button"
              onClick={() => onManageInvites(group)}
              className="inline-flex items-center justify-center rounded-full border border-accent/40 bg-accentSoft px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent/60 hover:bg-accentSoft/80"
            >
              Invites &amp; roles
            </button>
            <button
              type="button"
              onClick={() => onManagePosts(group)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent"
            >
              Posts &amp; scheduling
            </button>
          </>
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400">
            View only — ask an owner to promote your role.
          </span>
        )}
      </div>
    </div>
  );
}

GroupCard.propTypes = {
  group: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onManageInvites: PropTypes.func.isRequired,
  onManagePosts: PropTypes.func.isRequired,
};

export default function GroupManagementPanel({ groups, userId, onRefresh }) {
  const allGroups = Array.isArray(groups?.items) ? groups.items : [];
  const managedGroups = useMemo(() => allGroups.filter((group) => GROUP_MANAGER_ROLES.has(group.role)), [allGroups]);

  const aggregatedMetrics = useMemo(() => {
    const stats = groups?.stats ?? {};
    return {
      activeMembers: Number(stats.activeMembers ?? 0),
      newMembersThisWeek: Number(stats.newMembersThisWeek ?? 0),
      postsScheduled: Number(stats.postsScheduled ?? 0),
      postsPublishedThisWeek: Number(stats.postsPublishedThisWeek ?? 0),
      postsDraft: Number(stats.postsDraft ?? 0),
      invitesExpiringSoon: Number(stats.invitesExpiringSoon ?? 0),
      averageEngagement:
        typeof stats.averageEngagement === 'number' && Number.isFinite(stats.averageEngagement)
          ? stats.averageEngagement
          : 0,
      trendingTopics: Array.isArray(stats.trendingTopics) ? stats.trendingTopics : [],
    };
  }, [groups]);

  const aggregatedEngagementLevel = useMemo(() => {
    const score = aggregatedMetrics.averageEngagement ?? 0;
    if (score >= 0.75) {
      return 'surging';
    }
    if (score >= 0.5) {
      return 'growing';
    }
    if (score >= 0.3) {
      return 'steady';
    }
    return 'emerging';
  }, [aggregatedMetrics]);

  const aggregatedHelpers = useMemo(
    () => ({
      newMembers: aggregatedMetrics.newMembersThisWeek
        ? `+${formatCount(aggregatedMetrics.newMembersThisWeek)} joined this week`
        : 'Onboarding steady',
      invites:
        aggregatedMetrics.invitesExpiringSoon > 0
          ? `${formatCount(aggregatedMetrics.invitesExpiringSoon)} expiring soon`
          : 'All invites healthy',
      scheduled:
        aggregatedMetrics.postsDraft > 0
          ? `${formatCount(aggregatedMetrics.postsDraft)} drafts ready`
          : 'Draft backlog clear',
    }),
    [aggregatedMetrics],
  );

  const [formMode, setFormMode] = useState('create');
  const [activeGroup, setActiveGroup] = useState(null);
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

  useEffect(() => {
    if (!inviteModalOpen || !activeGroup || !userId) {
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setInviteLoading(true);
        const response = await groupsService.listUserGroupInvites(userId, activeGroup.id);
        if (!mounted) {
          return;
        }
        setInviteList(Array.isArray(response?.invites) ? response.invites : []);
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
  }, [activeGroup, inviteModalOpen, userId]);

  useEffect(() => {
    if (!postsModalOpen || !activeGroup || !userId) {
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setPostsLoading(true);
        const response = await groupsService.listUserGroupPosts(userId, activeGroup.id, { limit: 50 });
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
  }, [activeGroup, postsModalOpen, userId]);

  const handleCreateGroup = () => {
    setFormMode('create');
    setActiveGroup(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEditGroup = (group) => {
    setFormMode('edit');
    setActiveGroup(group);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmitGroup = async (payload) => {
    if (!userId) {
      setFormError('A valid user session is required.');
      return;
    }
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (formMode === 'create') {
        await groupsService.createUserGroup(userId, payload);
      } else if (activeGroup) {
        await groupsService.updateUserGroup(userId, activeGroup.id, payload);
      }
      setFormOpen(false);
      setActiveGroup(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setFormError(error.message || 'Unable to save group.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenInvites = (group) => {
    setActiveGroup(group);
    setInviteModalOpen(true);
  };

  const handleCreateInvite = async (payload) => {
    if (!userId || !activeGroup) {
      setInviteError('A valid user session is required.');
      return;
    }
    setInviteSubmitting(true);
    try {
      const invite = await groupsService.createUserGroupInvite(userId, activeGroup.id, payload);
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
    if (!userId || !activeGroup) {
      setInviteError('A valid user session is required.');
      return;
    }
    try {
      await groupsService.deleteUserGroupInvite(userId, activeGroup.id, invite.id);
      setInviteList((prev) => prev.filter((item) => item.id !== invite.id));
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setInviteError(error.message || 'Unable to cancel invite.');
    }
  };

  const handleOpenPosts = (group) => {
    setActiveGroup(group);
    setPostsModalOpen(true);
  };

  const handleCreatePost = async (payload) => {
    if (!userId || !activeGroup) {
      setPostsError('A valid user session is required.');
      return;
    }
    setPostsSubmitting(true);
    try {
      const post = await groupsService.createUserGroupPost(userId, activeGroup.id, payload);
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
    if (!userId || !activeGroup) {
      setPostsError('A valid user session is required.');
      return;
    }
    setPostsSubmitting(true);
    try {
      const updated = await groupsService.updateUserGroupPost(userId, activeGroup.id, postId, payload);
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
    if (!userId || !activeGroup) {
      setPostsError('A valid user session is required.');
      return;
    }
    setPostsSubmitting(true);
    try {
      await groupsService.deleteUserGroupPost(userId, activeGroup.id, postId);
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

  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Groups</h3>
          <p className="text-sm text-slate-600">Create new circles, tune visibility, and manage invites or announcements.</p>
        </div>
        <button
          type="button"
          onClick={handleCreateGroup}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
        >
          Create group
        </button>
      </div>

      {managedGroups.length ? (
        <div className="rounded-3xl border border-accent/30 bg-white/95 p-5 shadow-inner">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Engagement pulse</p>
              <p className="mt-1 text-sm text-slate-600">
                {formatPercent(aggregatedMetrics.averageEngagement)} avg engagement · {aggregatedEngagementLevel} communities
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-accent/40 bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
              {formatCount(aggregatedMetrics.activeMembers)} active members
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InsightStat
              label="New members"
              value={`+${formatCount(aggregatedMetrics.newMembersThisWeek)}`}
              helper={aggregatedHelpers.newMembers}
              tone={aggregatedMetrics.newMembersThisWeek > 0 ? 'accent' : 'default'}
            />
            <InsightStat
              label="Invites"
              value={formatCount(aggregatedMetrics.invitesExpiringSoon)}
              helper={aggregatedHelpers.invites}
              tone={aggregatedMetrics.invitesExpiringSoon > 0 ? 'warning' : 'default'}
            />
            <InsightStat
              label="Scheduled posts"
              value={formatCount(aggregatedMetrics.postsScheduled)}
              helper={aggregatedHelpers.scheduled}
            />
            <InsightStat
              label="Published this week"
              value={formatCount(aggregatedMetrics.postsPublishedThisWeek)}
              helper={`${formatPercent(aggregatedMetrics.averageEngagement)} engagement`}
              tone={aggregatedEngagementLevel === 'surging' ? 'accent' : aggregatedEngagementLevel === 'growing' ? 'positive' : 'default'}
            />
          </div>
          {aggregatedMetrics.trendingTopics.length ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Trending topics</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {aggregatedMetrics.trendingTopics.map((topic) => (
                  <TrendingTopicPill key={topic} topic={topic} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5">
        {allGroups.length ? (
          allGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              canManage={GROUP_MANAGER_ROLES.has(group.role)}
              onEdit={handleEditGroup}
              onManageInvites={handleOpenInvites}
              onManagePosts={handleOpenPosts}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            You have not joined or created any groups yet. Use “Create group” to launch one and invite collaborators.
          </div>
        )}
      </div>

      <GroupFormModal
        open={formOpen}
        mode={formMode}
        group={formMode === 'edit' ? activeGroup : null}
        submitting={formSubmitting}
        error={formError}
        onClose={() => {
          setFormOpen(false);
          setActiveGroup(null);
        }}
        onSubmit={handleSubmitGroup}
      />

      <InviteManagerModal
        open={inviteModalOpen}
        group={activeGroup}
        invites={inviteList}
        loading={inviteLoading}
        error={inviteError}
        submitting={inviteSubmitting}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteError(null);
        }}
        onCreate={handleCreateInvite}
        onRemove={handleRemoveInvite}
      />

      <PostManagerModal
        open={postsModalOpen}
        group={activeGroup}
        posts={postList}
        loading={postsLoading}
        error={postsError}
        submitting={postsSubmitting}
        onClose={() => {
          setPostsModalOpen(false);
          setPostsError(null);
        }}
        onCreate={handleCreatePost}
        onUpdate={handleUpdatePost}
        onDelete={handleDeletePost}
      />
    </div>
  );
}

GroupManagementPanel.propTypes = {
  groups: PropTypes.shape({ items: PropTypes.array }).isRequired,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onRefresh: PropTypes.func,
};

GroupManagementPanel.defaultProps = {
  userId: null,
  onRefresh: undefined,
};
