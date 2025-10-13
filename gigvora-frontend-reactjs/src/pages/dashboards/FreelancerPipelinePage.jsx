import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import useSession from '../../hooks/useSession.js';
import {
  fetchFreelancerPipelineDashboard,
  createPipelineDeal,
  updatePipelineDeal,
  createPipelineProposal,
  createPipelineFollowUp,
  updatePipelineFollowUp,
  createPipelineCampaign,
} from '../../services/pipeline.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import RoleGate from '../../components/access/RoleGate.jsx';
import useRoleAccess from '../../hooks/useRoleAccess.js';

const viewLabels = {
  stage: 'Pipeline stages',
  industry: 'Industry segments',
  retainer_size: 'Retainer tiers',
  probability: 'Win likelihood',
};

function EmptyOwnerState({ title }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <p className="mt-2 text-xs text-slate-500">
        Sign in with a freelancer workspace to activate pipeline management.
      </p>
    </div>
  );
}

function formatCurrency(value) {
  if (value == null) return '$0';
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  return formatter.format(Number(value));
}

function formatPercent(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '0%';
  return `${Math.round(numeric)}%`;
}

function PipelineSummary({ summary }) {
  const cards = [
    { label: 'Open deals', value: summary.openDeals },
    { label: 'Won deals', value: summary.wonDeals },
    { label: 'Lost deals', value: summary.lostDeals },
    { label: 'Pipeline value', value: formatCurrency(summary.pipelineValue) },
    { label: 'Weighted pipeline', value: formatCurrency(summary.weightedPipelineValue) },
    { label: 'Follow-ups due (14d)', value: summary.nextFollowUps },
  ];
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</dt>
          <dd className="mt-2 text-2xl font-semibold text-slate-900">
            {typeof card.value === 'string' ? card.value : new Intl.NumberFormat('en-US').format(card.value ?? 0)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PipelineColumn({ column, stages, onStageChange }) {
  return (
    <div className="flex min-w-[280px] flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{column.name}</h3>
          <span className="text-xs font-medium text-slate-500">{formatCurrency(column.totalValue)}</span>
        </div>
        {column.weightedValue != null ? (
          <p className="text-xs text-slate-400">Weighted: {formatCurrency(column.weightedValue)}</p>
        ) : null}
      </div>
      <div className="space-y-3">
        {column.deals?.length ? (
          column.deals.map((deal) => (
            <div key={deal.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{deal.title}</p>
                  <p className="text-xs text-slate-500">{deal.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(deal.pipelineValue)}</p>
                  <p className="text-xs text-slate-400">{formatPercent(deal.winProbability)}</p>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-xs text-slate-500">
                {deal.industry ? <p>Industry: {deal.industry}</p> : null}
                {deal.retainerSize ? <p>Retainer tier: {deal.retainerSize}</p> : null}
                {deal.expectedCloseDate ? (
                  <p title={formatAbsolute(deal.expectedCloseDate)}>
                    Expected close {formatRelativeTime(deal.expectedCloseDate)}
                  </p>
                ) : null}
                {deal.nextFollowUpAt ? (
                  <p title={formatAbsolute(deal.nextFollowUpAt)}>Next follow-up {formatRelativeTime(deal.nextFollowUpAt)}</p>
                ) : null}
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Move to stage
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                    value={deal.stageId}
                    onChange={(event) => onStageChange(deal, Number(event.target.value))}
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-400">
            No deals in this column yet.
          </p>
        )}
      </div>
    </div>
  );
}

function DealsKanban({ grouping, stages, onStageChange }) {
  if (!grouping?.columns?.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No deals available. Add your first opportunity to start tracking the pipeline.
      </div>
    );
  }
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {grouping.columns.map((column) => (
        <PipelineColumn key={column.name ?? column.id} column={column} stages={stages} onStageChange={onStageChange} />
      ))}
    </div>
  );
}

function NewDealForm({ stages, campaigns, ownerId, onCreated }) {
  if (!ownerId) {
    return <EmptyOwnerState title="Add new relationship" />;
  }
  const [form, setForm] = useState({
    title: '',
    clientName: '',
    pipelineValue: '',
    winProbability: '',
    industry: '',
    retainerSize: '',
    campaignId: '',
    stageId: stages[0]?.id ?? '',
    expectedCloseDate: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      stageId: previous.stageId || stages[0]?.id || '',
    }));
  }, [stages]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPipelineDeal(ownerId, {
        ...form,
        pipelineValue: form.pipelineValue ? Number(form.pipelineValue) : undefined,
        winProbability: form.winProbability ? Number(form.winProbability) : undefined,
        campaignId: form.campaignId || undefined,
        stageId: form.stageId || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
        notes: form.notes || undefined,
      });
      setForm({
        title: '',
        clientName: '',
        pipelineValue: '',
        winProbability: '',
        industry: '',
        retainerSize: '',
        campaignId: '',
        stageId: stages[0]?.id ?? '',
        expectedCloseDate: '',
        notes: '',
      });
      onCreated?.();
    } catch (submitError) {
      setError(submitError.message || 'Failed to create deal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">Add new relationship</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-xs font-medium text-slate-500">
          Opportunity title
          <input
            required
            name="title"
            value={form.title}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="Retainer redesign + growth"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Client / account name
          <input
            required
            name="clientName"
            value={form.clientName}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="Aurora Labs"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Stage
          <select
            name="stageId"
            value={form.stageId}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Deal value (USD)
          <input
            name="pipelineValue"
            value={form.pipelineValue}
            onChange={handleChange}
            type="number"
            min="0"
            step="100"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="18000"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Win probability (%)
          <input
            name="winProbability"
            value={form.winProbability}
            onChange={handleChange}
            type="number"
            min="0"
            max="100"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="45"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Industry
          <input
            name="industry"
            value={form.industry}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="Fintech"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Retainer tier
          <input
            name="retainerSize"
            value={form.retainerSize}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="$5-10k monthly"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Campaign linkage
          <select
            name="campaignId"
            value={form.campaignId}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Expected close date
          <input
            name="expectedCloseDate"
            type="date"
            value={form.expectedCloseDate}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
        </label>
        <label className="md:col-span-2 text-xs font-medium text-slate-500">
          Notes
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows="3"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="Key stakeholders, goals, and next steps"
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Add to pipeline'}
        </button>
      </div>
    </form>
  );
}

function NewProposalForm({ deals, templates, ownerId, onCreated }) {
  if (!ownerId) {
    return <EmptyOwnerState title="Draft proposal" />;
  }
  const [form, setForm] = useState({ dealId: deals[0]?.id ?? '', templateId: '', status: 'draft', sentAt: '', acceptedAt: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      dealId: deals[0]?.id ?? '',
    }));
  }, [deals]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPipelineProposal(ownerId, {
        dealId: form.dealId,
        templateId: form.templateId || undefined,
        status: form.status,
        sentAt: form.sentAt || undefined,
        acceptedAt: form.acceptedAt || undefined,
      });
      onCreated?.();
    } catch (submitError) {
      setError(submitError.message || 'Failed to create proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const noDeals = deals.length === 0;

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">Generate proposal package</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-500">
          Deal
          <select
            required
            name="dealId"
            value={form.dealId}
            onChange={handleChange}
            disabled={noDeals}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <option value="" disabled>
              Select opportunity
            </option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.title} — {deal.clientName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Template
          <select
            name="templateId"
            value={form.templateId}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Start from scratch</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Sent date
          <input
            name="sentAt"
            type="date"
            value={form.sentAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Accepted date
          <input
            name="acceptedAt"
            type="date"
            value={form.acceptedAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
        </label>
      </div>
      {noDeals ? (
        <p className="mt-3 text-xs text-slate-500">Add a deal to unlock proposal generation.</p>
      ) : null}
      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting || noDeals}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Composing…' : 'Create proposal'}
        </button>
      </div>
    </form>
  );
}

function NewFollowUpForm({ deals, ownerId, onSaved }) {
  if (!ownerId) {
    return <EmptyOwnerState title="Schedule follow-up" />;
  }
  const [form, setForm] = useState({ dealId: deals[0]?.id ?? '', dueAt: '', channel: 'email', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      dealId: deals[0]?.id ?? '',
    }));
  }, [deals]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPipelineFollowUp(ownerId, {
        dealId: form.dealId,
        dueAt: form.dueAt,
        channel: form.channel,
        note: form.note,
      });
      onSaved?.();
    } catch (submitError) {
      setError(submitError.message || 'Failed to schedule follow-up.');
    } finally {
      setSubmitting(false);
    }
  };

  const noDeals = deals.length === 0;

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">Schedule follow-up</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-500">
          Deal
          <select
            required
            name="dealId"
            value={form.dealId}
            onChange={handleChange}
            disabled={noDeals}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <option value="" disabled>
              Select opportunity
            </option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Due date
          <input
            required
            name="dueAt"
            type="datetime-local"
            value={form.dueAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Channel
          <select
            name="channel"
            value={form.channel}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <option value="email">Email</option>
            <option value="call">Call</option>
            <option value="dm">DM</option>
            <option value="meeting">Meeting</option>
          </select>
        </label>
        <label className="sm:col-span-2 text-xs font-medium text-slate-500">
          Notes
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            rows="3"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="Context, promises, and supporting links"
          />
        </label>
      </div>
      {noDeals ? (
        <p className="mt-3 text-xs text-slate-500">Add a deal to queue personalised follow-ups.</p>
      ) : null}
      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting || noDeals}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Scheduling…' : 'Add follow-up'}
        </button>
      </div>
    </form>
  );
}

