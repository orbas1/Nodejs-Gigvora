import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const ROLE_INITIAL_FORM = {
  name: '',
  description: '',
  seatLimit: '',
  permissions: '',
};

const ASSIGNMENT_INITIAL_FORM = {
  collaboratorName: '',
  collaboratorEmail: '',
  status: 'invited',
};

const ASSIGNMENT_STATUS_OPTIONS = [
  { value: 'invited', label: 'Invited' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function stringifyPermissions(value) {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return '';
    }
  }
  return String(value);
}

function parsePermissionsInput(value) {
  if (!value?.trim()) {
    return undefined;
  }
  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return parsed;
  } catch (error) {
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function buildAssignmentDraft(drafts, roleId) {
  return drafts[roleId] ?? { ...ASSIGNMENT_INITIAL_FORM };
}

export default function RolesManagementTab({ project, actions, canManage }) {
  const roles = Array.isArray(project.roleDefinitions) ? project.roleDefinitions : [];
  const summary = useMemo(() => {
    let totalRoles = roles.length;
    let activeAssignments = 0;
    let invitedAssignments = 0;
    let openSeats = 0;
    roles.forEach((role) => {
      const assignments = Array.isArray(role.assignments) ? role.assignments : [];
      activeAssignments += assignments.filter((assignment) => assignment.status === 'active').length;
      invitedAssignments += assignments.filter((assignment) => assignment.status === 'invited').length;
      if (Number.isFinite(Number(role.seatLimit))) {
        const seatLimit = Number(role.seatLimit);
        const filledSeats = assignments.filter((assignment) => assignment.status !== 'inactive').length;
        openSeats += Math.max(0, seatLimit - filledSeats);
      }
    });
    return { totalRoles, activeAssignments, invitedAssignments, openSeats };
  }, [roles]);

  const [roleForm, setRoleForm] = useState(ROLE_INITIAL_FORM);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editingRoleForm, setEditingRoleForm] = useState(ROLE_INITIAL_FORM);
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleRoleFieldChange = (event, setter) => {
    const { name, value } = event.target;
    setter((current) => ({ ...current, [name]: value }));
  };

  const handleAssignmentDraftChange = (roleId, field, value) => {
    setAssignmentDrafts((current) => ({
      ...current,
      [roleId]: { ...buildAssignmentDraft(current, roleId), [field]: value },
    }));
  };

  const resetRoleForm = () => {
    setRoleForm(ROLE_INITIAL_FORM);
  };

  const normalizeRolePayload = (form) => ({
    name: form.name,
    description: form.description || undefined,
    seatLimit: form.seatLimit ? Number(form.seatLimit) : undefined,
    permissions: parsePermissionsInput(form.permissions),
  });

  const handleCreateRole = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createRoleDefinition(project.id, normalizeRolePayload(roleForm));
      resetRoleForm();
      setFeedback({ status: 'success', message: 'Role created successfully.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to create role.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = (role) => {
    setEditingRoleId(role.id);
    setEditingRoleForm({
      name: role.name || '',
      description: role.description || '',
      seatLimit: role.seatLimit != null ? String(role.seatLimit) : '',
      permissions: stringifyPermissions(role.permissions),
    });
    setFeedback(null);
  };

  const handleUpdateRole = async (event) => {
    event.preventDefault();
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateRoleDefinition(project.id, editingRoleId, normalizeRolePayload(editingRoleForm));
      setEditingRoleId(null);
      setFeedback({ status: 'success', message: 'Role updated successfully.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update role.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteRoleDefinition(project.id, roleId);
      setFeedback({ status: 'success', message: 'Role removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove role.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (roleId) => {
    if (!canManage) return;
    const draft = buildAssignmentDraft(assignmentDrafts, roleId);
    if (!draft.collaboratorName?.trim()) {
      setFeedback({ status: 'error', message: 'Collaborator name is required.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.createRoleAssignment(project.id, roleId, {
        collaboratorName: draft.collaboratorName,
        collaboratorEmail: draft.collaboratorEmail || undefined,
        status: draft.status || 'invited',
      });
      setAssignmentDrafts((current) => ({ ...current, [roleId]: { ...ASSIGNMENT_INITIAL_FORM } }));
      setFeedback({ status: 'success', message: 'Collaborator assigned.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to assign collaborator.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAssignment = (roleId, assignment) => {
    setEditingAssignment({
      roleId,
      assignmentId: assignment.id,
      form: {
        collaboratorName: assignment.collaboratorName || assignment.name || '',
        collaboratorEmail: assignment.collaboratorEmail || assignment.email || '',
        status: assignment.status || 'invited',
      },
    });
  };

  const handleUpdateAssignment = async (event) => {
    event.preventDefault();
    if (!canManage || !editingAssignment) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.updateRoleAssignment(
        project.id,
        editingAssignment.roleId,
        editingAssignment.assignmentId,
        {
          collaboratorName: editingAssignment.form.collaboratorName,
          collaboratorEmail: editingAssignment.form.collaboratorEmail || undefined,
          status: editingAssignment.form.status,
        },
      );
      setEditingAssignment(null);
      setFeedback({ status: 'success', message: 'Assignment updated.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to update assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (roleId, assignmentId) => {
    if (!canManage) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await actions.deleteRoleAssignment(project.id, roleId, assignmentId);
      setFeedback({ status: 'success', message: 'Assignment removed.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message || 'Unable to remove assignment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentEditingAssignmentForm = editingAssignment?.form ?? null;

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.status === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Roles defined</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.totalRoles}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active collaborators</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.activeAssignments}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Invites pending</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.invitedAssignments}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Open seats</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summary.openSeats}</p>
        </div>
      </div>

      <form onSubmit={handleCreateRole} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-base font-semibold text-slate-900">Create a project role</h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm text-slate-700">
            Role name
            <input
              type="text"
              name="name"
              value={roleForm.name}
              onChange={(event) => handleRoleFieldChange(event, setRoleForm)}
              required
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Delivery lead"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700">
            Seat limit
            <input
              type="number"
              name="seatLimit"
              value={roleForm.seatLimit}
              onChange={(event) => handleRoleFieldChange(event, setRoleForm)}
              min={0}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="3"
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
            Description
            <textarea
              name="description"
              value={roleForm.description}
              onChange={(event) => handleRoleFieldChange(event, setRoleForm)}
              rows={3}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Responsibilities, approvals, or deliverables tied to this role."
            />
          </label>
          <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
            Permissions (comma list or JSON)
            <textarea
              name="permissions"
              value={roleForm.permissions}
              onChange={(event) => handleRoleFieldChange(event, setRoleForm)}
              rows={3}
              disabled={!canManage || submitting}
              className="mt-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="manage_budget, approve_tasks"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={!canManage || submitting}
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create role
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {roles.length ? (
          roles.map((role) => {
            const assignments = Array.isArray(role.assignments) ? role.assignments : [];
            const draft = buildAssignmentDraft(assignmentDrafts, role.id);
            const isEditingRole = editingRoleId === role.id;
            const editingThisAssignment =
              editingAssignment && editingAssignment.roleId === role.id ? editingAssignment : null;

            return (
              <article key={role.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {isEditingRole ? (
                  <form onSubmit={handleUpdateRole} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col text-sm text-slate-700">
                        Role name
                        <input
                          type="text"
                          name="name"
                          value={editingRoleForm.name}
                          onChange={(event) => handleRoleFieldChange(event, setEditingRoleForm)}
                          required
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col text-sm text-slate-700">
                        Seat limit
                        <input
                          type="number"
                          name="seatLimit"
                          value={editingRoleForm.seatLimit}
                          onChange={(event) => handleRoleFieldChange(event, setEditingRoleForm)}
                          min={0}
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
                        Description
                        <textarea
                          name="description"
                          value={editingRoleForm.description}
                          onChange={(event) => handleRoleFieldChange(event, setEditingRoleForm)}
                          rows={3}
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col text-sm text-slate-700 md:col-span-2">
                        Permissions (comma list or JSON)
                        <textarea
                          name="permissions"
                          value={editingRoleForm.permissions}
                          onChange={(event) => handleRoleFieldChange(event, setEditingRoleForm)}
                          rows={3}
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingRoleId(null)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent/40 hover:text-accent"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!canManage || submitting}
                        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save role
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{role.name}</h4>
                      {role.description ? (
                        <p className="text-sm text-slate-600">{role.description}</p>
                      ) : (
                        <p className="text-sm text-slate-500">No description provided.</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {role.seatLimit != null ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                            Seats: {role.assignments?.length ?? 0}/{role.seatLimit}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                            Unlimited seats
                          </span>
                        )}
                        {role.permissions ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accentSoft px-2 py-0.5 text-accent">
                            {Array.isArray(role.permissions)
                              ? `${role.permissions.length} permission${role.permissions.length === 1 ? '' : 's'}`
                              : 'Custom permissions'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditRole(role)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Edit role
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canManage || submitting}
                      >
                        Remove role
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-slate-800">Assignments</h5>
                  {assignments.length ? (
                    <ul className="space-y-2">
                      {assignments.map((assignment) => {
                        const isEditing = editingThisAssignment?.assignmentId === assignment.id;
                        return (
                          <li
                            key={assignment.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700"
                          >
                            {isEditing ? (
                              <form onSubmit={handleUpdateAssignment} className="space-y-3">
                                <div className="grid gap-3 md:grid-cols-3">
                                  <label className="flex flex-col text-sm text-slate-700">
                                    Name
                                    <input
                                      type="text"
                                      value={currentEditingAssignmentForm?.collaboratorName ?? ''}
                                      onChange={(event) =>
                                        setEditingAssignment((current) =>
                                          current && current.assignmentId === assignment.id
                                            ? {
                                                ...current,
                                                form: {
                                                  ...current.form,
                                                  collaboratorName: event.target.value,
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                      required
                                      disabled={!canManage || submitting}
                                      className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                    />
                                  </label>
                                  <label className="flex flex-col text-sm text-slate-700">
                                    Email
                                    <input
                                      type="email"
                                      value={currentEditingAssignmentForm?.collaboratorEmail ?? ''}
                                      onChange={(event) =>
                                        setEditingAssignment((current) =>
                                          current && current.assignmentId === assignment.id
                                            ? {
                                                ...current,
                                                form: {
                                                  ...current.form,
                                                  collaboratorEmail: event.target.value,
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                      disabled={!canManage || submitting}
                                      className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                    />
                                  </label>
                                  <label className="flex flex-col text-sm text-slate-700">
                                    Status
                                    <select
                                      value={currentEditingAssignmentForm?.status ?? 'invited'}
                                      onChange={(event) =>
                                        setEditingAssignment((current) =>
                                          current && current.assignmentId === assignment.id
                                            ? {
                                                ...current,
                                                form: {
                                                  ...current.form,
                                                  status: event.target.value,
                                                },
                                              }
                                            : current,
                                        )
                                      }
                                      disabled={!canManage || submitting}
                                      className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                                    >
                                      {ASSIGNMENT_STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setEditingAssignment(null)}
                                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-accent/40 hover:text-accent"
                                    disabled={submitting}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={!canManage || submitting}
                                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Save assignment
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <p className="font-semibold text-slate-800">{assignment.collaboratorName}</p>
                                  <p className="text-xs text-slate-500">
                                    {assignment.collaboratorEmail || 'No email provided'} • {assignment.status}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditAssignment(role.id, assignment)}
                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={!canManage || submitting}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAssignment(role.id, assignment.id)}
                                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={!canManage || submitting}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No collaborators assigned yet. Add your first teammate below.</p>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assign collaborator</h6>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <label className="flex flex-col text-sm text-slate-700">
                        Name
                        <input
                          type="text"
                          value={draft.collaboratorName}
                          onChange={(event) => handleAssignmentDraftChange(role.id, 'collaboratorName', event.target.value)}
                          placeholder="Jordan Rivera"
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col text-sm text-slate-700">
                        Email
                        <input
                          type="email"
                          value={draft.collaboratorEmail}
                          onChange={(event) => handleAssignmentDraftChange(role.id, 'collaboratorEmail', event.target.value)}
                          placeholder="jordan@gigvora.com"
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                      <label className="flex flex-col text-sm text-slate-700">
                        Status
                        <select
                          value={draft.status}
                          onChange={(event) => handleAssignmentDraftChange(role.id, 'status', event.target.value)}
                          disabled={!canManage || submitting}
                          className="mt-1 rounded-xl border border-slate-200 px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                          {ASSIGNMENT_STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleCreateAssignment(role.id)}
                        disabled={!canManage || submitting}
                        className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Assign collaborator
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
            Define roles to formalise responsibilities, permissions, and team capacity within this project workspace.
          </p>
        )}
      </div>
    </div>
  );
}

RolesManagementTab.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    roleDefinitions: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  actions: PropTypes.shape({
    createRoleDefinition: PropTypes.func.isRequired,
    updateRoleDefinition: PropTypes.func.isRequired,
    deleteRoleDefinition: PropTypes.func.isRequired,
    createRoleAssignment: PropTypes.func.isRequired,
    updateRoleAssignment: PropTypes.func.isRequired,
    deleteRoleAssignment: PropTypes.func.isRequired,
  }).isRequired,
  canManage: PropTypes.bool,
};

RolesManagementTab.defaultProps = {
  canManage: true,
};
