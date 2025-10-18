import { useMemo, useState } from 'react';
import {
  EMPLOYMENT_TYPES,
  MEMBER_STATUSES,
  resolveOptionLabel,
} from '../../../constants/agencyWorkforce.js';

function formatDateValue(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function parseSkillList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function MemberForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save member',
  canDelete = false,
  onDelete,
}) {
  const [formState, setFormState] = useState(() => ({
    workspaceId: initialData?.workspaceId ?? null,
    fullName: initialData?.fullName ?? '',
    title: initialData?.title ?? '',
    employmentType: initialData?.employmentType ?? 'contract',
    status: initialData?.status ?? 'active',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
    location: initialData?.location ?? '',
    startDate: formatDateValue(initialData?.startDate),
    endDate: formatDateValue(initialData?.endDate),
    capacityHoursPerWeek: initialData?.capacityHoursPerWeek ?? 40,
    allocationPercent: initialData?.allocationPercent ?? 0,
    benchAllocationPercent: initialData?.benchAllocationPercent ?? 0,
    hourlyRate: initialData?.hourlyRate ?? '',
    billableRate: initialData?.billableRate ?? '',
    costCenter: initialData?.costCenter ?? '',
    skills: Array.isArray(initialData?.skills) ? initialData.skills.join(', ') : '',
    notes: initialData?.notes ?? '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formState,
        workspaceId: initialData?.workspaceId ?? formState.workspaceId ?? null,
        capacityHoursPerWeek:
          formState.capacityHoursPerWeek === '' ? null : Number.parseFloat(formState.capacityHoursPerWeek),
        allocationPercent:
          formState.allocationPercent === '' ? null : Number.parseFloat(formState.allocationPercent),
        benchAllocationPercent:
          formState.benchAllocationPercent === '' ? null : Number.parseFloat(formState.benchAllocationPercent),
        hourlyRate: formState.hourlyRate === '' ? null : Number.parseFloat(formState.hourlyRate),
        billableRate: formState.billableRate === '' ? null : Number.parseFloat(formState.billableRate),
        startDate: formState.startDate ? new Date(formState.startDate) : null,
        endDate: formState.endDate ? new Date(formState.endDate) : null,
        skills: parseSkillList(formState.skills),
      };
      await onSubmit(payload);
    } catch (submissionError) {
      setError(submissionError?.message ?? 'Unable to save member');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{submitLabel}</h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Full name
                <input
                  name="fullName"
                  value={formState.fullName}
                  onChange={handleChange}
                  required
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Role title
                <input
                  name="title"
                  value={formState.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior PM"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Employment type
                <select
                  name="employmentType"
                  value={formState.employmentType}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                >
                  {EMPLOYMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Status
                <select
                  name="status"
                  value={formState.status}
                  onChange={handleChange}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                >
                  {MEMBER_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Work email
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  placeholder="name@gigvora.agency"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Phone
                <input
                  name="phone"
                  value={formState.phone}
                  onChange={handleChange}
                  placeholder="+1 555 000 1234"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Location
                <input
                  name="location"
                  value={formState.location}
                  onChange={handleChange}
                  placeholder="Remote"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Start date
                  <input
                    type="date"
                    name="startDate"
                    value={formState.startDate}
                    onChange={handleChange}
                    className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  End date
                  <input
                    type="date"
                    name="endDate"
                    value={formState.endDate}
                    onChange={handleChange}
                    className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Weekly capacity (hrs)
                <input
                  type="number"
                  name="capacityHoursPerWeek"
                  value={formState.capacityHoursPerWeek}
                  onChange={handleChange}
                  min="0"
                  max="400"
                  step="0.5"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Allocation (%)
                  <input
                    type="number"
                    name="allocationPercent"
                    value={formState.allocationPercent}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="1"
                    className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Bench (%)
                  <input
                    type="number"
                    name="benchAllocationPercent"
                    value={formState.benchAllocationPercent}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="1"
                    className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Cost rate ($/hr)
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formState.hourlyRate}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  Billable rate ($/hr)
                  <input
                    type="number"
                    name="billableRate"
                    value={formState.billableRate}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Cost center
                <input
                  name="costCenter"
                  value={formState.costCenter}
                  onChange={handleChange}
                  placeholder="e.g. CX-Delivery"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                Skills and certifications
                <input
                  name="skills"
                  value={formState.skills}
                  onChange={handleChange}
                  placeholder="Comma separated list"
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700 md:col-span-2">
                Notes
                <textarea
                  name="notes"
                  value={formState.notes}
                  onChange={handleChange}
                  rows={3}
                  className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none"
                />
              </label>
            </div>
            {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                Remove member
              </button>
            ) : (
              <span className="text-xs text-slate-400">&nbsp;</span>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkforceMemberManager({
  members = [],
  workspaceId,
  canEdit = false,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [modalState, setModalState] = useState({ open: false, memberId: null, mode: 'create' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const resolvedMembers = useMemo(() => {
    let filtered = Array.isArray(members) ? [...members] : [];
    if (statusFilter !== 'all') {
      filtered = filtered.filter((member) => member.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((member) =>
        [member.fullName, member.title, member.email, member.location].some((value) =>
          value ? `${value}`.toLowerCase().includes(lower) : false,
        ),
      );
    }
    return filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [members, searchTerm, statusFilter]);

  const openCreate = () => {
    setModalState({ open: true, memberId: null, mode: 'create' });
  };

  const openEdit = (memberId) => {
    setModalState({ open: true, memberId, mode: 'edit' });
  };

  const closeModal = () => {
    setModalState({ open: false, memberId: null, mode: 'create' });
  };

  const activeMember = useMemo(() => {
    if (!modalState.open) return null;
    if (modalState.mode === 'create') {
      return { workspaceId };
    }
    return members.find((member) => member.id === modalState.memberId) ?? null;
  }, [modalState, members, workspaceId]);

  const handleCreate = async (payload) => {
    if (!onCreate) return;
    await onCreate({ ...payload, workspaceId: workspaceId ?? payload.workspaceId });
    closeModal();
  };

  const handleUpdate = async (payload) => {
    if (!onUpdate || !modalState.memberId) return;
    await onUpdate(modalState.memberId, { ...payload, workspaceId: workspaceId ?? payload.workspaceId });
    closeModal();
  };

  const handleDelete = async () => {
    if (!onDelete || !modalState.memberId) return;
    await onDelete(modalState.memberId, { workspaceId });
    closeModal();
  };

  const emptyState = (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm font-medium text-slate-600">
      No team members yet.
      {canEdit ? (
        <button
          type="button"
          onClick={openCreate}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Add member
        </button>
      ) : null}
    </div>
  );

  return (
    <section id="team" className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Team</h2>
        {canEdit ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add member
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50/80 p-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-slate-500">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 focus:border-blue-300 focus:outline-none"
          >
            <option value="all">All</option>
            {MEMBER_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex-1" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search team"
          className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none sm:w-64"
        />
      </div>
      {!resolvedMembers.length ? (
        emptyState
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Member</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Employment</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Allocation</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Cost / Billable</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/70">
              {resolvedMembers.map((member) => {
                const allocation = member.allocationPercent ?? 0;
                const benchPercent = member.benchAllocationPercent ?? 0;
                return (
                  <tr key={member.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{member.fullName}</div>
                      <div className="text-xs text-slate-500">{member.title || '—'}</div>
                      <div className="text-xs text-slate-400">{member.email || 'No email'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">
                        {resolveOptionLabel(EMPLOYMENT_TYPES, member.employmentType, member.employmentType)}
                      </div>
                      <div className="text-xs font-medium capitalize text-slate-500">
                        {resolveOptionLabel(MEMBER_STATUSES, member.status, member.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{allocation?.toFixed?.(0) ?? allocation}%</div>
                      <div className="text-xs text-slate-500">Bench {benchPercent?.toFixed?.(0) ?? benchPercent}%</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">
                        {member.hourlyRate != null ? `$${Number(member.hourlyRate).toFixed(2)}` : '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {member.billableRate != null ? `$${Number(member.billableRate).toFixed(2)}` : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(member.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                        >
                          View
                        </button>
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => openEdit(member.id)}
                            className="rounded-full border border-blue-500 bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {modalState.open ? (
        <MemberForm
          key={modalState.memberId ?? 'new-member'}
          initialData={activeMember}
          submitLabel={modalState.mode === 'create' ? 'Create member' : 'Save changes'}
          onSubmit={modalState.mode === 'create' ? handleCreate : handleUpdate}
          onCancel={closeModal}
          canDelete={modalState.mode === 'edit' && canEdit}
          onDelete={canEdit ? handleDelete : undefined}
        />
      ) : null}
    </section>
  );
}