function NewCampaignForm({ ownerId, onCreated }) {
  if (!ownerId) {
    return <EmptyOwnerState title="Launch nurture campaign" />;
  }
  const [form, setForm] = useState({
    name: '',
    targetService: '',
    status: 'draft',
    launchDate: '',
    endDate: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPipelineCampaign(ownerId, {
        ...form,
        launchDate: form.launchDate || undefined,
        endDate: form.endDate || undefined,
      });
      setForm({ name: '', targetService: '', status: 'draft', launchDate: '', endDate: '', description: '' });
      onCreated?.();
    } catch (submitError) {
      setError(submitError.message || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">Launch cross-sell campaign</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-500">
          Campaign name
          <input
            required
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="Podcast sponsorship upsell"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Target service
          <input
            name="targetService"
            value={form.targetService}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="Brand strategy retainers"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Launch date
          <input
            name="launchDate"
            type="date"
            value={form.launchDate}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          End date
          <input
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
        </label>
        <label className="sm:col-span-2 text-xs font-medium text-slate-500">
          Messaging brief
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
            placeholder="Segments, sequences, incentives, and supporting assets"
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Launching…' : 'Save campaign'}
        </button>
      </div>
    </form>
  );
}

function FollowUpList({ followUps, onComplete }) {
  if (!followUps.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No follow-ups scheduled.</div>
    );
  }
  return (
    <div className="space-y-3">
      {followUps.map((followUp) => (
        <div key={followUp.id} className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">{followUp.deal?.title ?? 'Opportunity'}</p>
            <p className="text-xs text-slate-500">
              {followUp.channel ? `${followUp.channel.toUpperCase()} • ` : ''}
              Due {formatRelativeTime(followUp.dueAt)} ({formatAbsolute(followUp.dueAt)})
            </p>
            {followUp.note ? <p className="text-xs text-slate-500">{followUp.note}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {followUp.status !== 'completed' ? (
              <button
                type="button"
                onClick={() => onComplete(followUp)}
                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-700"
              >
                Mark complete
              </button>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Completed</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProposalLibrary({ proposals, templates }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">Active proposals</h3>
        {proposals.length ? (
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {proposals.map((proposal) => (
              <li key={proposal.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{proposal.title}</p>
                    <p className="text-xs text-slate-500">
                      {proposal.deal?.clientName ? `${proposal.deal.clientName} — ` : ''}
                      Status: {proposal.status}
                    </p>
                  </div>
                  {proposal.sentAt ? (
                    <p className="text-xs text-slate-400">Sent {formatRelativeTime(proposal.sentAt)}</p>
                  ) : null}
                </div>
                {proposal.template ? (
                  <p className="mt-2 text-xs text-slate-500">Template: {proposal.template.name}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No proposals yet. Create one from the template library.</p>
        )}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">Template library</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">{template.name}</p>
              <p className="mt-2 text-xs text-slate-500">{template.description}</p>
              {Array.isArray(template.caseStudies) && template.caseStudies.length ? (
                <ul className="mt-3 space-y-1 text-xs text-slate-500">
                  {template.caseStudies.map((study) => (
                    <li key={study.title}>
                      <span className="font-semibold text-slate-600">{study.title}:</span> {study.outcome}
                    </li>
                  ))}
                </ul>
              ) : null}
              {template.roiCalculator ? (
                <p className="mt-3 text-xs text-emerald-600">
                  ROI model ready — investment ${template.roiCalculator.investment?.toLocaleString?.() ?? template.roiCalculator.investment}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FreelancerPipelinePage() {
  const { session, hasAccess } = useRoleAccess(['freelancer']);
  const ownerId = session?.freelancerId ?? DEFAULT_OWNER_ID;
  const [view, setView] = useState('stage');
  const [lookbackDays, setLookbackDays] = useState(30);

  const menuSections = useMemo(
    () => [
      {
        label: 'Growth & profile',
        items: [
          {
            name: 'Freelancer operations HQ',
            description: 'Return to the overview dashboard.',
            to: '/dashboard/freelancer',
          },
          {
            name: 'Pipeline CRM',
            description: 'Track leads, proposals, follow-ups, and campaigns.',
            to: '/dashboard/freelancer/pipeline',
          },
        ],
      },
    ],
    [],
  );

  const profile = useMemo(() => {
    if (!session) {
      return {
        name: 'Riley Morgan',
        role: 'Lead Brand & Product Designer',
        initials: 'RM',
        status: 'Relationship pipeline',
        badges: ['Gigvora Elite'],
      };
    }

    const name = session.name ?? 'Freelancer';
    const initials = name
      .split(' ')
      .map((part) => part?.[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'GV';

    return {
      name,
      role: session.title ?? 'Freelancer pipeline member',
      initials,
      status: 'Relationship pipeline',
      badges: ['Gigvora Elite'],
    };
  }, [session]);

  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    `freelancer:pipeline:${ownerId}:${view}:${lookbackDays}`,
    ({ signal }) => fetchFreelancerPipelineDashboard(ownerId, { view, lookbackDays, signal }),
    { dependencies: [ownerId, view, lookbackDays], enabled: hasAccess },
export default function FreelancerPipelinePage() {
  const { session } = useSession();
  const rawOwnerId = session?.id;
  const numericOwnerId =
    rawOwnerId == null ? null : Number.isInteger(rawOwnerId) ? rawOwnerId : Number.parseInt(rawOwnerId, 10);
  const ownerId = Number.isInteger(numericOwnerId) && numericOwnerId > 0 ? numericOwnerId : null;
  const canLoad = ownerId != null;
  const [view, setView] = useState('stage');
  const { data, error, loading, fromCache, lastUpdated, refresh } = useCachedResource(
    canLoad ? `freelancer:pipeline:${ownerId}:${view}` : `freelancer:pipeline:pending:${view}`,
    ({ signal }) => {
      if (!canLoad) {
        return Promise.reject(new Error('Pipeline owner is not available.'));
      }
      return fetchFreelancerPipelineDashboard(ownerId, { view, signal });
    },
    { dependencies: [ownerId, view], enabled: canLoad },
  );

  const summary = data?.summary ?? {
    openDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    pipelineValue: 0,
    weightedPipelineValue: 0,
    nextFollowUps: 0,
  };
  const stages = data?.stages ?? [];
  const grouping = data?.grouping ?? { type: view, columns: [] };
  const deals = data?.deals ?? [];
  const templates = data?.templates ?? [];
  const followUps = data?.followUps ?? [];
  const campaigns = data?.campaigns ?? [];
  const viewOptions = data?.viewOptions ?? ['stage', 'industry', 'retainer_size', 'probability'];

  const stageOptions = useMemo(() => stages, [stages]);

  const handleStageChange = async (deal, stageId) => {
    if (!ownerId) return;
    if (stageId === deal.stageId) return;
    try {
      await updatePipelineDeal(ownerId, deal.id, { stageId });
      refresh({ force: true });
    } catch (updateError) {
      console.error('Failed to update deal stage', updateError);
    }
  };

  const handleFollowUpComplete = async (followUp) => {
    if (!ownerId) return;
    try {
      await updatePipelineFollowUp(ownerId, followUp.id, { status: 'completed', completedAt: new Date().toISOString() });
      refresh({ force: true });
    } catch (updateError) {
      console.error('Failed to complete follow-up', updateError);
    }
  };

  return (
    <RoleGate allowedRoles={['freelancer']} featureName="Freelancer pipeline workspace">
      <DashboardLayout
        currentDashboard="freelancer-pipeline"
        title="Pipeline CRM"
        subtitle="Relationship command center"
        description="Dedicated CRM for nurturing retainers, proposals, and cross-sell plays beyond day-to-day gig delivery."
        menuSections={menuSections}
        sections={[]}
        profile={profile}
        availableDashboards={[
          { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
          { id: 'freelancer-pipeline', label: 'Pipeline HQ', href: '/dashboard/freelancer/pipeline' },
          { id: 'user', label: 'Talent', href: '/dashboard/user' },
          { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
        ]}
      >
      <div className="space-y-8 px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={() => refresh({ force: true })} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Group by</span>
              <select
                value={view}
                onChange={(event) => setView(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
              >
                {viewOptions.map((option) => (
                  <option key={option} value={option}>
                    {viewLabels[option] ?? option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lookback</span>
              <select
                value={lookbackDays}
                onChange={(event) => setLookbackDays(Number(event.target.value))}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
              >
                {[14, 30, 60, 90].map((days) => (
                  <option key={days} value={days}>
                    Last {days} days
                  </option>
                ))}
              </select>
            </div>
          <DataStatus
            loading={loading && canLoad}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => {
              if (canLoad) {
                refresh({ force: true });
              }
            }}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Group by</span>
            <select
              value={view}
              onChange={(event) => setView(event.target.value)}
              disabled={!canLoad}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {viewOptions.map((option) => (
                <option key={option} value={option}>
                  {viewLabels[option] ?? option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <PipelineSummary summary={summary} />

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{viewLabels[grouping.type] ?? 'Pipeline view'}</h2>
            {error ? <p className="text-sm text-rose-600">{error.message || 'Unable to load pipeline data.'}</p> : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Drag-and-drop style pipeline with segmentation by stage, industry, retainer tier, or likelihood to close.
          </p>
          <div className="mt-6">
            <DealsKanban grouping={grouping} stages={stageOptions} onStageChange={handleStageChange} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <NewDealForm
            stages={stageOptions}
            campaigns={campaigns}
            ownerId={ownerId}
            onCreated={() => refresh({ force: true })}
          />
          <ProposalLibrary proposals={data?.proposals ?? []} templates={templates} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <NewProposalForm deals={deals} templates={templates} ownerId={ownerId} onCreated={() => refresh({ force: true })} />
            <NewCampaignForm ownerId={ownerId} onCreated={() => refresh({ force: true })} />
          </div>
          <div className="space-y-6">
            <NewFollowUpForm deals={deals} ownerId={ownerId} onSaved={() => refresh({ force: true })} />
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">Follow-up queue</h3>
              <div className="mt-4">
                <FollowUpList followUps={followUps} onComplete={handleFollowUpComplete} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Campaign performance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Measure cross-selling efforts, nurture cadences, and upsell experiments that run outside your gig delivery boards.
          </p>
          {campaigns.length ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{campaign.name}</p>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {campaign.status}
                    </span>
                  </div>
                  {campaign.targetService ? (
                    <p className="mt-2 text-xs text-slate-500">Target: {campaign.targetService}</p>
                  ) : null}
                  {campaign.launchDate ? (
                    <p className="text-xs text-slate-400">Launch {formatAbsolute(campaign.launchDate)}</p>
                  ) : null}
                  {campaign.metrics ? (
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      {Object.entries(campaign.metrics).map(([key, value]) => (
                        <div key={key}>
                          <dt className="font-semibold text-slate-600">{key}</dt>
                          <dd>{typeof value === 'number' ? value.toLocaleString() : `${value}`}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {campaign.description ? <p className="mt-3 text-xs text-slate-500">{campaign.description}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No active campaigns yet. Launch one to nurture cross-selling plays.</p>
          )}
        </section>
      </div>
      </DashboardLayout>
    </RoleGate>
  );
}
