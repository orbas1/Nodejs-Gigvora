import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import AgencyEditorModal from './AgencyEditorModal.jsx';
import {
  listAdminAgencies,
  createAdminAgency,
  updateAdminAgency,
  archiveAdminAgency,
} from '../../../services/adminAgencyManagement.js';

const STATUS_BADGES = {
  active: 'bg-emerald-100 text-emerald-700',
  invited: 'bg-sky-100 text-sky-700',
  suspended: 'bg-amber-100 text-amber-700',
  archived: 'bg-slate-200 text-slate-600',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

function SummaryCard({ title, value, description }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string.isRequired,
};

export default function AdminAgencyManagementSection() {
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [agencies, setAgencies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [editorState, setEditorState] = useState({ open: false, mode: 'create', initialValues: null });
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAgencies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listAdminAgencies({
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        sort: 'name_asc',
      });
      setAgencies(Array.isArray(response?.items) ? response.items : []);
      setSummary(response?.summary ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load agencies.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  const handleSearchChange = (event) => {
    setFilters((previous) => ({ ...previous, search: event.target.value }));
  };

  const handleStatusChange = (event) => {
    setFilters((previous) => ({ ...previous, status: event.target.value }));
  };

  const openCreateModal = () => {
    setEditorState({ open: true, mode: 'create', initialValues: null });
  };

  const openEditModal = (agency) => {
    setEditorState({ open: true, mode: 'edit', initialValues: agency });
  };

  const closeEditor = () => {
    if (submitting) return;
    setEditorState({ open: false, mode: 'create', initialValues: null });
    setError('');
  };

  const handleEditorSubmit = async (payload) => {
    setSubmitting(true);
    setStatusMessage('');
    try {
      if (editorState.mode === 'create') {
        await createAdminAgency(payload);
        setStatusMessage('Agency workspace created successfully.');
      } else if (editorState.initialValues?.id) {
        await updateAdminAgency(editorState.initialValues.id, payload);
        setStatusMessage('Agency workspace updated.');
      }
      setEditorState({ open: false, mode: 'create', initialValues: null });
      await loadAgencies();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save agency.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!confirmArchive) {
      return;
    }
    setSubmitting(true);
    setStatusMessage('');
    try {
      await archiveAdminAgency(confirmArchive.id);
      setStatusMessage(`Archived ${confirmArchive.agencyName}.`);
      setConfirmArchive(null);
      await loadAgencies();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive agency.');
    } finally {
      setSubmitting(false);
    }
  };

  const summaryCards = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        title: 'Total agencies',
        value: summary.total ?? 0,
        description: 'Workspaces with dedicated agency permissions.',
      },
      {
        title: 'Active',
        value: summary.statuses?.active ?? 0,
        description: 'Live and operational agency seats.',
      },
      {
        title: 'Suspended',
        value: summary.statuses?.suspended ?? 0,
        description: 'Temporarily restricted for compliance review.',
      },
      {
        title: 'Average team size',
        value: summary.averageTeamSize != null ? summary.averageTeamSize : '—',
        description: 'Based on declared workforce capacity.',
      },
    ];
  }, [summary]);

  return (
    <section id="admin-agency-management" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Agency management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Provision and govern agency workspaces, ensuring operational readiness across every client-facing team.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadAgencies}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
          >
            <ArrowPathIcon className="h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New agency
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
          <input
            type="search"
            placeholder="Search by agency or owner"
            value={filters.search}
            onChange={handleSearchChange}
            className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none"
          />
        </div>
        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th scope="col" className="px-6 py-4">
                Agency
              </th>
              <th scope="col" className="px-6 py-4">
                Owner
              </th>
              <th scope="col" className="px-6 py-4">
                Focus
              </th>
              <th scope="col" className="px-6 py-4">
                Team size
              </th>
              <th scope="col" className="px-6 py-4">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                  Loading agencies…
                </td>
              </tr>
            ) : agencies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                  {filters.search ? 'No agencies match the current filters.' : 'No agencies provisioned yet.'}
                </td>
              </tr>
            ) : (
              agencies.map((agency) => (
                <tr key={agency.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                        <BuildingOffice2Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{agency.agencyName}</p>
                        <p className="text-xs text-slate-500">{agency.location || 'Location pending'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {agency.owner?.firstName} {agency.owner?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{agency.owner?.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{agency.focusArea || '—'}</p>
                    <p className="text-xs text-slate-400">{agency.services?.slice(0, 2).join(', ') || 'Services TBD'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{agency.teamSize ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        STATUS_BADGES[agency.owner?.status] ?? 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {agency.owner?.status ?? 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(agency)}
                        className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmArchive(agency)}
                        className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AgencyEditorModal
        open={editorState.open}
        mode={editorState.mode === 'edit' ? 'edit' : 'create'}
        initialValues={editorState.initialValues ?? undefined}
        saving={submitting}
        onClose={closeEditor}
        onSubmit={handleEditorSubmit}
      />

      {confirmArchive ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Archive agency workspace?</h3>
                <p className="text-sm text-slate-500">
                  This will suspend owner access and mark the workspace as archived. You can reactivate it later from this panel.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => (submitting ? null : setConfirmArchive(null))}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchive}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                disabled={submitting}
              >
                {submitting ? 'Archiving…' : 'Archive agency'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

