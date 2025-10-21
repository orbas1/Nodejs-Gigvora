import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowRightCircleIcon,
  ArrowSmallLeftIcon,
  ArrowSmallRightIcon,
  DocumentDuplicateIcon,
  PaperClipIcon,
  PencilSquareIcon,
  PlayCircleIcon,
  RocketLaunchIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ITEM_TYPES = [
  { value: 'cv', label: 'CV creation', description: 'Polished, outcome-driven curriculum vitae tailored to flagship roles.' },
  { value: 'cover_letter', label: 'Cover letter creation', description: 'High-impact storytelling designed for intros and outreach.' },
  { value: 'gig', label: 'Gig creation', description: 'Productise your expertise into a bookable Explorer gig.' },
  { value: 'project', label: 'Project creation', description: 'Design a portfolio-ready project or accelerator sprint.' },
  { value: 'volunteering', label: 'Volunteering job creation', description: 'Surface mentoring-for-good opportunities for mentees.' },
  { value: 'experience_launchpad', label: 'Experience launchpad job', description: 'Craft launchpad experiences for emerging talent.' },
  { value: 'mentorship_offering', label: 'Mentorship offering', description: 'Codify your flagship mentorship journey and rituals.' },
];

const STATUSES = ['Draft', 'In progress', 'Ready to publish', 'Published', 'Archived'];
const STAGES = [
  { value: 1, label: 'Blueprint' },
  { value: 2, label: 'Narrative' },
  { value: 3, label: 'Assets' },
  { value: 4, label: 'Launch plan' },
];

const DEFAULT_ITEM = {
  title: '',
  type: ITEM_TYPES[0].value,
  status: 'Draft',
  stage: 1,
  targetRole: '',
  persona: '',
  summary: '',
  deliverables: '',
  heroMedia: '',
  nextStep: '',
  shareLink: '',
  attachments: [],
  callToAction: '',
};

const DEFAULT_ATTACHMENT = {
  name: '',
  url: '',
  type: 'Document',
};

const WIZARD_STEPS = [
  {
    id: 'basics',
    title: 'Blueprint',
    description: 'Clarify the role, persona, and promise of the experience you are building.',
  },
  {
    id: 'story',
    title: 'Narrative',
    description: 'Shape the outcomes, proof points, and core storyline.',
  },
  {
    id: 'assets',
    title: 'Assets',
    description: 'Upload multimedia, attachments, and supporting rituals.',
  },
  {
    id: 'launch',
    title: 'Launch plan',
    description: 'Define the call-to-action, distribution plan, and go-live readiness.',
  },
];

function humaniseType(type) {
  return ITEM_TYPES.find((option) => option.value === type)?.label ?? type;
}

function Stepper({ activeStepId }) {
  return (
    <ol className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
      {WIZARD_STEPS.map((step, index) => {
        const isActive = step.id === activeStepId;
        return (
          <li key={step.id} className={`flex items-center gap-2 ${isActive ? 'text-accent' : ''}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${isActive ? 'border-accent text-accent' : 'border-slate-300 text-slate-400'}`}>
              {index + 1}
            </span>
            {step.title}
          </li>
        );
      })}
    </ol>
  );
}

Stepper.propTypes = {
  activeStepId: PropTypes.string.isRequired,
};

