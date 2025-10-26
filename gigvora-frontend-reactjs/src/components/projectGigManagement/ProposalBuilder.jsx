import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const BUILDER_STEPS = [
  { id: 'cover', label: 'Cover' },
  { id: 'scope', label: 'Scope' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'review', label: 'Review & Send' },
];

const DEFAULT_PROPOSAL = {
  title: '',
  clientName: '',
  summary: '',
  background: '',
  outcomes: '',
  deliverables: '',
  timeline: '',
  investmentNotes: '',
  pricing: [],
  currency: 'USD',
  nextSteps: '',
};

const DEFAULT_TEMPLATE = {
  id: 'blank',
  name: 'Blank canvas',
  summary: 'Start with an empty proposal structure.',
};

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return `${currency} 0`;
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function ProposalPreview({ proposal, collaborators, lastSavedAt }) {
  const pricingSummary = useMemo(() => {
    return proposal.pricing.reduce(
      (acc, row) => {
        const amount = Number(row.amount);
        if (Number.isFinite(amount)) {
          acc.total += amount;
        }
        if (row.optional) {
          acc.optional += amount;
        }
        return acc;
      },
      { total: 0, optional: 0 },
    );
  }, [proposal.pricing]);

  const readiness = useMemo(() => {
    const checklist = [
      Boolean(proposal.title?.trim()),
      Boolean(proposal.summary?.trim()),
      Boolean(proposal.outcomes?.trim()),
      proposal.pricing.length > 0,
      Boolean(proposal.nextSteps?.trim()),
    ];
    const completed = checklist.filter(Boolean).length;
    return Math.round((completed / checklist.length) * 100);
  }, [proposal]);

  return (
    <aside className="flex h-full min-h-[480px] flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Live preview</p>
        <h3 className="text-xl font-semibold text-slate-900">{proposal.title || 'Untitled proposal'}</h3>
        <p className="text-sm text-slate-500">for {proposal.clientName || 'Unnamed client'}</p>
        {lastSavedAt ? (
          <p className="text-xs text-slate-400">Last saved {format(lastSavedAt, 'd MMM, h:mm a')}</p>
        ) : null}
      </header>

      <section className="space-y-3 text-sm text-slate-600">
        <p className="rounded-2xl bg-slate-50 p-3 text-slate-600">{proposal.summary || 'Add a compelling summary to set the tone.'}</p>
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-slate-100">
          <h4 className="text-sm font-semibold uppercase tracking-wide">Proposed outcomes</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {proposal.outcomes || 'Outline the transformation and key wins your team will deliver.'}
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Key deliverables</h4>
          <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-600">
            {proposal.deliverables || 'List milestone deliverables, owners, and sign-off expectations.'}
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Timeline</h4>
          <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-600">
            {proposal.timeline || 'Frame the schedule with milestone clarity and dependency notes.'}
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">Investment summary</h4>
          <p className="text-sm font-semibold text-slate-700">{formatCurrency(pricingSummary.total, proposal.currency)}</p>
        </div>
        {pricingSummary.optional ? (
          <p className="text-xs text-slate-500">Includes {formatCurrency(pricingSummary.optional, proposal.currency)} optional add-ons</p>
        ) : null}
        <p className="rounded-2xl bg-white p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Readiness {readiness}%
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Collaborators</h4>
        <div className="flex flex-wrap gap-2">
          {collaborators.length ? (
            collaborators.map((collaborator) => (
              <span key={collaborator.id ?? collaborator.email} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                {collaborator.name ?? collaborator.email}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Invite collaborators</span>
          )}
        </div>
      </section>
    </aside>
  );
}

ProposalPreview.propTypes = {
  proposal: PropTypes.object.isRequired,
  collaborators: PropTypes.arrayOf(PropTypes.object),
  lastSavedAt: PropTypes.instanceOf(Date),
};

ProposalPreview.defaultProps = {
  collaborators: [],
  lastSavedAt: null,
};

export default function ProposalBuilder({
  workspace,
  canManage,
  onDraftChange,
  onSaveDraft,
  onSend,
  onInviteCollaborator,
}) {
  const templates = useMemo(
    () => (Array.isArray(workspace?.templates) && workspace.templates.length ? workspace.templates : [DEFAULT_TEMPLATE]),
    [workspace?.templates],
  );
  const initialProposal = useMemo(() => ({ ...DEFAULT_PROPOSAL, ...(workspace?.activeDraft ?? {}) }), [workspace?.activeDraft]);
  const [proposal, setProposal] = useState(initialProposal);
  const [activeStep, setActiveStep] = useState(BUILDER_STEPS[0].id);
  const [selectedTemplateId, setSelectedTemplateId] = useState(workspace?.activeDraft?.templateId ?? templates[0]?.id);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(workspace?.activeDraft?.updatedAt ? new Date(workspace.activeDraft.updatedAt) : null);

  const collaborators = Array.isArray(workspace?.collaborators) ? workspace.collaborators : [];

  const pricingTotal = useMemo(() => {
    return proposal.pricing.reduce((total, item) => {
      const amount = Number(item.amount);
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [proposal.pricing]);

  const completionChecklist = useMemo(() => {
    return [
      { id: 'title', label: 'Title & summary', complete: Boolean(proposal.title.trim()) && Boolean(proposal.summary.trim()) },
      { id: 'scope', label: 'Scope & outcomes', complete: Boolean(proposal.outcomes.trim()) && Boolean(proposal.deliverables.trim()) },
      { id: 'pricing', label: 'Pricing table', complete: proposal.pricing.length > 0 },
      { id: 'timeline', label: 'Timeline', complete: Boolean(proposal.timeline.trim()) },
      { id: 'nextSteps', label: 'Next steps', complete: Boolean(proposal.nextSteps.trim()) },
    ];
  }, [proposal]);

  const completionPercent = useMemo(() => {
    const completed = completionChecklist.filter((item) => item.complete).length;
    return Math.round((completed / completionChecklist.length) * 100);
  }, [completionChecklist]);

  const handleFieldChange = (field, value) => {
    setProposal((current) => {
      const next = { ...current, [field]: value };
      onDraftChange?.(next);
      return next;
    });
  };

  const handlePricingChange = (index, updates) => {
    setProposal((current) => {
      const nextPricing = current.pricing.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row));
      const next = { ...current, pricing: nextPricing };
      onDraftChange?.(next);
      return next;
    });
  };

  const handlePricingAdd = () => {
    setProposal((current) => {
      const nextPricing = [
        ...current.pricing,
        { description: '', amount: '', quantity: 1, optional: false },
      ];
      const next = { ...current, pricing: nextPricing };
      onDraftChange?.(next);
      return next;
    });
  };

  const handlePricingRemove = (index) => {
    setProposal((current) => {
      const nextPricing = current.pricing.filter((_, rowIndex) => rowIndex !== index);
      const next = { ...current, pricing: nextPricing };
      onDraftChange?.(next);
      return next;
    });
  };

  const handleTemplateApply = (templateId) => {
    const template = templates.find((entry) => entry.id === templateId);
    setSelectedTemplateId(templateId);
    if (!template) return;
    const templateData = {
      title: template.title ?? template.name ?? proposal.title,
      summary: template.summary ?? proposal.summary,
      outcomes: template.outcomes ?? proposal.outcomes,
      deliverables: template.deliverables ?? proposal.deliverables,
      timeline: template.timeline ?? proposal.timeline,
      pricing: Array.isArray(template.pricing) ? template.pricing : proposal.pricing,
      nextSteps: template.nextSteps ?? proposal.nextSteps,
    };
    setProposal((current) => {
      const next = { ...current, ...templateData, templateId };
      onDraftChange?.(next);
      return next;
    });
  };

  const handleSave = async () => {
    if (!onSaveDraft) return;
    setSaving(true);
    setFeedback(null);
    try {
      await onSaveDraft({ ...proposal, templateId: selectedTemplateId, total: pricingTotal });
      setFeedback({ tone: 'success', message: 'Proposal saved.' });
      setLastSavedAt(new Date());
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Unable to save proposal.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!onSend) return;
    setSaving(true);
    setFeedback(null);
    try {
      await onSend({ ...proposal, templateId: selectedTemplateId, total: pricingTotal });
      setFeedback({ tone: 'success', message: 'Proposal sent to client.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Unable to send proposal.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!onInviteCollaborator) return;
    const form = new FormData(event.currentTarget);
    const email = (form.get('email') ?? '').toString().trim();
    if (!email) return;
    await onInviteCollaborator({ email });
    event.currentTarget.reset();
  };

  const renderStep = () => {
    switch (activeStep) {
      case 'cover':
        return (
          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Proposal title
              <input
                type="text"
                value={proposal.title}
                onChange={(event) => handleFieldChange('title', event.target.value)}
                placeholder="e.g. Brand system relaunch"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Client name
              <input
                type="text"
                value={proposal.clientName}
                onChange={(event) => handleFieldChange('clientName', event.target.value)}
                placeholder="Client or organisation"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Executive summary
              <textarea
                value={proposal.summary}
                onChange={(event) => handleFieldChange('summary', event.target.value)}
                placeholder="Condense the strategic ambition in 2-3 sentences."
                rows={4}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
        );
      case 'scope':
        return (
          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Outcomes
              <textarea
                value={proposal.outcomes}
                onChange={(event) => handleFieldChange('outcomes', event.target.value)}
                placeholder="Describe transformative outcomes and KPIs."
                rows={4}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Key deliverables
              <textarea
                value={proposal.deliverables}
                onChange={(event) => handleFieldChange('deliverables', event.target.value)}
                placeholder="List deliverables with owners and acceptance criteria."
                rows={4}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Timeline
              <textarea
                value={proposal.timeline}
                onChange={(event) => handleFieldChange('timeline', event.target.value)}
                placeholder="Outline milestone cadence and dependencies."
                rows={3}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
        );
      case 'pricing':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Pricing rows</h4>
              <button
                type="button"
                onClick={handlePricingAdd}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
              >
                Add line
              </button>
            </div>
            <div className="space-y-3">
              {proposal.pricing.length ? (
                proposal.pricing.map((row, index) => (
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto_auto]">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                      <input
                        type="text"
                        value={row.description}
                        onChange={(event) => handlePricingChange(index, { description: event.target.value })}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(event) => handlePricingChange(index, { amount: event.target.value })}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Quantity
                      <input
                        type="number"
                        value={row.quantity}
                        min="1"
                        onChange={(event) => handlePricingChange(index, { quantity: Number(event.target.value) || 1 })}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <input
                        type="checkbox"
                        checked={Boolean(row.optional)}
                        onChange={(event) => handlePricingChange(index, { optional: event.target.checked })}
                        className="h-4 w-4 rounded border border-slate-300 text-accent focus:ring-accent"
                      />
                      Optional
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePricingRemove(index)}
                      className="justify-self-end rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:border-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Add your first pricing line to calculate investment.
                </div>
              )}
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-700">Next steps</h4>
              <textarea
                value={proposal.nextSteps}
                onChange={(event) => handleFieldChange('nextSteps', event.target.value)}
                placeholder="Define the sign-off workflow and kickoff plan."
                rows={3}
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </section>
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-700">Checklist</h4>
              <ul className="mt-3 space-y-2 text-sm">
                {completionChecklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        item.complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {item.complete ? '✓' : item.label.charAt(0)}
                    </span>
                    <span className="font-medium text-slate-700">{item.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-amber-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">Proposal studio</p>
            <h3 className="text-2xl font-semibold text-slate-900">Craft premium proposals</h3>
            <p className="text-sm text-slate-500">{completionPercent}% ready · {formatCurrency(pricingTotal, proposal.currency)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canManage || saving}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canManage || saving}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Send proposal
            </button>
          </div>
        </div>
        {feedback ? (
          <p
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              feedback.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {feedback.message}
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-700">Templates</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateApply(template.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selectedTemplateId === template.id
                      ? 'border-amber-400 bg-amber-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{template.name ?? 'Template'}</p>
                  <p className="mt-1 text-xs text-slate-500">{template.summary ?? 'Comprehensive proposal framework.'}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <nav className="flex flex-wrap gap-2">
              {BUILDER_STEPS.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeStep === step.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </nav>
            <div className="mt-4 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-white p-5 shadow-inner">
              {renderStep()}
            </div>
          </div>

          <form className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleInvite}>
            <h4 className="text-sm font-semibold text-slate-700">Invite collaborator</h4>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                name="email"
                placeholder="teammate@studio.com"
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Send invite
              </button>
            </div>
          </form>
        </div>

        <ProposalPreview proposal={proposal} collaborators={collaborators} lastSavedAt={lastSavedAt} />
      </div>
    </section>
  );
}

ProposalBuilder.propTypes = {
  workspace: PropTypes.shape({
    templates: PropTypes.array,
    activeDraft: PropTypes.object,
    collaborators: PropTypes.array,
  }),
  canManage: PropTypes.bool,
  onDraftChange: PropTypes.func,
  onSaveDraft: PropTypes.func,
  onSend: PropTypes.func,
  onInviteCollaborator: PropTypes.func,
};

ProposalBuilder.defaultProps = {
  workspace: null,
  canManage: false,
  onDraftChange: undefined,
  onSaveDraft: undefined,
  onSend: undefined,
  onInviteCollaborator: undefined,
};
