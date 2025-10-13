import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import {
  fetchCollaborationSpaces,
  createCollaborationSpace,
  createCollaborationVideoRoom,
  createCollaborationAsset,
  createCollaborationAnnotation,
  connectCollaborationRepository,
  createCollaborationAiSession,
} from '../../services/collaboration.js';

const menuSections = [
  {
    label: 'Service delivery',
    items: [
      {
        name: 'Project workspace dashboard',
        description: 'Unified workspace for briefs, assets, conversations, and approvals.',
        tags: ['whiteboards', 'files'],
      },
      {
        name: 'Collaboration cockpit',
        description: 'Host live rooms, proofing canvases, repositories, and QA copilots in one mission control.',
        tags: ['live rooms', 'AI'],
        targetId: 'collaboration-cockpit',
      },
      {
        name: 'Project management',
        description: 'Detailed plan with sprints, dependencies, risk logs, and billing checkpoints.',
      },
      {
        name: 'Client portals',
        description: 'Shared timelines, scope controls, and decision logs with your clients.',
      },
    ],
  },
  {
    label: 'Gig commerce',
    items: [
      {
        name: 'Gig manager',
        description: 'Monitor gigs, delivery milestones, bundled services, and upsells.',
        tags: ['gig catalog'],
      },
      {
        name: 'Post a gig',
        description: 'Launch new services with pricing matrices, availability calendars, and banners.',
      },
      {
        name: 'Purchased gigs',
        description: 'Track incoming orders, requirements, revisions, and payouts.',
      },
    ],
  },
  {
    label: 'Growth & profile',
    items: [
      {
        name: 'Freelancer profile',
        description: 'Update expertise tags, success metrics, testimonials, and hero banners.',
      },
      {
        name: 'Agency collaborations',
        description: 'Manage invitations from agencies, share rate cards, and negotiate retainers.',
      },
      {
        name: 'Finance & insights',
        description: 'Revenue analytics, payout history, taxes, and profitability dashboards.',
      },
    ],
  },
];