export default function MentorCreationStudioWizardSection({
  items,
  saving,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  onPublishItem,
}) {
  const [wizardItem, setWizardItem] = useState(DEFAULT_ITEM);
  const [editingItemId, setEditingItemId] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [attachmentForm, setAttachmentForm] = useState(DEFAULT_ATTACHMENT);
  const [feedback, setFeedback] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredItems = useMemo(() => {
    if (!items?.length) return [];
    if (typeFilter === 'all') return items;
    return items.filter((item) => item.type === typeFilter);
  }, [items, typeFilter]);

  const activeStep = WIZARD_STEPS[activeStepIndex];

  const handleNext = () => setActiveStepIndex((current) => Math.min(current + 1, WIZARD_STEPS.length - 1));
  const handleBack = () => setActiveStepIndex((current) => Math.max(current - 1, 0));

  const handleReset = () => {
    setEditingItemId(null);
    setWizardItem(DEFAULT_ITEM);
    setAttachmentForm(DEFAULT_ATTACHMENT);
    setActiveStepIndex(0);
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      ...wizardItem,
      deliverables: typeof wizardItem.deliverables === 'string' ? wizardItem.deliverables : wizardItem.deliverables.join?.('\n') ?? '',
    };
    try {
      if (editingItemId) {
        await onUpdateItem?.(editingItemId, payload);
      } else {
        await onCreateItem?.(payload);
      }
      setFeedback({ type: 'success', message: 'Creation saved. Continue polishing assets or publish when ready.' });
      handleReset();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to save creation item.' });
    }
  };

  const handlePublish = async (itemId) => {
    setFeedback(null);
    try {
      await onPublishItem?.(itemId);
      setFeedback({ type: 'success', message: 'Creation published to Explorer and mentor portfolio.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message ?? 'Unable to publish creation.' });
    }
  };

  const handleEdit = (item) => {
    setEditingItemId(item.id);
    setWizardItem({
      ...DEFAULT_ITEM,
      ...item,
      deliverables: Array.isArray(item.deliverables) ? item.deliverables.join('\n') : item.deliverables ?? '',
      attachments: item.attachments ?? [],
    });
    setActiveStepIndex(0);
    setFeedback(null);
  };

  const handleAddAttachment = () => {
    if (!attachmentForm.name || !attachmentForm.url) {
      setFeedback({ type: 'error', message: 'Attachment name and URL are required.' });
      return;
    }
    setWizardItem((current) => ({
      ...current,
      attachments: [...(current.attachments ?? []), { ...attachmentForm, id: `${Date.now()}` }],
    }));
    setAttachmentForm(DEFAULT_ATTACHMENT);
  };

  const handleRemoveAttachment = (attachmentId) => {
    setWizardItem((current) => ({
      ...current,
      attachments: (current.attachments ?? []).filter((attachment) => attachment.id !== attachmentId),
    }));
  };

  return (
    <section className="space-y-10 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Creation Studio wizard</p>
          <h2 className="text-2xl font-semibold text-slate-900">Launch CVs, gigs, programmes, and volunteering experiences</h2>
          <p className="text-sm text-slate-600">
            Work through guided steps to craft irresistible assets. Everything here syncs to Explorer, Launchpad, and volunteer marketplaces the moment you publish.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active creations</p>
          <p className="text-lg font-semibold text-slate-900">{items?.length ?? 0}</p>
          <p className="text-xs">{filteredItems.length} visible with current filters</p>
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-inner lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Start with a template</h3>
          <div className="grid gap-4">
            {ITEM_TYPES.map((type) => (
              <button
                type="button"
                key={type.value}
                onClick={() => {
                  setWizardItem((current) => ({ ...current, type: type.value }));
                  setTypeFilter('all');
                }}
                className={`flex w-full flex-col items-start gap-2 rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition ${
                  wizardItem.type === type.value ? 'border-accent bg-white text-accent' : 'border-slate-200 bg-white text-slate-600 hover:border-accent/50'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <RocketLaunchIcon className="h-4 w-4" />
                  {type.label}
                </div>
                <p className="text-xs text-slate-500">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <Stepper activeStepId={activeStep.id} />
          <p className="mt-4 text-sm text-slate-600">{activeStep.description}</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {activeStep.id === 'basics' ? (
              <Fragment>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Title
                    <input
                      type="text"
                      required
                      value={wizardItem.title}
                      onChange={(event) => setWizardItem((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Leadership accelerator CV"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Status
                    <select
                      value={wizardItem.status}
                      onChange={(event) => setWizardItem((current) => ({ ...current, status: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      {STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Target role / outcome
                    <input
                      type="text"
                      value={wizardItem.targetRole}
                      onChange={(event) => setWizardItem((current) => ({ ...current, targetRole: event.target.value }))}
                      placeholder="Director of Product"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Persona / audience
                    <input
                      type="text"
                      value={wizardItem.persona}
                      onChange={(event) => setWizardItem((current) => ({ ...current, persona: event.target.value }))}
                      placeholder="Scale-up operators"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                  Promise summary
                  <textarea
                    rows={4}
                    value={wizardItem.summary}
                    onChange={(event) => setWizardItem((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="Transformation, rituals, and proof points"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                  Stage
                  <select
                    value={wizardItem.stage}
                    onChange={(event) => setWizardItem((current) => ({ ...current, stage: Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {STAGES.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.value} — {stage.label}
                      </option>
                    ))}
                  </select>
                </label>
              </Fragment>
            ) : null}

            {activeStep.id === 'story' ? (
              <Fragment>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                  Outcomes & proof
                  <textarea
                    rows={5}
                    value={wizardItem.deliverables}
                    onChange={(event) => setWizardItem((current) => ({ ...current, deliverables: event.target.value }))}
                    placeholder="Use bullet points to describe deliverables, proof, and rituals"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <span className="text-xs font-medium text-slate-500">Separate deliverables with new lines. These power Explorer cards.</span>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                  Next step
                  <input
                    type="text"
                    value={wizardItem.nextStep}
                    onChange={(event) => setWizardItem((current) => ({ ...current, nextStep: event.target.value }))}
                    placeholder="Record intro video"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </Fragment>
            ) : null}

            {activeStep.id === 'assets' ? (
              <Fragment>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Hero media URL
                    <input
                      type="url"
                      value={wizardItem.heroMedia}
                      onChange={(event) => setWizardItem((current) => ({ ...current, heroMedia: event.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    Introduction video URL
                    <input
                      type="url"
                      value={wizardItem.videoUrl ?? ''}
                      onChange={(event) => setWizardItem((current) => ({ ...current, videoUrl: event.target.value }))}
                      placeholder="https://www.youtube.com/embed/..."
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-slate-700">Attachments</h4>
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
                    >
                      <PaperClipIcon className="h-3.5 w-3.5" />
                      Add attachment
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                      <input
                        type="text"
                        value={attachmentForm.name}
                        onChange={(event) => setAttachmentForm((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      URL
                      <input
                        type="url"
                        value={attachmentForm.url}
                        onChange={(event) => setAttachmentForm((current) => ({ ...current, url: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="https://"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                      <input
                        type="text"
                        value={attachmentForm.type}
                        onChange={(event) => setAttachmentForm((current) => ({ ...current, type: event.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="PDF, Notion, Loom"
                      />
                    </label>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {(wizardItem.attachments ?? []).length === 0 ? (
                      <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-500">
                        No attachments yet. Add curriculum outlines, templates, or teaser reels.
                      </li>
                    ) : (
                      (wizardItem.attachments ?? []).map((attachment) => (
                        <li key={attachment.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <DocumentDuplicateIcon className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="font-semibold text-slate-800">{attachment.name}</p>
                              <p className="text-xs text-slate-500">{attachment.type}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                {wizardItem.heroMedia ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <img src={wizardItem.heroMedia} alt="Hero media preview" className="h-48 w-full object-cover" />
                  </div>
                ) : null}
                {wizardItem.videoUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <iframe
                      title="Creation studio preview video"
                      src={wizardItem.videoUrl}
                      className="h-48 w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
              </Fragment>
            ) : null}

            {activeStep.id === 'launch' ? (
              <Fragment>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                  Share link
                  <input
                    type="url"
                    value={wizardItem.shareLink}
                    onChange={(event) => setWizardItem((current) => ({ ...current, shareLink: event.target.value }))}
                    placeholder="https://mentor.gigvora.com/creation/..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                  Call to action
                  <input
                    type="text"
                    value={wizardItem.callToAction}
                    onChange={(event) => setWizardItem((current) => ({ ...current, callToAction: event.target.value }))}
                    placeholder="Book intro session"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-700">
                  Publishing automatically updates Explorer, Launchpad, and volunteering boards depending on the asset type. Make sure automation-ready links and assets are final.
                </div>
              </Fragment>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                Step {activeStepIndex + 1} of {WIZARD_STEPS.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={activeStepIndex === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowSmallLeftIcon className="h-4 w-4" />
                  Back
                </button>
                {activeStepIndex < WIZARD_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accentDark"
                  >
                    Next
                    <ArrowSmallRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <ArrowRightCircleIcon className="h-4 w-4" />
                    {saving ? 'Saving…' : editingItemId ? 'Update creation' : 'Save creation'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-accent hover:text-accent"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Creation inventory</h3>
            <p className="text-xs text-slate-500">Manage drafts, launch plans, and published experiences.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="all">All types</option>
              {ITEM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                    No creations match the filter. Start a new template above to craft your next asset.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.nextStep ?? 'Next step not set'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{humaniseType(item.type)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">Stage {item.stage}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                        <RocketLaunchIcon className="h-3.5 w-3.5" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {item.lastEditedAt ? format(new Date(item.lastEditedAt), 'dd MMM yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-accent"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePublish(item.id)}
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                        >
                          <PlayCircleIcon className="h-3.5 w-3.5" />
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem?.(item.id)}
                          className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

MentorCreationStudioWizardSection.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      status: PropTypes.string,
      stage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      targetRole: PropTypes.string,
      persona: PropTypes.string,
      summary: PropTypes.string,
      deliverables: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
      heroMedia: PropTypes.string,
      nextStep: PropTypes.string,
      shareLink: PropTypes.string,
      attachments: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
          url: PropTypes.string,
          type: PropTypes.string,
        }),
      ),
      lastEditedAt: PropTypes.string,
    }),
  ),
  saving: PropTypes.bool,
  onCreateItem: PropTypes.func,
  onUpdateItem: PropTypes.func,
  onDeleteItem: PropTypes.func,
  onPublishItem: PropTypes.func,
};

MentorCreationStudioWizardSection.defaultProps = {
  items: [],
  saving: false,
  onCreateItem: undefined,
  onUpdateItem: undefined,
  onDeleteItem: undefined,
  onPublishItem: undefined,
};
