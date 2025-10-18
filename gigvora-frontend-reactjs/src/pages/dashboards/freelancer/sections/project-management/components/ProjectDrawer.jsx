import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  formatCurrency,
  formatDate,
  formatDateForInput,
  formatPercent,
  bytesToDisplay,
  normalizeProject,
  toNumber,
} from '../utils.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function OverviewTab({ project, onUpdate, saving }) {
  const [form, setForm] = useState({
    title: project.title ?? '',
    description: project.description ?? '',
    dueDate: formatDateForInput(project.dueDate),
    status: project.status ?? 'planning',
    budgetCurrency: project.budgetCurrency ?? 'USD',
    budgetAllocated: project.budgetAllocated ?? 0,
    budgetSpent: project.budgetSpent ?? 0,
    metadata: {
      clientName: project.metadata?.clientName ?? '',
      workspaceUrl: project.metadata?.workspaceUrl ?? '',
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onUpdate({
      ...form,
      dueDate: form.dueDate || null,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-title">
          Title
        </label>
        <input
          id="drawer-title"
          type="text"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-description">
          Summary
        </label>
        <textarea
          id="drawer-description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-status">
            Status
          </label>
          <select
            id="drawer-status"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="planning">Planning</option>
            <option value="in_progress">Active</option>
            <option value="at_risk">At risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-due">
            Due
          </label>
          <input
            id="drawer-due"
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-currency">
            Currency
          </label>
          <select
            id="drawer-currency"
            value={form.budgetCurrency}
            onChange={(event) => setForm((prev) => ({ ...prev, budgetCurrency: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-budget-allocated">
            Allocated
          </label>
          <input
            id="drawer-budget-allocated"
            type="number"
            min="0"
            value={form.budgetAllocated}
            onChange={(event) => setForm((prev) => ({ ...prev, budgetAllocated: toNumber(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-budget-spent">
            Spent
          </label>
          <input
            id="drawer-budget-spent"
            type="number"
            min="0"
            value={form.budgetSpent}
            onChange={(event) => setForm((prev) => ({ ...prev, budgetSpent: toNumber(event.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-client">
            Client
          </label>
          <input
            id="drawer-client"
            type="text"
            value={form.metadata.clientName}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                metadata: { ...prev.metadata, clientName: event.target.value },
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="drawer-workspace-url">
            Workspace URL
          </label>
          <input
            id="drawer-workspace-url"
            type="url"
            value={form.metadata.workspaceUrl}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                metadata: { ...prev.metadata, workspaceUrl: event.target.value },
              }))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}

OverviewTab.propTypes = {
  project: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

OverviewTab.defaultProps = {
  saving: false,
};

function WorkspaceTab({ project, onUpdate, saving }) {
  const [form, setForm] = useState({
    status: project.workspace.status,
    riskLevel: project.workspace.riskLevel,
    progressPercent: project.workspace.progressPercent,
    nextMilestone: project.workspace.nextMilestone ?? '',
    nextMilestoneDueAt: formatDateForInput(project.workspace.nextMilestoneDueAt),
    notes: project.workspace.notes ?? '',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onUpdate({
      ...form,
      nextMilestoneDueAt: form.nextMilestoneDueAt || null,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="workspace-status-field">
            Status
          </label>
          <select
            id="workspace-status-field"
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="planning">Planning</option>
            <option value="in_progress">Active</option>
            <option value="at_risk">At risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="workspace-risk-field">
            Risk
          </label>
          <select
            id="workspace-risk-field"
            value={form.riskLevel}
            onChange={(event) => setForm((prev) => ({ ...prev, riskLevel: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="workspace-progress-field">
          Progress (%)
        </label>
        <input
          id="workspace-progress-field"
          type="number"
          min="0"
          max="100"
          value={form.progressPercent}
          onChange={(event) => setForm((prev) => ({ ...prev, progressPercent: toNumber(event.target.value) }))}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="workspace-next-field">
          Next milestone
        </label>
        <input
          id="workspace-next-field"
          type="text"
          value={form.nextMilestone}
          onChange={(event) => setForm((prev) => ({ ...prev, nextMilestone: event.target.value }))}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="workspace-next-due-field">
          Due date
        </label>
        <input
          id="workspace-next-due-field"
          type="date"
          value={form.nextMilestoneDueAt}
          onChange={(event) => setForm((prev) => ({ ...prev, nextMilestoneDueAt: event.target.value }))}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="workspace-notes-field">
          Notes
        </label>
        <textarea
          id="workspace-notes-field"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
        >
          Save workspace
        </button>
      </div>
    </form>
  );
}

WorkspaceTab.propTypes = {
  project: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

WorkspaceTab.defaultProps = {
  saving: false,
};

function MilestonesTab({ milestones, onCreate, onUpdate, onDelete, saving }) {
  const [draft, setDraft] = useState({ title: '', dueDate: '', status: 'planned' });
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState({ title: '', dueDate: '', status: 'planned' });

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      return;
    }
    await onCreate({
      title: draft.title,
      status: draft.status,
      dueDate: draft.dueDate || null,
    });
    setDraft({ title: '', dueDate: '', status: 'planned' });
  };

  const startEdit = (milestone) => {
    setEditingId(milestone.id);
    setEditing({
      title: milestone.title,
      status: milestone.status ?? 'planned',
      dueDate: formatDateForInput(milestone.dueDate),
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    await onUpdate(editingId, {
      title: editing.title,
      status: editing.status,
      dueDate: editing.dueDate || null,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Add milestone</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={draft.title}
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Title"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <select
            value={draft.status}
            onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">Active</option>
            <option value="completed">Done</option>
          </select>
          <input
            type="date"
            value={draft.dueDate}
            onChange={(event) => setDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving || !draft.title.trim()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
          >
            Add milestone
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <p className="text-sm text-slate-500">No milestones yet.</p>
        ) : (
          milestones.map((milestone) => (
            <div key={milestone.id} className="rounded-2xl border border-slate-200 p-4">
              {editingId === milestone.id ? (
                <form className="space-y-3" onSubmit={handleUpdate}>
                  <input
                    type="text"
                    value={editing.title}
                    onChange={(event) => setEditing((prev) => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={editing.status}
                      onChange={(event) => setEditing((prev) => ({ ...prev, status: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">Active</option>
                      <option value="completed">Done</option>
                    </select>
                    <input
                      type="date"
                      value={editing.dueDate}
                      onChange={(event) => setEditing((prev) => ({ ...prev, dueDate: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-4 py-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-accent px-5 py-1.5 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{milestone.title}</p>
                    <p className="text-xs text-slate-500">
                      {milestone.status?.replace(/_/g, ' ') ?? 'planned'} • {formatDate(milestone.dueDate)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(milestone)}
                      className="rounded-full px-4 py-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(milestone.id)}
                      className="rounded-full border border-rose-200 px-4 py-1 text-sm font-semibold text-rose-600 hover:border-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

MilestonesTab.propTypes = {
  milestones: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

MilestonesTab.defaultProps = {
  saving: false,
};

function CollaboratorsTab({ collaborators, onCreate, onUpdate, onDelete, saving }) {
  const [draft, setDraft] = useState({ fullName: '', email: '', role: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState({ fullName: '', email: '', role: '', status: 'active' });

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!draft.fullName.trim()) {
      return;
    }
    await onCreate(draft);
    setDraft({ fullName: '', email: '', role: '', status: 'active' });
  };

  const startEdit = (collaborator) => {
    setEditingId(collaborator.id);
    setEditing({
      fullName: collaborator.fullName,
      email: collaborator.email ?? '',
      role: collaborator.role ?? '',
      status: collaborator.status ?? 'active',
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    await onUpdate(editingId, editing);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Invite collaborator</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            value={draft.fullName}
            onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))}
            placeholder="Full name"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <input
            type="email"
            value={draft.email}
            onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <input
            type="text"
            value={draft.role}
            onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value }))}
            placeholder="Role"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <select
            value={draft.status}
            onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="invited">Invited</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving || !draft.fullName.trim()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
          >
            Add collaborator
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {collaborators.length === 0 ? (
          <p className="text-sm text-slate-500">No collaborators yet.</p>
        ) : (
          collaborators.map((collaborator) => (
            <div key={collaborator.id} className="rounded-2xl border border-slate-200 p-4">
              {editingId === collaborator.id ? (
                <form className="space-y-3" onSubmit={handleUpdate}>
                  <input
                    type="text"
                    value={editing.fullName}
                    onChange={(event) => setEditing((prev) => ({ ...prev, fullName: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="email"
                      value={editing.email}
                      onChange={(event) => setEditing((prev) => ({ ...prev, email: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editing.role}
                      onChange={(event) => setEditing((prev) => ({ ...prev, role: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    />
                    <select
                      value={editing.status}
                      onChange={(event) => setEditing((prev) => ({ ...prev, status: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="invited">Invited</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-4 py-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-accent px-5 py-1.5 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{collaborator.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {collaborator.role ?? 'Collaborator'} • {collaborator.status ?? 'active'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(collaborator)}
                      className="rounded-full px-4 py-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(collaborator.id)}
                      className="rounded-full border border-rose-200 px-4 py-1 text-sm font-semibold text-rose-600 hover:border-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

CollaboratorsTab.propTypes = {
  collaborators: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

CollaboratorsTab.defaultProps = {
  saving: false,
};

function AssetsTab({ assets, onCreate, onUpdate, onDelete, saving }) {
  const [draft, setDraft] = useState({ label: '', storageUrl: '', category: 'artifact' });
  const [editingId, setEditingId] = useState(null);
  const [editing, setEditing] = useState({ label: '', storageUrl: '', category: 'artifact' });

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!draft.label.trim() || !draft.storageUrl.trim()) {
      return;
    }
    await onCreate(draft);
    setDraft({ label: '', storageUrl: '', category: 'artifact' });
  };

  const startEdit = (asset) => {
    setEditingId(asset.id);
    setEditing({
      label: asset.label,
      storageUrl: asset.storageUrl,
      category: asset.category ?? 'artifact',
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    await onUpdate(editingId, editing);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Add asset</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={draft.label}
            onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))}
            placeholder="Label"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <input
            type="url"
            value={draft.storageUrl}
            onChange={(event) => setDraft((prev) => ({ ...prev, storageUrl: event.target.value }))}
            placeholder="https://..."
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <select
            value={draft.category}
            onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="artifact">Artifact</option>
            <option value="document">Document</option>
            <option value="video">Video</option>
            <option value="design">Design</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving || !draft.label.trim() || !draft.storageUrl.trim()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
          >
            Add asset
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {assets.length === 0 ? (
          <p className="text-sm text-slate-500">No assets yet.</p>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="rounded-2xl border border-slate-200 p-4">
              {editingId === asset.id ? (
                <form className="space-y-3" onSubmit={handleUpdate}>
                  <input
                    type="text"
                    value={editing.label}
                    onChange={(event) => setEditing((prev) => ({ ...prev, label: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <input
                    type="url"
                    value={editing.storageUrl}
                    onChange={(event) => setEditing((prev) => ({ ...prev, storageUrl: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  />
                  <select
                    value={editing.category}
                    onChange={(event) => setEditing((prev) => ({ ...prev, category: event.target.value }))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="artifact">Artifact</option>
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="design">Design</option>
                  </select>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-4 py-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-accent px-5 py-1.5 text-sm font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{asset.label}</p>
                    <p className="text-xs text-slate-500">
                      {asset.category ?? 'artifact'} • {bytesToDisplay(asset.sizeBytes)}
                    </p>
                    <a
                      href={asset.storageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold text-accent"
                    >
                      View asset
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(asset)}
                      className="rounded-full px-4 py-1 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(asset.id)}
                      className="rounded-full border border-rose-200 px-4 py-1 text-sm font-semibold text-rose-600 hover:border-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

AssetsTab.propTypes = {
  assets: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

AssetsTab.defaultProps = {
  saving: false,
};

export default function ProjectDrawer({ open, project, onClose, actions }) {
  const normalizedProject = useMemo(() => normalizeProject(project), [project]);
  const [saving, setSaving] = useState(false);

  const handleUpdateProject = async (payload) => {
    setSaving(true);
    try {
      await actions.updateProject(normalizedProject.id, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWorkspace = async (payload) => {
    setSaving(true);
    try {
      await actions.updateWorkspace(normalizedProject.id, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMilestone = async (payload) => {
    setSaving(true);
    try {
      await actions.createMilestone(normalizedProject.id, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMilestone = async (milestoneId, payload) => {
    setSaving(true);
    try {
      await actions.updateMilestone(normalizedProject.id, milestoneId, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    setSaving(true);
    try {
      await actions.deleteMilestone(normalizedProject.id, milestoneId);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCollaborator = async (payload) => {
    setSaving(true);
    try {
      await actions.createCollaborator(normalizedProject.id, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCollaborator = async (collaboratorId, payload) => {
    setSaving(true);
    try {
      await actions.updateCollaborator(normalizedProject.id, collaboratorId, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollaborator = async (collaboratorId) => {
    setSaving(true);
    try {
      await actions.deleteCollaborator(normalizedProject.id, collaboratorId);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAsset = async (payload) => {
    setSaving(true);
    try {
      await actions.addAsset(normalizedProject.id, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAsset = async (assetId, payload) => {
    setSaving(true);
    try {
      await actions.updateAsset(normalizedProject.id, assetId, payload);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    setSaving(true);
    try {
      await actions.deleteAsset(normalizedProject.id, assetId);
    } finally {
      setSaving(false);
    }
  };

  const tabs = useMemo(
    () => [
      {
        key: 'overview',
        title: 'Overview',
        content: <OverviewTab project={normalizedProject} onUpdate={handleUpdateProject} saving={saving} />,
      },
      {
        key: 'workspace',
        title: 'Workspace',
        content: <WorkspaceTab project={normalizedProject} onUpdate={handleUpdateWorkspace} saving={saving} />,
      },
      {
        key: 'milestones',
        title: `Milestones (${normalizedProject.milestones?.length ?? 0})`,
        content: (
          <MilestonesTab
            milestones={normalizedProject.milestones ?? []}
            onCreate={handleCreateMilestone}
            onUpdate={handleUpdateMilestone}
            onDelete={handleDeleteMilestone}
            saving={saving}
          />
        ),
      },
      {
        key: 'collaborators',
        title: `Collaborators (${normalizedProject.collaborators?.length ?? 0})`,
        content: (
          <CollaboratorsTab
            collaborators={normalizedProject.collaborators ?? []}
            onCreate={handleCreateCollaborator}
            onUpdate={handleUpdateCollaborator}
            onDelete={handleDeleteCollaborator}
            saving={saving}
          />
        ),
      },
      {
        key: 'assets',
        title: `Assets (${normalizedProject.assets?.length ?? 0})`,
        content: (
          <AssetsTab
            assets={normalizedProject.assets ?? []}
            onCreate={handleCreateAsset}
            onUpdate={handleUpdateAsset}
            onDelete={handleDeleteAsset}
            saving={saving}
          />
        ),
      },
    ],
    [normalizedProject, saving],
  );

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
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    <div className="border-b border-slate-200 px-8 py-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Dialog.Title className="text-xl font-semibold text-slate-900">
                            {normalizedProject.title}
                          </Dialog.Title>
                          <p className="mt-1 text-sm text-slate-500">
                            {normalizedProject.metadata?.clientName ? `Client: ${normalizedProject.metadata.clientName}` : 'Client TBD'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-full border border-slate-200 px-4 py-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Close
                        </button>
                      </div>
                      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Status</dt>
                          <dd className="text-sm font-semibold text-slate-800">
                            {normalizedProject.lifecycle?.workspaceStatus ?? normalizedProject.status}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Progress</dt>
                          <dd className="text-sm font-semibold text-slate-800">
                            {formatPercent(normalizedProject.workspace?.progressPercent)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">Budget</dt>
                          <dd className="text-sm font-semibold text-slate-800">
                            {formatCurrency(
                              normalizedProject.budgetAllocated ?? normalizedProject.budget?.allocated ?? 0,
                              normalizedProject.budgetCurrency ?? normalizedProject.budget?.currency ?? 'USD',
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <Tab.Group>
                      <Tab.List className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-6 py-3">
                        {tabs.map((tab) => (
                          <Tab
                            key={tab.key}
                            className={({ selected }) =>
                              classNames(
                                'rounded-full px-4 py-1.5 text-sm font-semibold transition',
                                selected
                                  ? 'bg-slate-900 text-white shadow'
                                  : 'text-slate-600 hover:text-slate-900',
                              )
                            }
                          >
                            {tab.title}
                          </Tab>
                        ))}
                      </Tab.List>
                      <Tab.Panels className="flex-1 overflow-y-auto px-8 py-6">
                        {tabs.map((tab) => (
                          <Tab.Panel key={tab.key} className="focus:outline-none">
                            {tab.content}
                          </Tab.Panel>
                        ))}
                      </Tab.Panels>
                    </Tab.Group>
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

ProjectDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  project: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    updateProject: PropTypes.func.isRequired,
    updateWorkspace: PropTypes.func.isRequired,
    createMilestone: PropTypes.func.isRequired,
    updateMilestone: PropTypes.func.isRequired,
    deleteMilestone: PropTypes.func.isRequired,
    createCollaborator: PropTypes.func.isRequired,
    updateCollaborator: PropTypes.func.isRequired,
    deleteCollaborator: PropTypes.func.isRequired,
    addAsset: PropTypes.func.isRequired,
    updateAsset: PropTypes.func.isRequired,
    deleteAsset: PropTypes.func.isRequired,
  }).isRequired,
};
