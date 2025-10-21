import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import { useCompanyLaunchpadJobs } from '../../hooks/useCompanyLaunchpadJobs.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const LOOKBACK_OPTIONS = [30, 60, 90, 120];
const menuSections = COMPANY_DASHBOARD_MENU_SECTIONS;
const AVAILABLE_DASHBOARDS = ['company', 'agency', 'headhunter', 'user'];

const toneStyles = {
  slate: { container: 'border-slate-100 bg-slate-50/60', icon: 'text-slate-600' },
  blue: { container: 'border-blue-100 bg-blue-50/60', icon: 'text-blue-600' },
  violet: { container: 'border-violet-100 bg-violet-50/60', icon: 'text-violet-600' },
  emerald: { container: 'border-emerald-100 bg-emerald-50/60', icon: 'text-emerald-600' },
  amber: { container: 'border-amber-100 bg-amber-50/60', icon: 'text-amber-600' },
};

function SummaryCard({ icon: Icon, title, value, helper, tone = 'slate' }) {
  const toneClass = toneStyles[tone] ?? toneStyles.slate;
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClass.container}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className="mt-1 text-xs text-slate-600">{helper}</p> : null}
        </div>
        <div className={`rounded-2xl bg-white p-3 shadow-sm ${toneClass.icon}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}


function formatNumber(value, fallback = '—') {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric.toLocaleString();
}


function SummaryGrid({ summary, totals }) {
  const cards = [
    {
      icon: BriefcaseIcon,
      title: 'Linked roles',
      value: formatNumber(summary?.totalLinks),
      helper: 'Launchpad-connected requisitions',
      tone: 'blue',
    },
    {
      icon: BuildingLibraryIcon,
      title: 'Launchpads',
      value: formatNumber(summary?.launchpads),
      helper: 'Programmes contributing talent',
      tone: 'violet',
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: 'Placements',
      value: formatNumber(summary?.totalPlacements),
      helper: `${formatNumber(summary?.activePlacements)} active`,
      tone: 'emerald',
    },
    {
      icon: CheckCircleIcon,
      title: 'Completed placements',
      value: formatNumber(totals?.completedPlacements),
      helper:
        totals?.averageFeedbackScore != null
          ? `Avg feedback ${Number(totals.averageFeedbackScore).toFixed(1)}`
          : 'Collect feedback to see quality trends.',
      tone: 'amber',
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function LinkList({
  links,
  onSelect,
  selectedLinkId,
  onRemove,
  onEdit,
}) {
  if (!links?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
        No Launchpad roles are linked yet. Connect a job to surface fellows and track placements in one place.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link) => {
        const isActive = selectedLinkId === link.id;
        const placements = link.metrics?.placements ?? 0;
        const activePlacements = link.metrics?.activePlacements ?? 0;
        return (
          <button
            key={link.id}
            type="button"
            onClick={() => onSelect(link)}
            className={`w-full rounded-3xl border p-4 text-left transition ${
              isActive
                ? 'border-blue-500 bg-blue-50/80 shadow-md'
                : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {link.job?.title ?? 'Job'}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.4em] text-slate-500">{link.launchpad?.title ?? 'Experience Launchpad'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span>Placements {placements}</span>
                  <span aria-hidden="true">•</span>
                  <span>Active {activePlacements}</span>
                  {link.advert?.status ? (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="capitalize">Advert {link.advert.status}</span>
                    </>
                  ) : null}
                  {link.updatedAt ? (
                    <>
                      <span aria-hidden="true">•</span>
                      <span title={formatAbsolute(link.updatedAt)}>
                        Updated {formatRelativeTime(link.updatedAt)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(link);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(link);
                  }}
                  className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  Remove
                </button>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PlacementTable({ placements, onUpdate, onRemove }) {
  if (!placements?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
        No placements recorded yet. Capture Launchpad fellow deployments to monitor fulfilment velocity and feedback scores.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Candidate</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Placement</th>
            <th className="px-4 py-3 text-left">Compensation</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {placements.map((placement) => {
            const candidateName = placement.candidate
              ? `${placement.candidate.firstName ?? ''} ${placement.candidate.lastName ?? ''}`.trim() || placement.candidate.email
              : `Candidate #${placement.candidateId}`;
            const compensation = placement.compensation ?? {};
            return (
              <tr key={placement.id} className="hover:bg-blue-50/30">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{candidateName}</p>
                  <p className="text-xs text-slate-500">ID {placement.candidateId}</p>
                </td>
                <td className="px-4 py-3 capitalize text-slate-700">{placement.status?.replace(/_/g, ' ') ?? 'scheduled'}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex flex-col gap-1 text-xs">
                    {placement.placementDate ? (
                      <span title={formatAbsolute(placement.placementDate)}>
                        Start {formatRelativeTime(placement.placementDate)}
                      </span>
                    ) : null}
                    {placement.endDate ? (
                      <span title={formatAbsolute(placement.endDate)}>
                        End {formatRelativeTime(placement.endDate)}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {compensation.amount != null ? (
                    <span className="font-semibold text-slate-900">
                      {new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: compensation.currency ?? compensation.currencyCode ?? 'USD',
                        maximumFractionDigits: 0,
                      }).format(compensation.amount)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Not recorded</span>
                  )}
                  {compensation.cadence || compensation.frequency ? (
                    <p className="text-xs text-slate-500">
                      {(compensation.cadence ?? compensation.frequency ?? '').replace(/_/g, ' ')}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdate(placement)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(placement)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CreateLinkForm({ lookups, onSubmit, saving }) {
  const [form, setForm] = useState({ launchpadId: '', jobId: '', notes: '' });

  useEffect(() => {
    if (!lookups?.launchpads?.length) {
      return;
    }
    setForm((current) => ({
      ...current,
      launchpadId: current.launchpadId || lookups.launchpads[0]?.id || '',
    }));
  }, [lookups?.launchpads]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.launchpadId || !form.jobId) {
      return;
    }
    onSubmit({
      launchpadId: Number(form.launchpadId),
      jobId: Number(form.jobId),
      notes: form.notes.trim() ? form.notes.trim() : undefined,
    }).then(() => {
      setForm({ launchpadId: lookups.launchpads?.[0]?.id ?? '', jobId: '', notes: '' });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Link Launchpad to job</p>
          <p className="text-xs text-slate-500">Create a shared command center for fellows and hiring pods.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:bg-blue-400"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Add link
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Launchpad programme</span>
          <select
            value={form.launchpadId}
            onChange={(event) => setForm((current) => ({ ...current, launchpadId: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          >
            <option value="" disabled>
              Select Launchpad
            </option>
            {(lookups?.launchpads ?? []).map((launchpad) => (
              <option key={launchpad.id} value={launchpad.id}>
                {launchpad.title}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Job advert</span>
          <select
            value={form.jobId}
            onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          >
            <option value="" disabled>
              Select job
            </option>
            {(lookups?.jobs ?? []).map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} {job.location ? `• ${job.location}` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-1 text-sm text-slate-700">
        <span className="font-semibold">Notes</span>
        <textarea
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          rows={3}
          placeholder="Capture sprint goals, guardrails, or cohort alignments for this role."
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </label>
    </form>
  );
}

function PlacementForm({ link, onCreate, onClose, saving }) {
  const [form, setForm] = useState({ candidateId: '', status: 'scheduled', placementDate: '', endDate: '', amount: '', currency: 'USD', cadence: 'monthly', notes: '' });

  if (!link) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.candidateId) {
      return;
    }
    onCreate(link.id, {
      candidateId: Number(form.candidateId),
      status: form.status,
      placementDate: form.placementDate || undefined,
      endDate: form.endDate || undefined,
      compensation:
        form.amount
          ? {
              amount: Number(form.amount),
              currency: form.currency,
              cadence: form.cadence,
              notes: form.notes?.trim() ? form.notes.trim() : undefined,
            }
          : undefined,
    }).then(() => {
      setForm({ candidateId: '', status: 'scheduled', placementDate: '', endDate: '', amount: '', currency: 'USD', cadence: 'monthly', notes: '' });
      onClose();
    });
  };

  return (
    <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Add Launchpad placement</p>
          <p className="text-xs text-slate-600">Document fellow deployments tied to this job link.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-blue-200 p-1 text-blue-600 transition hover:bg-white">
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Candidate ID</span>
          <input
            value={form.candidateId}
            onChange={(event) => setForm((current) => ({ ...current, candidateId: event.target.value }))}
            type="number"
            min="1"
            required
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Status</span>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Start date</span>
          <input
            type="date"
            value={form.placementDate}
            onChange={(event) => setForm((current) => ({ ...current, placementDate: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">End date</span>
          <input
            type="date"
            value={form.endDate}
            onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Compensation amount</span>
          <input
            type="number"
            value={form.amount}
            min="0"
            step="0.01"
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Currency</span>
          <input
            type="text"
            value={form.currency}
            onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase().slice(0, 3) }))}
            maxLength={3}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Cadence</span>
          <select
            value={form.cadence}
            onChange={(event) => setForm((current) => ({ ...current, cadence: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="monthly">Monthly retainer</option>
            <option value="project">Project-based</option>
            <option value="hourly">Hourly</option>
          </select>
        </label>
        <label className="md:col-span-2 space-y-1 text-sm text-slate-700">
          <span className="font-semibold">Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            rows={2}
            placeholder="Add context for this placement such as squad pairing or deliverable scope."
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-400"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Log placement
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CompanyLaunchpadJobManagementPage() {
  const { session, isAuthenticated } = useSession();
  const memberships = session?.memberships ?? [];
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const lookbackParam = searchParams.get('lookbackDays');
  const launchpadParam = searchParams.get('launchpadId');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 90, 7) : 90;
  const launchpadId = launchpadParam ? Number.parseInt(launchpadParam, 10) || undefined : undefined;

  const workspaceIdParam = searchParams.get('workspaceId');

  const isCompanyMember = isAuthenticated && memberships.includes('company');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? memberships.find((role) => role !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company/launchpad-jobs' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, memberships, session?.primaryDashboard, navigate]);

  const { data, loading, error, refresh, fromCache, lastUpdated, createLink, updateLink, removeLink, createPlacement, updatePlacement, removePlacement } =
    useCompanyLaunchpadJobs({
      workspaceId: workspaceIdParam,
      launchpadId,
      lookbackDays,
      enabled: isAuthenticated && isCompanyMember,
    });

  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [placementDrawerOpen, setPlacementDrawerOpen] = useState(false);
  const [placementSaving, setPlacementSaving] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [linkSaving, setLinkSaving] = useState(false);

  const links = data?.links ?? [];
  const summary = data?.summary ?? {};
  const totals = data?.totals ?? {};
  const lookups = data?.lookups ?? {};

  useEffect(() => {
    if (!selectedLinkId && links.length) {
      setSelectedLinkId(links[0].id);
    }
  }, [links, selectedLinkId]);

  const selectedLink = useMemo(() => links.find((link) => link.id === selectedLinkId) ?? null, [links, selectedLinkId]);

  const handleRemoveLink = async (link) => {
    if (!link) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this Launchpad link? Placements will also be detached.')) {
      return;
    }
    setFeedback(null);
    try {
      await removeLink(link.id);
      setFeedback({ type: 'success', message: 'Launchpad link removed.' });
      if (selectedLinkId === link.id) {
        setSelectedLinkId(null);
      }
    } catch (removeError) {
      setFeedback({ type: 'error', message: removeError?.message ?? 'Unable to remove link.' });
    }
  };

  const handleCreateLink = async (payload) => {
    setFeedback(null);
    setLinkSaving(true);
    try {
      await createLink(payload);
      setFeedback({ type: 'success', message: 'Launchpad link created.' });
    } catch (createError) {
      setFeedback({ type: 'error', message: createError?.message ?? 'Unable to create link.' });
    } finally {
      setLinkSaving(false);
    }
  };

  const handleEditLink = (link) => {
    setEditingLink(link);
    setEditNotes(link?.notes ?? '');
  };

  const handleUpdateLink = async () => {
    if (!editingLink) {
      return;
    }
    setFeedback(null);
    setLinkSaving(true);
    try {
      await updateLink(editingLink.id, { notes: editNotes });
      setFeedback({ type: 'success', message: 'Link notes updated.' });
      setEditingLink(null);
    } catch (updateError) {
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update link.' });
    } finally {
      setLinkSaving(false);
    }
  };

  const handleCreatePlacement = async (linkId, payload) => {
    setFeedback(null);
    setPlacementSaving(true);
    try {
      await createPlacement(linkId, payload);
      setFeedback({ type: 'success', message: 'Placement added.' });
    } catch (createError) {
      setFeedback({ type: 'error', message: createError?.message ?? 'Unable to add placement.' });
      throw createError;
    } finally {
      setPlacementSaving(false);
    }
  };

  const handleUpdatePlacement = async (placement) => {
    if (!placement) return;
    const status = window.prompt('Update status', placement.status ?? 'scheduled');
    if (!status) return;
    setFeedback(null);
    try {
      await updatePlacement(placement.id, { status });
      setFeedback({ type: 'success', message: 'Placement updated.' });
    } catch (updateError) {
      setFeedback({ type: 'error', message: updateError?.message ?? 'Unable to update placement.' });
    }
  };

  const handleRemovePlacement = async (placement) => {
    if (!placement) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm('Remove this placement record?')) {
      return;
    }
    setFeedback(null);
    try {
      await removePlacement(placement.id);
      setFeedback({ type: 'success', message: 'Placement removed.' });
    } catch (removeError) {
      setFeedback({ type: 'error', message: removeError?.message ?? 'Unable to remove placement.' });
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/launchpad-jobs' }} />;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Experience Launchpad jobs"
        subtitle="Align fellows with live requisitions"
        description="Link Experience Launchpad programmes to jobs, monitor placements, and capture feedback in one control room."
        menuSections={menuSections}
      >
        <AccessDeniedPanel
          role="company"
          availableDashboards={AVAILABLE_DASHBOARDS}
          onNavigate={(role) => navigate(`/dashboard/${role}`)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Experience Launchpad jobs"
      subtitle="Launchpad-linked requisitions"
      description="Create Launchpad/job pairings, orchestrate fellow placements, and track fulfilment signals with production-grade tooling."
      menuSections={menuSections}
    >
      <div className="space-y-6">
        <DataStatus loading={loading} error={error} lastUpdated={lastUpdated} fromCache={fromCache} onRetry={() => refresh({ force: true })} />

        {feedback ? (
          <div
            className={`rounded-3xl px-4 py-3 text-sm font-semibold ${
              feedback.type === 'error'
                ? 'border border-rose-200 bg-rose-50 text-rose-700'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Lookback</span>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
              {LOOKBACK_OPTIONS.map((option) => {
                const isActive = option === lookbackDays;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('lookbackDays', `${option}`);
                        return next;
                      }, { replace: true });
                    }}
                    className={`rounded-full px-3 py-1 font-semibold transition ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {option}d
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => refresh({ force: true })}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        <SummaryGrid summary={summary} totals={totals} />

        <CreateLinkForm lookups={lookups} onSubmit={handleCreateLink} saving={linkSaving} />

        {editingLink ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Update notes</p>
                <p className="text-xs text-slate-600">Capture context for {editingLink.job?.title ?? 'this job'} linked to {editingLink.launchpad?.title ?? 'Launchpad'}.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLink(null)}
                className="rounded-full border border-amber-200 p-1 text-amber-600 transition hover:bg-white"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <textarea
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleUpdateLink}
                  className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                >
                  Save notes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_minmax(0,1fr)]">
          <div className="space-y-4">
            <LinkList
              links={links}
              selectedLinkId={selectedLinkId}
              onSelect={(link) => setSelectedLinkId(link.id)}
              onRemove={handleRemoveLink}
              onEdit={handleEditLink}
            />
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setPlacementDrawerOpen(true)}
              disabled={!selectedLink}
              className="w-full rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
            >
              Log placement for {selectedLink?.job?.title ?? 'selected job'}
            </button>

            <PlacementTable
              placements={selectedLink?.placements}
              onUpdate={handleUpdatePlacement}
              onRemove={handleRemovePlacement}
            />
          </div>
        </div>

        {placementDrawerOpen ? (
          <PlacementForm
            link={selectedLink}
            onCreate={handleCreatePlacement}
            onClose={() => setPlacementDrawerOpen(false)}
            saving={placementSaving}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