const capabilitySections = [
  {
    title: 'Project workspace excellence',
    description:
      'Deliver projects with structure. Each workspace combines real-time messaging, documents, tasks, billing, and client approvals.',
    features: [
      {
        name: 'Workspace templates',
        description:
          'Kickstart delivery with industry-specific playbooks, requirement questionnaires, and automated onboarding flows.',
        bulletPoints: [
          'Standard operating procedures and checklists for repeat work.',
          'Client welcome sequences and kickoff survey automation.',
        ],
      },
      {
        name: 'Task & sprint manager',
        description:
          'Run sprints, Kanban boards, and timeline views with burn charts, dependencies, and backlog grooming.',
        bulletPoints: [
          'Time tracking per task with billable vs. non-billable flags.',
          'Risk registers and change request approvals with e-signatures.',
        ],
      },
      {
        name: 'Collaboration cockpit',
        id: 'collaboration-cockpit',
        description:
          'A shared mission control for every delivery squad—launch persistent video rooms, layer feedback on assets, review code, and co-author documentation with AI copilots in a single experience.',
        bulletPoints: [
          'Meeting recordings auto-transcribed with action item extraction and timeline bookmarks.',
          'Creative proofing canvas supporting frame-by-frame markup on motion, 3D, and live prototype embeds.',
          'Git-native code workspaces with branch protections, preview deployments, and inline QA checklists.',
          'AI assistants that summarize stand-ups, draft documentation, and generate regression tests instantly.',
          'Granular roles spanning owners, contributors, comment-only reviewers, and view-only client observers.',
        ],
        pillars: [
          {
            title: 'Live collaboration hub',
            description:
              'Keep every stakeholder aligned with real-time presence indicators, quick reactions, and shared rituals.',
            items: [
              'Spin up branded video rooms with stage layouts, whiteboards, and auto-published recaps.',
              'Agenda timers, decision logs, and follow-up assignments that sync to tasks and calendars.',
              'Persistent chat threads with contextual file references and voice notes.',
            ],
          },
          {
            title: 'Proofing & reviews',
            description:
              'Bring creative, product, and engineering reviews together without exporting assets across tools.',
            items: [
              'Inline annotations on design files, prototypes, product demos, and video walkthroughs.',
              'Version-aware comments that highlight what changed between rounds.',
              'Smart routing that alerts only the approvers responsible for the current milestone.',
            ],
          },
          {
            title: 'Repository nerve center',
            description:
              'Connect Git, cloud storage, and knowledge bases while keeping permissions in sync.',
            items: [
              'One-click linking of GitHub, GitLab, Bitbucket, Google Drive, and Notion spaces.',
              'Automated branch hygiene checks with merge gating tied to QA status.',
              'Deploy preview URLs with environment health widgets embedded in the cockpit.',
            ],
          },
          {
            title: 'AI copilots',
            description:
              'Automations that lighten documentation, QA, and knowledge-transfer lift.',
            items: [
              'AI-generated documentation drafts with stakeholder-tailored summaries.',
              'Dynamic QA scripts that adapt to updated requirements or bug reports.',
              'Context-aware suggestions for follow-up tasks, dependencies, and blockers.',
            ],
          },
          {
            title: 'Access governance',
            description: 'Flex control to match client expectations and compliance needs.',
            items: [
              'Client-specific permission presets for comment-only, edit, or view access.',
              'Audit trails that capture who viewed, annotated, or exported deliverables.',
              'Guest links with expiry policies and watermarking for sensitive previews.',
            ],
          },
        ],
        metrics: [
          { label: 'Average approval cycle reduction', value: '43%' },
          { label: 'Meetings auto-documented monthly', value: '120+' },
        ],
        callout: 'Pilot customers report 2.3x faster sign-off on creative and technical deliverables.',
      },
      {
        name: 'Deliverable vault',
        description:
          'Secure storage with version history, watermarking, NDA controls, and automated delivery packages.',
        bulletPoints: [
          'Auto-generate delivery summaries with success metrics.',
          'Long-term archiving and compliance exports.',
        ],
      },
    ],
  },
  {
    title: 'Gig marketplace operations',
    description:
      'Manage the full gig lifecycle from publishing listings to fulfillment, upsells, and post-delivery reviews.',
    features: [
      {
        name: 'Gig builder',
        description:
          'Design irresistible gig pages with tiered pricing, add-ons, gallery media, and conversion-tested copy.',
        bulletPoints: [
          'Freelancer banner creator with dynamic call-to-actions.',
          'Preview modes for desktop, tablet, and mobile experiences.',
        ],
      },
      {
        name: 'Order pipeline',
        description:
          'Monitor incoming orders, qualification forms, kickoff calls, and delivery status from inquiry to completion.',
        bulletPoints: [
          'Automated requirement forms and revision workflows.',
          'Escrow release checkpoints tied to client satisfaction.',
        ],
      },
      {
        name: 'Client success automation',
        description:
          'Trigger onboarding sequences, educational drip emails, testimonials, and referral programs automatically.',
        bulletPoints: [
          'Smart nudges for review requests post-delivery.',
          'Affiliate and referral tracking per gig.',
        ],
      },
      {
        name: 'Catalog insights',
        description:
          'See conversion rates, top-performing gig bundles, repeat clients, and cross-sell opportunities at a glance.',
        bulletPoints: [
          'Margin calculator factoring software costs and subcontractors.',
          'Heatmaps of search keywords driving gig impressions.',
        ],
      },
    ],
  },
  {
    title: 'Finance, compliance, & reputation',
    description:
      'Get paid fast while staying compliant. Monitor cash flow, taxes, contracts, and reputation programs across clients.',
    features: [
      {
        name: 'Finance control tower',
        description:
          'Revenue breakdowns, tax-ready exports, expense tracking, and smart savings goals for benefits or downtime.',
        bulletPoints: [
          'Split payouts between teammates or subcontractors instantly.',
          'Predictive forecasts for retainers vs. one-off gigs.',
        ],
      },
      {
        name: 'Contract & compliance locker',
        description:
          'Store MSAs, NDAs, intellectual property agreements, and compliance attestations with e-sign audit logs.',
        bulletPoints: [
          'Automated reminders for renewals and insurance certificates.',
          'Localization for GDPR, SOC2, and freelancer classifications.',
        ],
      },
      {
        name: 'Reputation engine',
        description:
          'Capture testimonials, publish success stories, and display verified metrics such as on-time delivery and CSAT.',
        bulletPoints: [
          'Custom badges and banners for featured freelancer programs.',
          'Shareable review widgets for external websites.',
        ],
      },
      {
        name: 'Support & dispute desk',
        description:
          'Resolve client concerns, manage escalations, and collaborate with Gigvora support for smooth resolutions.',
        bulletPoints: [
          'Conversation transcripts linked back to gig orders.',
          'Resolution playbooks to keep satisfaction high.',
        ],
      },
    ],
  },
  {
    title: 'Growth, partnerships, & skills',
    description:
      'Scale your business with targeted marketing, agency partnerships, continuous learning, and community mentoring.',
    features: [
      {
        name: 'Pipeline CRM',
        description:
          'Track leads, proposals, follow-ups, and cross-selling campaigns separate from gig orders.',
        bulletPoints: [
          'Kanban views by industry, retainer size, or probability.',
          'Proposal templates with case studies and ROI calculators.',
        ],
      },
      {
        name: 'Agency alliance manager',
        description:
          'Collaborate with agencies, share resource calendars, negotiate revenue splits, and join pods for large engagements.',
        bulletPoints: [
          'Rate card sharing with version history and approvals.',
          'Resource heatmaps showing bandwidth across weeks.',
        ],
      },
      {
        name: 'Learning and certification hub',
        description:
          'Access curated courses, peer mentoring sessions, and skill gap diagnostics tied to your service lines.',
        bulletPoints: [
          'Certification tracker with renewal reminders.',
          'AI recommendations for new service offerings.',
        ],
      },
      {
        name: 'Community spotlight',
        description:
          'Showcase contributions, speaking engagements, and open-source work with branded banners and social share kits.',
        bulletPoints: [
          'Automated newsletter features for top-performing freelancers.',
          'Personalized marketing assets ready for social channels.',
        ],
      },
    ],
  },
];

const profile = {
  name: 'Riley Morgan',
  role: 'Lead Brand & Product Designer',
  initials: 'RM',
  status: 'Top-rated freelancer',
  userId: 201,
  badges: ['Verified Pro', 'Gigvora Elite'],
  metrics: [
    { label: 'Active projects', value: '6' },
    { label: 'Gigs fulfilled', value: '148' },
    { label: 'Avg. CSAT', value: '4.9/5' },
    { label: 'Monthly revenue', value: '$18.4k' },
  ],
};

const availableDashboards = ['freelancer', 'user', 'agency'];

function formatDateTime(value) {
  if (!value) {
    return 'Not synced yet';
  }
  const parsed = typeof value === 'string' ? new Date(value) : value;
  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    return 'Not synced yet';
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

function CollaborationCockpitFeature({
  spaces,
  loading,
  error,
  actionNotice,
  onRefresh,
  onCreateSpace,
  onCreateRoom,
  onCreateAsset,
  onCreateAnnotation,
  onConnectRepository,
  onCreateAiSession,
  ownerId,
  lastSyncedAt,
}) {
  const [spaceForm, setSpaceForm] = useState({
    name: '',
    clientName: '',
    meetingCadence: '',
    summary: '',
    ownerId: ownerId ?? '',
  });
  const [roomForms, setRoomForms] = useState({});
  const [assetForms, setAssetForms] = useState({});
  const [annotationForms, setAnnotationForms] = useState({});
  const [repoForms, setRepoForms] = useState({});
  const [aiForms, setAiForms] = useState({});
  const [pending, setPending] = useState({});

  useEffect(() => {
    setSpaceForm((previous) => ({ ...previous, ownerId: ownerId ?? previous.ownerId }));
  }, [ownerId]);

  const setPendingFlag = useCallback((key, value) => {
    setPending((previous) => ({ ...previous, [key]: value }));
  }, []);

  const isPending = useCallback((key) => Boolean(pending[key]), [pending]);

  const defaultRoomForm = { title: '', provider: 'Zoom', joinUrl: '', roomType: 'video', recordingUrl: '' };
  const defaultAssetForm = {
    title: '',
    assetType: 'file',
    status: 'in_review',
    sourceUrl: '',
    version: '',
  };
  const defaultAnnotationForm = { body: '', annotationType: 'comment', timecode: '' };
  const defaultRepoForm = { provider: 'github', repositoryName: '', branch: 'main' };
  const defaultAiForm = { sessionType: 'summary', prompt: '' };

  const handleSpaceInputChange = (event) => {
    const { name, value } = event.target;
    setSpaceForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSpaceSubmit = async (event) => {
    event.preventDefault();
    setPendingFlag('space-create', true);
    try {
      await onCreateSpace({
        name: spaceForm.name,
        clientName: spaceForm.clientName,
        meetingCadence: spaceForm.meetingCadence,
        summary: spaceForm.summary,
        ownerId: spaceForm.ownerId ? Number(spaceForm.ownerId) : ownerId,
      });
      setSpaceForm({ name: '', clientName: '', meetingCadence: '', summary: '', ownerId: ownerId ?? '' });
    } catch (submitError) {
      console.error('Failed to create collaboration space', submitError);
    } finally {
      setPendingFlag('space-create', false);
    }
  };

  const updateRoomForm = (spaceId, updates) => {
    setRoomForms((previous) => {
      const existing = previous[spaceId] ?? { ...defaultRoomForm };
      return {
        ...previous,
        [spaceId]: { ...existing, ...updates },
      };
    });
  };

  const handleRoomSubmit = async (spaceId, event) => {
    event.preventDefault();
    const form = roomForms[spaceId] ?? defaultRoomForm;
    setPendingFlag(`room-${spaceId}`, true);
    try {
      await onCreateRoom(spaceId, {
        title: form.title,
        provider: form.provider,
        joinUrl: form.joinUrl,
        roomType: form.roomType,
        recordingUrl: form.recordingUrl,
      });
      setRoomForms((previous) => ({ ...previous, [spaceId]: { ...defaultRoomForm } }));
    } catch (submitError) {
      console.error('Failed to create collaboration room', submitError);
    } finally {
      setPendingFlag(`room-${spaceId}`, false);
    }
  };

  const updateAssetForm = (spaceId, updates) => {
    setAssetForms((previous) => {
      const existing = previous[spaceId] ?? { ...defaultAssetForm };
      return {
        ...previous,
        [spaceId]: { ...existing, ...updates },
      };
    });
  };

  const handleAssetSubmit = async (spaceId, event) => {
    event.preventDefault();
    const form = assetForms[spaceId] ?? defaultAssetForm;
    setPendingFlag(`asset-${spaceId}`, true);
    try {
      await onCreateAsset(spaceId, {
        title: form.title,
        assetType: form.assetType,
        status: form.status,
        sourceUrl: form.sourceUrl,
        version: form.version,
      });
      setAssetForms((previous) => ({ ...previous, [spaceId]: { ...defaultAssetForm } }));
    } catch (submitError) {
      console.error('Failed to add collaboration asset', submitError);
    } finally {
      setPendingFlag(`asset-${spaceId}`, false);
    }
  };

  const updateAnnotationForm = (assetId, updates) => {
    setAnnotationForms((previous) => {
      const existing = previous[assetId] ?? { ...defaultAnnotationForm };
      return {
        ...previous,
        [assetId]: { ...existing, ...updates },
      };
    });
  };

  const handleAnnotationSubmit = async (assetId, event) => {
    event.preventDefault();
    const form = annotationForms[assetId] ?? defaultAnnotationForm;
    setPendingFlag(`annotation-${assetId}`, true);
    try {
      await onCreateAnnotation(assetId, {
        body: form.body,
        annotationType: form.annotationType,
        context: form.timecode ? { timecode: form.timecode } : undefined,
      });
      setAnnotationForms((previous) => ({ ...previous, [assetId]: { ...defaultAnnotationForm } }));
    } catch (submitError) {
      console.error('Failed to add annotation', submitError);
    } finally {
      setPendingFlag(`annotation-${assetId}`, false);
    }
  };

  const updateRepoForm = (spaceId, updates) => {
    setRepoForms((previous) => {
      const existing = previous[spaceId] ?? { ...defaultRepoForm };
      return {
        ...previous,
        [spaceId]: { ...existing, ...updates },
      };
    });
  };

  const handleRepoSubmit = async (spaceId, event) => {
    event.preventDefault();
    const form = repoForms[spaceId] ?? defaultRepoForm;
    setPendingFlag(`repo-${spaceId}`, true);
    try {
      await onConnectRepository(spaceId, {
        provider: form.provider,
        repositoryName: form.repositoryName,
        branch: form.branch,
      });
      setRepoForms((previous) => ({ ...previous, [spaceId]: { ...defaultRepoForm } }));
    } catch (submitError) {
      console.error('Failed to connect repository', submitError);
    } finally {
      setPendingFlag(`repo-${spaceId}`, false);
    }
  };

  const updateAiForm = (spaceId, updates) => {
    setAiForms((previous) => {
      const existing = previous[spaceId] ?? { ...defaultAiForm };
      return {
        ...previous,
        [spaceId]: { ...existing, ...updates },
      };
    });
  };

  const handleAiSubmit = async (spaceId, event) => {
    event.preventDefault();
    const form = aiForms[spaceId] ?? defaultAiForm;
    if (!form.prompt || !form.prompt.trim()) {
      return;
    }
    setPendingFlag(`ai-${spaceId}`, true);
    try {
      await onCreateAiSession(spaceId, {
        sessionType: form.sessionType,
        prompt: form.prompt,
      });
      setAiForms((previous) => ({ ...previous, [spaceId]: { ...defaultAiForm } }));
    } catch (submitError) {
      console.error('Failed to run AI session', submitError);
    } finally {
      setPendingFlag(`ai-${spaceId}`, false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">Launch a new collaboration space</h4>
            <p className="text-sm text-slate-600">
              Spin up a cockpit with rooms, repositories, and review workflows ready for your next client engagement.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            <span className="font-medium text-slate-600">Last synced:</span> {formatDateTime(lastSyncedAt)}
            <button
              type="button"
              onClick={onRefresh}
              className="ml-3 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
              disabled={loading}
            >
              Refresh data
            </button>
          </div>
        </div>

        {actionNotice ? (
          <p
            className={`${
              actionNotice.type === 'error'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            } mt-4 rounded-xl border px-4 py-2 text-sm`}
          >
            {actionNotice.message}
          </p>
        ) : null}

        <form onSubmit={handleSpaceSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label htmlFor="space-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Space name
            </label>
            <input
              id="space-name"
              name="name"
              value={spaceForm.name}
              onChange={handleSpaceInputChange}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="e.g., Brand refresh launch"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="space-client" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Client name
            </label>
            <input
              id="space-client"
              name="clientName"
              value={spaceForm.clientName}
              onChange={handleSpaceInputChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="e.g., Northwind Outfitters"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="space-cadence" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Meeting cadence
            </label>
            <input
              id="space-cadence"
              name="meetingCadence"
              value={spaceForm.meetingCadence}
              onChange={handleSpaceInputChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Weekly stand-up, monthly EBR"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="space-owner" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Owner ID
            </label>
            <input
              id="space-owner"
              name="ownerId"
              type="number"
              min="1"
              value={spaceForm.ownerId}
              onChange={handleSpaceInputChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="space-summary" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Engagement summary
            </label>
            <textarea
              id="space-summary"
              name="summary"
              rows="3"
              value={spaceForm.summary}
              onChange={handleSpaceInputChange}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Outline mission, deliverables, stakeholders, and critical success metrics."
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={isPending('space-create')}
            >
              {isPending('space-create') ? 'Creating space…' : 'Create collaboration space'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-600">
          Syncing cockpit telemetry…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p className="font-semibold">We couldn't load the collaboration cockpit.</p>
          <p className="mt-2">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-4 inline-flex items-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
          >
            Retry sync
          </button>
        </div>
      ) : Array.isArray(spaces) && spaces.length ? (
        spaces.map((space) => {
          const roomForm = roomForms[space.id] ?? defaultRoomForm;
          const assetForm = assetForms[space.id] ?? defaultAssetForm;
          const repoForm = repoForms[space.id] ?? defaultRepoForm;
          const aiForm = aiForms[space.id] ?? defaultAiForm;
          return (
            <article
              key={space.id}
              className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-[0_20px_45px_-28px_rgba(30,64,175,0.45)]"
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Space #{space.id}</p>
                  <h4 className="text-xl font-semibold text-slate-900">{space.name}</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {space.summary || 'No summary captured yet.'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {space.clientName ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                        Client: {space.clientName}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                      Status: {space.status}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                      Default permission: {space.defaultPermission}
                    </span>
                    {space.meetingCadence ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                        Cadence: {space.meetingCadence}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 text-sm text-slate-700 sm:text-right">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Participants</p>
                    <p className="text-lg font-semibold text-slate-900">{space.metrics?.totalParticipants ?? space.participants?.length ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Assets</p>
                    <p className="text-lg font-semibold text-slate-900">{space.metrics?.totalAssets ?? space.assets?.length ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Open annotations</p>
                    <p className="text-lg font-semibold text-slate-900">{space.metrics?.openAnnotations ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Live rooms</h5>
                    <span className="text-xs text-slate-400">{space.rooms?.length ?? 0} active</span>
                  </div>
                  <div className="space-y-3">
                    {space.rooms?.length ? (
                      space.rooms.map((room) => (
                        <div key={room.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{room.title}</p>
                              <p className="text-xs text-slate-500">
                                {room.provider} • {room.roomType}
                              </p>
                            </div>
                            <a
                              href={room.joinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-500"
                            >
                              Join
                            </a>
                          </div>
                          {room.recordingUrl ? (
                            <a
                              href={room.recordingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex text-xs font-medium text-blue-600 hover:text-blue-500"
                            >
                              View last recording
                            </a>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-xs text-slate-500">
                        No rooms yet. Create a huddle or presentation space for live collaboration.
                      </p>
                    )}
                  </div>
                  <form className="rounded-xl border border-blue-100 bg-blue-50/70 p-4" onSubmit={(event) => handleRoomSubmit(space.id, event)}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Add a live room</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-blue-500" htmlFor={`room-title-${space.id}`}>
                          Title
                        </label>
                        <input
                          id={`room-title-${space.id}`}
                          value={roomForm.title}
                          onChange={(event) => updateRoomForm(space.id, { title: event.target.value })}
                          required
                          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="Sprint planning"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-blue-500" htmlFor={`room-provider-${space.id}`}>
                          Provider
                        </label>
                        <input
                          id={`room-provider-${space.id}`}
                          value={roomForm.provider}
                          onChange={(event) => updateRoomForm(space.id, { provider: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="Zoom, Butter, Around"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-blue-500" htmlFor={`room-url-${space.id}`}>
                          Join URL
                        </label>
                        <input
                          id={`room-url-${space.id}`}
                          value={roomForm.joinUrl}
                          onChange={(event) => updateRoomForm(space.id, { joinUrl: event.target.value })}
                          required
                          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-blue-500" htmlFor={`room-type-${space.id}`}>
                          Room type
                        </label>
                        <select
                          id={`room-type-${space.id}`}
                          value={roomForm.roomType}
                          onChange={(event) => updateRoomForm(space.id, { roomType: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="video">Video</option>
                          <option value="whiteboard">Whiteboard</option>
                          <option value="huddle">Huddle</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-blue-500" htmlFor={`room-recording-${space.id}`}>
                          Recording URL (optional)
                        </label>
                        <input
                          id={`room-recording-${space.id}`}
                          value={roomForm.recordingUrl}
                          onChange={(event) => updateRoomForm(space.id, { recordingUrl: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="https://recordings..."
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                        disabled={isPending(`room-${space.id}`)}
                      >
                        {isPending(`room-${space.id}`) ? 'Saving…' : 'Add room'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Repositories</h5>
                    <span className="text-xs text-slate-400">{space.repositories?.length ?? 0} linked</span>
                  </div>
                  <div className="space-y-3">
                    {space.repositories?.length ? (
                      space.repositories.map((repository) => (
                        <div key={repository.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">{repository.repositoryName}</p>
                              <p className="text-xs text-slate-500">
                                {repository.provider} • {repository.branch}
                              </p>
                            </div>
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                              {repository.integrationStatus}
                            </span>
                          </div>
                          {repository.lastSyncedAt ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Synced {formatDateTime(repository.lastSyncedAt)}
                            </p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-xs text-slate-500">
                        No repositories linked. Connect Git to power automated QA gates and previews.
                      </p>
                    )}
                  </div>
                  <form className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4" onSubmit={(event) => handleRepoSubmit(space.id, event)}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Connect repository</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-emerald-500" htmlFor={`repo-provider-${space.id}`}>
                          Provider
                        </label>
                        <input
                          id={`repo-provider-${space.id}`}
                          value={repoForm.provider}
                          onChange={(event) => updateRepoForm(space.id, { provider: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="github"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-emerald-500" htmlFor={`repo-name-${space.id}`}>
                          Repository
                        </label>
                        <input
                          id={`repo-name-${space.id}`}
                          value={repoForm.repositoryName}
                          onChange={(event) => updateRepoForm(space.id, { repositoryName: event.target.value })}
                          required
                          className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="org/project"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-emerald-500" htmlFor={`repo-branch-${space.id}`}>
                          Branch
                        </label>
                        <input
                          id={`repo-branch-${space.id}`}
                          value={repoForm.branch}
                          onChange={(event) => updateRepoForm(space.id, { branch: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="main"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        disabled={isPending(`repo-${space.id}`)}
                      >
                        {isPending(`repo-${space.id}`) ? 'Linking…' : 'Link repository'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Deliverables & annotations</h5>
                    <span className="text-xs text-slate-400">{space.assets?.length ?? 0} assets tracked</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {space.assets?.length ? (
                      space.assets.map((asset) => {
                        const annotationForm = annotationForms[asset.id] ?? defaultAnnotationForm;
                        return (
                          <div key={asset.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{asset.title}</p>
                                <p className="text-xs text-slate-500">
                                  {asset.assetType} • {asset.status}
                                </p>
                                {asset.version ? (
                                  <p className="text-xs text-slate-400">Version {asset.version}</p>
                                ) : null}
                              </div>
                              <a
                                href={asset.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
                              >
                                Open
                              </a>
                            </div>
                            <div className="space-y-2 text-xs text-slate-600">
                              {asset.annotations?.length ? (
                                asset.annotations.map((annotation) => (
                                  <div key={annotation.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="font-semibold text-slate-800">
                                      {annotation.author?.firstName || 'Reviewer'} {annotation.author?.lastName || ''}
                                      <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                        {annotation.status}
                                      </span>
                                    </p>
                                    <p className="mt-1 text-slate-600">{annotation.body}</p>
                                    {annotation.context?.timecode ? (
                                      <p className="mt-1 text-slate-400">Timecode: {annotation.context.timecode}</p>
                                    ) : null}
                                  </div>
                                ))
                              ) : (
                                <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-500">
                                  No annotations logged yet.
                                </p>
                              )}
                            </div>
                            <form onSubmit={(event) => handleAnnotationSubmit(asset.id, event)} className="rounded-xl border border-slate-200 bg-white p-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Add annotation
                              </p>
                              <textarea
                                rows="2"
                                value={annotationForm.body}
                                onChange={(event) => updateAnnotationForm(asset.id, { body: event.target.value })}
                                required
                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                placeholder="What needs attention?"
                              />
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <div>
                                  <label className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                    Annotation type
                                  </label>
                                  <select
                                    value={annotationForm.annotationType}
                                    onChange={(event) => updateAnnotationForm(asset.id, { annotationType: event.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                  >
                                    <option value="comment">Comment</option>
                                    <option value="issue">Issue</option>
                                    <option value="decision">Decision</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                    Timestamp / frame
                                  </label>
                                  <input
                                    value={annotationForm.timecode}
                                    onChange={(event) => updateAnnotationForm(asset.id, { timecode: event.target.value })}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="e.g., 01:32"
                                  />
                                </div>
                              </div>
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="submit"
                                  className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                  disabled={isPending(`annotation-${asset.id}`)}
                                >
                                  {isPending(`annotation-${asset.id}`) ? 'Logging…' : 'Submit note'}
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                        No deliverables uploaded yet. Add assets to orchestrate feedback and sign-off.
                      </p>
                    )}
                  </div>
                  <form className="rounded-2xl border border-slate-200 bg-white p-4" onSubmit={(event) => handleAssetSubmit(space.id, event)}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add deliverable</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400" htmlFor={`asset-title-${space.id}`}>
                          Title
                        </label>
                        <input
                          id={`asset-title-${space.id}`}
                          value={assetForm.title}
                          onChange={(event) => updateAssetForm(space.id, { title: event.target.value })}
                          required
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="Prototype v2"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400" htmlFor={`asset-type-${space.id}`}>
                          Type
                        </label>
                        <select
                          id={`asset-type-${space.id}`}
                          value={assetForm.assetType}
                          onChange={(event) => updateAssetForm(space.id, { assetType: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="file">File</option>
                          <option value="prototype">Prototype</option>
                          <option value="demo">Demo</option>
                          <option value="document">Document</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400" htmlFor={`asset-status-${space.id}`}>
                          Status
                        </label>
                        <select
                          id={`asset-status-${space.id}`}
                          value={assetForm.status}
                          onChange={(event) => updateAssetForm(space.id, { status: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="in_review">In review</option>
                          <option value="approved">Approved</option>
                          <option value="needs_changes">Needs changes</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400" htmlFor={`asset-url-${space.id}`}>
                          Source URL
                        </label>
                        <input
                          id={`asset-url-${space.id}`}
                          value={assetForm.sourceUrl}
                          onChange={(event) => updateAssetForm(space.id, { sourceUrl: event.target.value })}
                          required
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="https://files..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400" htmlFor={`asset-version-${space.id}`}>
                          Version (optional)
                        </label>
                        <input
                          id={`asset-version-${space.id}`}
                          value={assetForm.version}
                          onChange={(event) => updateAssetForm(space.id, { version: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="v2.1"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        disabled={isPending(`asset-${space.id}`)}
                      >
                        {isPending(`asset-${space.id}`) ? 'Uploading…' : 'Save deliverable'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">AI copilots</h5>
                    <span className="text-xs text-slate-400">{space.aiSessions?.length ?? 0} sessions</span>
                  </div>
                  <div className="space-y-3">
                    {space.aiSessions?.length ? (
                      space.aiSessions.map((session) => (
                        <details key={session.id} className="rounded-xl border border-slate-200 bg-slate-50">
                          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
                            {session.sessionType} assistant • {formatDateTime(session.ranAt)}
                            <span className="ml-2 inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              {session.status}
                            </span>
                          </summary>
                          <div className="space-y-3 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
                            <p className="font-semibold text-slate-800">Prompt</p>
                            <pre className="whitespace-pre-wrap rounded-lg bg-slate-900/90 p-3 text-[11px] text-slate-100">
                              {session.prompt}
                            </pre>
                            {session.response ? (
                              <>
                                <p className="font-semibold text-slate-800">Response</p>
                                <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-700">
                                  {session.response}
                                </pre>
                              </>
                            ) : null}
                          </div>
                        </details>
                      ))
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-xs text-slate-500">
                        No copilots run yet. Generate documentation, QA scripts, or stakeholder recaps on demand.
                      </p>
                    )}
                  </div>
                  <form className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4" onSubmit={(event) => handleAiSubmit(space.id, event)}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Generate with AI</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-4">
                      <div className="md:col-span-1">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-indigo-500" htmlFor={`ai-type-${space.id}`}>
                          Session type
                        </label>
                        <select
                          id={`ai-type-${space.id}`}
                          value={aiForm.sessionType}
                          onChange={(event) => updateAiForm(space.id, { sessionType: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="summary">Summary</option>
                          <option value="documentation">Documentation</option>
                          <option value="qa">QA</option>
                          <option value="retro">Retro</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-indigo-500" htmlFor={`ai-prompt-${space.id}`}>
                          Prompt
                        </label>
                        <textarea
                          id={`ai-prompt-${space.id}`}
                          rows="3"
                          value={aiForm.prompt}
                          onChange={(event) => updateAiForm(space.id, { prompt: event.target.value })}
                          required
                          className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          placeholder="Summarize stakeholder feedback and call out blockers for the next stand-up."
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                        disabled={isPending(`ai-${space.id}`)}
                      >
                        {isPending(`ai-${space.id}`) ? 'Generating…' : 'Run copilot'}
                      </button>
                    </div>
                  </form>
                </section>
              </div>

              <section className="mt-6 space-y-3">
                <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Team roster</h5>
                {space.participants?.length ? (
                  <ul className="grid gap-2 md:grid-cols-2">
                    {space.participants.map((participant) => (
                      <li key={participant.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {participant.user?.displayName || participant.user?.email || `User ${participant.userId}`}
                          </p>
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">
                            {participant.role} • {participant.permissionLevel}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          {participant.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-500">
                    Invite collaborators to assign annotation permissions and join live reviews.
                  </p>
                )}
              </section>
            </article>
          );
        })
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
          No collaboration spaces yet. Launch your first cockpit to orchestrate delivery.
        </div>
      )}
    </div>
  );
}

export default function FreelancerDashboardPage() {
  const ownerId = profile.userId ?? 1;
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [spacesError, setSpacesError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const refreshSpaces = useCallback(async () => {
    setSpacesLoading(true);
    try {
      const data = await fetchCollaborationSpaces({ ownerId, includeArchived: false });
      setSpaces(Array.isArray(data) ? data : []);
      setSpacesError(null);
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('Failed to load collaboration spaces', error);
      setSpacesError(error.message ?? 'Unable to load collaboration spaces right now.');
    } finally {
      setSpacesLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    refreshSpaces();
  }, [refreshSpaces]);

  const pushNotice = useCallback((type, message) => {
    setActionNotice({ type, message, timestamp: Date.now() });
  }, []);

  const handleCreateSpace = useCallback(
    async (payload) => {
      try {
        await createCollaborationSpace({ ...payload, ownerId: payload.ownerId ?? ownerId });
        pushNotice('success', 'Collaboration space created successfully.');
        await refreshSpaces();
      } catch (error) {
        console.error('Failed to create collaboration space', error);
        pushNotice('error', error.message ?? 'Failed to create collaboration space.');
        throw error;
      }
    },
    [ownerId, refreshSpaces, pushNotice],
  );

  const handleCreateRoom = useCallback(
    async (spaceId, payload) => {
      try {
        await createCollaborationVideoRoom(spaceId, payload);
        pushNotice('success', 'Live room added to the cockpit.');
        await refreshSpaces();
      } catch (error) {
        console.error('Failed to create collaboration room', error);
        pushNotice('error', error.message ?? 'Failed to create collaboration room.');
        throw error;
      }
    },
    [refreshSpaces, pushNotice],
  );

  const handleCreateAsset = useCallback(
    async (spaceId, payload) => {
      try {
        await createCollaborationAsset(spaceId, payload);
        pushNotice('success', 'Deliverable stored and ready for review.');
        await refreshSpaces();
      } catch (error) {
        console.error('Failed to create collaboration asset', error);
        pushNotice('error', error.message ?? 'Failed to save deliverable.');
        throw error;
      }
    },
    [refreshSpaces, pushNotice],
  );

  const handleCreateAnnotation = useCallback(
    async (assetId, payload) => {
      try {
        await createCollaborationAnnotation(assetId, payload);
        pushNotice('success', 'Annotation captured for the team.');
        await refreshSpaces();
      } catch (error) {
        console.error('Failed to create annotation', error);
        pushNotice('error', error.message ?? 'Failed to add annotation.');
        throw error;
      }
    },
    [refreshSpaces, pushNotice],
  );

  const handleConnectRepository = useCallback(
    async (spaceId, payload) => {
      try {
        await connectCollaborationRepository(spaceId, payload);
        pushNotice('success', 'Repository linked to the cockpit.');
        await refreshSpaces();
      } catch (error) {
        console.error('Failed to connect repository', error);
        pushNotice('error', error.message ?? 'Failed to connect repository.');
        throw error;
      }
    },
    [refreshSpaces, pushNotice],
  );

  const handleCreateAiSession = useCallback(
    async (spaceId, payload) => {
      try {
        await createCollaborationAiSession(spaceId, payload);
        pushNotice('success', 'AI copilot generated a new summary.');
        await refreshSpaces();
      } catch (error) {
        console.error('Failed to create AI session', error);
        pushNotice('error', error.message ?? 'Failed to run AI copilot.');
        throw error;
      }
    },
    [refreshSpaces, pushNotice],
  );

  const sectionsWithCockpit = useMemo(
    () =>
      capabilitySections.map((section) => ({
        ...section,
        features: section.features.map((feature) =>
          feature.id === 'collaboration-cockpit'
            ? {
                ...feature,
                component: (
                  <CollaborationCockpitFeature
                    spaces={spaces}
                    loading={spacesLoading}
                    error={spacesError}
                    actionNotice={actionNotice}
                    onRefresh={refreshSpaces}
                    onCreateSpace={handleCreateSpace}
                    onCreateRoom={handleCreateRoom}
                    onCreateAsset={handleCreateAsset}
                    onCreateAnnotation={handleCreateAnnotation}
                    onConnectRepository={handleConnectRepository}
                    onCreateAiSession={handleCreateAiSession}
                    ownerId={ownerId}
                    lastSyncedAt={lastSyncedAt}
                  />
                ),
              }
            : feature,
        ),
      })),
    [
      spaces,
      spacesLoading,
      spacesError,
      actionNotice,
      refreshSpaces,
      handleCreateSpace,
      handleCreateRoom,
      handleCreateAsset,
      handleCreateAnnotation,
      handleConnectRepository,
      handleCreateAiSession,
      ownerId,
      lastSyncedAt,
    ],
  );

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={sectionsWithCockpit}
      profile={profile}
      availableDashboards={availableDashboards}
    />
  );
}
