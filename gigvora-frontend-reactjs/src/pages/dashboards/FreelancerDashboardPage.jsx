import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CloudArrowDownIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import {
  fetchVaultOverview,
  fetchVaultItem,
  createDeliverable,
  addDeliverableVersion,
  generateDeliveryPackage,
} from '../../services/deliverableVault.js';

const menuSections = [
  {
    label: 'Service delivery',
    items: [
      {
        id: 'deliverable-vault',
        name: 'Deliverable vault',
        description:
          'Secure asset locker with NDA enforcement, watermark controls, versioning, and ready-to-send delivery bundles.',
        tags: ['versions', 'NDAs', 'watermarks'],
      },
      {
        id: 'project-workspace-dashboard',
        name: 'Project workspace dashboard',
        description: 'Unified workspace for briefs, assets, conversations, and approvals.',
        tags: ['whiteboards', 'files'],
      },
      {
        id: 'project-management',
        name: 'Project management',
        description: 'Detailed plan with sprints, dependencies, risk logs, and billing checkpoints.',
      },
      {
        id: 'client-portals',
        name: 'Client portals',
        description: 'Shared timelines, scope controls, and decision logs with your clients.',
      },
    ],
  },
  {
    label: 'Gig commerce',
    items: [
      {
        id: 'gig-manager',
        name: 'Gig manager',
        description: 'Monitor gigs, delivery milestones, bundled services, and upsells.',
        tags: ['gig catalog'],
      },
      {
        id: 'post-gig',
        name: 'Post a gig',
        description: 'Launch new services with pricing matrices, availability calendars, and banners.',
      },
      {
        id: 'purchased-gigs',
        name: 'Purchased gigs',
        description: 'Track incoming orders, requirements, revisions, and payouts.',
      },
    ],
  },
  {
    label: 'Growth & profile',
    items: [
      {
        id: 'freelancer-profile',
        name: 'Freelancer profile',
        description: 'Update expertise tags, success metrics, testimonials, and hero banners.',
      },
      {
        id: 'agency-collaborations',
        name: 'Agency collaborations',
        description: 'Manage invitations from agencies, share rate cards, and negotiate retainers.',
      },
      {
        id: 'finance-insights',
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
        description:
          'Host video rooms, creative proofing, code repositories, and AI assistants for documentation and QA.',
        bulletPoints: [
          'Inline annotations on files, prototypes, and project demos.',
          'Client-specific permissions with comment-only or edit access.',
        ],
      },
      {
        name: 'Deliverable vault',
        description:
          'Secure storage with tamper-proof version history, watermarking, NDA enforcement, and automated delivery packages ready for client handoff.',
        bulletPoints: [
          'Role-based permissions, viewer tracking, and expiring links keep sensitive assets under control.',
          'Auto-generate delivery summaries with success metrics, linked approvals, and next-step recommendations.',
          'Automated delivery kits bundle source files, licenses, transcripts, and checksum receipts in a single download.',
          'Comment trails, audit logs, and watermark toggles comply with NDAs and intellectual property policies.',
          'Long-term archiving and compliance exports across tax, legal, and enterprise retention requirements.',
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
  id: 4821,
  name: 'Riley Morgan',
  role: 'Lead Brand & Product Designer',
  initials: 'RM',
  status: 'Top-rated freelancer',
  badges: ['Verified Pro', 'Gigvora Elite'],
  metrics: [
    { label: 'Active projects', value: '6' },
    { label: 'Gigs fulfilled', value: '148' },
    { label: 'Avg. CSAT', value: '4.9/5' },
    { label: 'Monthly revenue', value: '$18.4k' },
  ],
};

const availableDashboards = ['freelancer', 'user', 'agency'];

const statusStyles = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-blue-50 text-blue-700 border-blue-200',
  archived: 'bg-slate-200 text-slate-600 border-slate-300',
};

const ndaStatusStyles = {
  not_required: 'bg-slate-100 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  signed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  waived: 'bg-slate-100 text-slate-600 border-slate-200',
};

const retentionLabels = {
  standard_7_year: '7-year retention',
  client_defined: 'Client policy',
  indefinite: 'Indefinite hold',
  short_term: '18-month hold',
};

const initialCreateFormState = {
  title: '',
  clientName: '',
  description: '',
  status: 'in_review',
  ndaRequired: true,
  retentionPolicy: 'standard_7_year',
  tags: '',
  initialFileName: '',
  initialFileUrl: '',
  initialFileSize: '',
  initialNotes: '',
};

const initialVersionFormState = {
  fileName: '',
  fileUrl: '',
  fileSize: '',
  notes: '',
  watermarkApplied: true,
  storageRegion: '',
};

const initialPackageFormState = {
  summary: '',
  impactScore: '',
  onTimeRate: '',
  clientCsat: '',
  expiresInDays: 45,
  includesWatermark: true,
};

function formatDate(value, options) {
  if (!value) {
    return '—';
  }
  try {
    const formatter = new Intl.DateTimeFormat('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' });
    return formatter.format(new Date(value));
  } catch (error) {
    return new Date(value).toLocaleString();
  }
}

function formatRelativeDate(value) {
  if (!value) {
    return 'Not set';
  }
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return '1 day ago';
  }
  if (diffDays < 30) {
    return `${diffDays} days ago`;
  }
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) {
    return '1 month ago';
  }
  if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  }
  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
}

function formatBytes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = numeric;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function DeliverableVaultPanel({ freelancerId }) {
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemError, setItemError] = useState(null);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateFormState);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [versionForm, setVersionForm] = useState(initialVersionFormState);
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [versionError, setVersionError] = useState(null);
  const [packageForm, setPackageForm] = useState(initialPackageFormState);
  const [isGeneratingPackage, setIsGeneratingPackage] = useState(false);
  const [packageError, setPackageError] = useState(null);

  const summaryCards = useMemo(() => {
    const summary = overview?.summary ?? {};
    return [
      {
        id: 'active',
        name: 'Active deliverables',
        value: summary.activeCount ?? 0,
        icon: DocumentDuplicateIcon,
        accent: 'bg-blue-100 text-blue-700',
      },
      {
        id: 'delivered',
        name: 'Delivered',
        value: summary.deliveredCount ?? 0,
        icon: CheckCircleIcon,
        accent: 'bg-emerald-100 text-emerald-700',
      },
      {
        id: 'nda',
        name: 'NDA compliance',
        value: `${summary.ndaCoverage ?? 0}%`,
        icon: ShieldCheckIcon,
        accent: 'bg-purple-100 text-purple-700',
      },
      {
        id: 'storage',
        name: 'Storage footprint',
        value: summary.storageUsageFormatted ?? '0 B',
        icon: CloudArrowDownIcon,
        accent: 'bg-slate-100 text-slate-700',
      },
      {
        id: 'packages',
        name: 'Delivery kits',
        value: summary.packagesGenerated ?? 0,
        icon: SparklesIcon,
        accent: 'bg-amber-100 text-amber-700',
      },
    ];
  }, [overview]);

  const loadOverview = useCallback(async () => {
    if (!freelancerId) return;
    setIsOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await fetchVaultOverview({ freelancerId });
      setOverview(data);
      setSelectedItemId((currentId) => {
        if (currentId && data.items.some((item) => item.id === currentId)) {
          return currentId;
        }
        return data.items[0]?.id ?? null;
      });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setOverviewError(error);
      }
    } finally {
      setIsOverviewLoading(false);
    }
  }, [freelancerId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!selectedItemId) {
      setSelectedItem(null);
      return;
    }
    let cancelled = false;
    setIsItemLoading(true);
    setItemError(null);
    fetchVaultItem(selectedItemId, { freelancerId })
      .then((data) => {
        if (cancelled) return;
        setSelectedItem(data.item);
      })
      .catch((error) => {
        if (cancelled || error?.name === 'AbortError') {
          return;
        }
        setItemError(error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsItemLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedItemId, freelancerId]);

  const handleCreateChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setCreateForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleCreateSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!createForm.title.trim()) {
        setCreateError(new Error('A title is required.'));
        return;
      }
      setCreateError(null);
      setIsCreating(true);
      try {
        const payload = {
          freelancerId,
          actorId: freelancerId,
          title: createForm.title.trim(),
          clientName: createForm.clientName.trim() || null,
          description: createForm.description.trim() || null,
          status: createForm.status,
          ndaRequired: createForm.ndaRequired,
          retentionPolicy: createForm.retentionPolicy,
          tags: createForm.tags,
        };

        if (createForm.initialFileName && createForm.initialFileUrl) {
          payload.initialVersion = {
            fileName: createForm.initialFileName,
            fileUrl: createForm.initialFileUrl,
            fileSize: createForm.initialFileSize ? Number(createForm.initialFileSize) : undefined,
            notes: createForm.initialNotes || undefined,
            watermarkApplied: true,
          };
        }

        const response = await createDeliverable(payload);
        setCreateForm(initialCreateFormState);
        setOverview(response.overview);
        setSelectedItemId(response.item.id);
        setSelectedItem(response.item);
      } catch (error) {
        setCreateError(error);
      } finally {
        setIsCreating(false);
      }
    },
    [createForm, freelancerId],
  );

  const handleVersionChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setVersionForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleVersionSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedItemId) {
        return;
      }
      if (!versionForm.fileName || !versionForm.fileUrl) {
        setVersionError(new Error('A file name and secure URL are required.'));
        return;
      }
      setVersionError(null);
      setIsAddingVersion(true);
      try {
        const response = await addDeliverableVersion(selectedItemId, {
          freelancerId,
          actorId: freelancerId,
          fileName: versionForm.fileName,
          fileUrl: versionForm.fileUrl,
          fileSize: versionForm.fileSize ? Number(versionForm.fileSize) : undefined,
          notes: versionForm.notes || undefined,
          watermarkApplied: versionForm.watermarkApplied,
          storageRegion: versionForm.storageRegion || undefined,
        });
        setVersionForm(initialVersionFormState);
        setOverview(response.overview);
        setSelectedItem(response.item);
      } catch (error) {
        setVersionError(error);
      } finally {
        setIsAddingVersion(false);
      }
    },
    [selectedItemId, versionForm, freelancerId],
  );

  const handlePackageChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setPackageForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handlePackageSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedItemId) {
        return;
      }
      setPackageError(null);
      setIsGeneratingPackage(true);
      try {
        const metrics = {};
        if (packageForm.impactScore) metrics.impactScore = Number(packageForm.impactScore);
        if (packageForm.onTimeRate) metrics.onTimeRate = Number(packageForm.onTimeRate);
        if (packageForm.clientCsat) metrics.clientCsat = Number(packageForm.clientCsat);

        const response = await generateDeliveryPackage(selectedItemId, {
          freelancerId,
          actorId: freelancerId,
          summary: packageForm.summary || undefined,
          metrics,
          expiresInDays: packageForm.expiresInDays ? Number(packageForm.expiresInDays) : undefined,
          includesWatermark: packageForm.includesWatermark,
        });

        setPackageForm(initialPackageFormState);
        setOverview(response.overview);
        setSelectedItem(response.item);
      } catch (error) {
        setPackageError(error);
      } finally {
        setIsGeneratingPackage(false);
      }
    },
    [selectedItemId, packageForm, freelancerId],
  );

  const items = overview?.items ?? [];
  const summary = overview?.summary ?? {};

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600">Delivery lifecycle</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Deliverable vault</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Upload, watermark, and distribute production-ready files with auditable NDAs, retention policies, and delivery
              packages tailored to each client.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadOverview}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-700"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isOverviewLoading ? 'animate-spin text-blue-500' : 'text-slate-400'}`} />
              Refresh
            </button>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <ShieldCheckIcon className="h-4 w-4" />
              NDA enforced
            </span>
          </div>
        </div>

        {overviewError ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <p>{overviewError.message || 'Failed to load deliverable overview.'}</p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summaryCards.map((card) => (
            <div key={card.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${card.accent} border-transparent`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide">{card.name}</p>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-semibold">Expiring retention</p>
            <p className="mt-1 text-2xl font-semibold text-blue-900">{summary.expiringRetentionCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold">Pending NDAs</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.pendingNdaCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <p className="font-semibold">Watermarked versions</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-900">{summary.watermarkedDeliverables ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <p className="font-semibold">Archived kits</p>
            <p className="mt-1 text-2xl font-semibold text-amber-900">{summary.archivedCount ?? 0}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,3fr)]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Vault inventory</h3>
              <span className="text-xs text-slate-500">{items.length} records</span>
            </div>
            <div className="mt-4 space-y-3">
              {isOverviewLoading && !items.length ? (
                <p className="text-sm text-slate-500">Loading deliverables…</p>
              ) : null}
              {!isOverviewLoading && !items.length ? (
                <p className="text-sm text-slate-500">
                  No deliverables yet. Create one below to start tracking approvals and delivery kits.
                </p>
              ) : null}
              {items.map((item) => {
                const isActive = item.id === selectedItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.clientName || 'Internal use'}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          statusStyles[item.status] || statusStyles.draft
                        }`}
                      >
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
                      <div>
                        <p className="font-medium text-slate-500">Versions</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.versionCount}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-500">Latest update</p>
                        <p className="mt-1 text-sm text-slate-900">{formatRelativeDate(item.updatedAt)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-500">Retention</p>
                        <p className="mt-1 text-sm text-slate-900">{retentionLabels[item.retentionPolicy] || 'Policy set'}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Create deliverable</h3>
            <p className="mt-1 text-sm text-slate-500">
              Document project outcomes with automated watermarking, NDA controls, and delivery summaries.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleCreateSubmit}>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="create-title">
                  Title
                </label>
                <input
                  id="create-title"
                  name="title"
                  value={createForm.title}
                  onChange={handleCreateChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Brand system handoff, analytics report, campaign toolkit…"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="create-clientName">
                    Client / recipient
                  </label>
                  <input
                    id="create-clientName"
                    name="clientName"
                    value={createForm.clientName}
                    onChange={handleCreateChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Acme Ventures"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="create-status">
                    Status
                  </label>
                  <select
                    id="create-status"
                    name="status"
                    value={createForm.status}
                    onChange={handleCreateChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In review</option>
                    <option value="approved">Approved</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="create-description">
                  Description
                </label>
                <textarea
                  id="create-description"
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateChange}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Summarize the scope, milestone approvals, and coverage."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="create-retentionPolicy">
                    Retention
                  </label>
                  <select
                    id="create-retentionPolicy"
                    name="retentionPolicy"
                    value={createForm.retentionPolicy}
                    onChange={handleCreateChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="standard_7_year">7-year retention</option>
                    <option value="client_defined">Client-defined</option>
                    <option value="short_term">18-month retention</option>
                    <option value="indefinite">Indefinite hold</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="create-tags">
                    Tags
                  </label>
                  <input
                    id="create-tags"
                    name="tags"
                    value={createForm.tags}
                    onChange={handleCreateChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="brand, q3, campaign"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="ndaRequired"
                  checked={createForm.ndaRequired}
                  onChange={handleCreateChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                NDA must be executed before access
              </label>
              <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold text-slate-600">Attach first version</summary>
                <div className="mt-3 space-y-3">
                  <input
                    name="initialFileName"
                    value={createForm.initialFileName}
                    onChange={handleCreateChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="handoff.zip"
                  />
                  <input
                    name="initialFileUrl"
                    value={createForm.initialFileUrl}
                    onChange={handleCreateChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="https://storage.gigvora.com/..."
                  />
                  <input
                    name="initialFileSize"
                    value={createForm.initialFileSize}
                    onChange={handleCreateChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="File size in bytes"
                  />
                  <textarea
                    name="initialNotes"
                    value={createForm.initialNotes}
                    onChange={handleCreateChange}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Notes for reviewers"
                  />
                </div>
              </details>
              {createError ? <p className="text-sm text-rose-600">{createError.message}</p> : null}
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                disabled={isCreating}
              >
                {isCreating ? 'Creating…' : 'Create deliverable'}
              </button>
            </form>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {isItemLoading && !selectedItem ? (
              <p className="text-sm text-slate-500">Loading deliverable details…</p>
            ) : null}
            {itemError ? (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <p>{itemError.message || 'Unable to load deliverable details.'}</p>
              </div>
            ) : null}
            {selectedItem ? (
              <div className="space-y-6">
                <header className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Deliverable</p>
                    <h3 className="text-2xl font-semibold text-slate-900">{selectedItem.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{selectedItem.description || 'No description provided.'}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold uppercase tracking-wide ${
                          statusStyles[selectedItem.status] || statusStyles.draft
                        }`}
                      >
                        {selectedItem.status.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 font-semibold uppercase tracking-wide ${
                          ndaStatusStyles[selectedItem.ndaStatus] || ndaStatusStyles.not_required
                        }`}
                      >
                        NDA {selectedItem.ndaStatus.replace(/_/g, ' ')}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600">
                        {retentionLabels[selectedItem.retentionPolicy] || 'Retention policy'}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Summary</p>
                    <dl className="mt-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <dt>Versions</dt>
                        <dd className="font-semibold text-slate-900">{selectedItem.versionCount}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt>Latest package</dt>
                        <dd className="font-semibold text-slate-900">
                          {selectedItem.deliveryPackages?.[0]?.generatedAt
                            ? formatDate(selectedItem.deliveryPackages[0].generatedAt)
                            : 'Not generated'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt>Delivered</dt>
                        <dd className="font-semibold text-slate-900">{formatDate(selectedItem.deliveredAt)}</dd>
                      </div>
                    </dl>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-700">Version history</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {selectedItem.versions?.map((version) => (
                        <li
                          key={version.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">v{version.versionNumber}</p>
                            <p className="text-xs text-slate-500">{version.fileName}</p>
                            <p className="text-xs text-slate-400">{formatDate(version.uploadedAt, { month: 'short', day: 'numeric' })}</p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <p>{formatBytes(version.fileSize || 0)}</p>
                            <p>{version.watermarkApplied ? 'Watermarked' : 'No watermark'}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-700">Delivery packages</h4>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {selectedItem.deliveryPackages?.length ? (
                        selectedItem.deliveryPackages.map((pkg) => (
                          <li
                            key={pkg.id}
                            className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-white p-3"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">Package #{pkg.id}</p>
                              <p className="text-xs text-slate-500">{pkg.packageKey}</p>
                              <p className="text-xs text-slate-400">Expires {pkg.expiresAt ? formatDate(pkg.expiresAt) : 'no expiry'}</p>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                              <p>{pkg.deliveryMetrics?.versionCount ?? 0} versions</p>
                              <p>{pkg.includesWatermark ? 'Watermarked' : 'Raw'}</p>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                          No delivery kits generated yet.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-700">Audit trail</h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-500">
                    {selectedItem.auditTrail?.length ? (
                      selectedItem.auditTrail
                        .slice()
                        .reverse()
                        .map((entry) => (
                          <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="font-semibold text-slate-700">{entry.eventType.replace(/_/g, ' ')}</p>
                            <p className="text-slate-500">{formatDate(entry.occurredAt)}</p>
                          </li>
                        ))
                    ) : (
                      <li className="rounded-xl border border-dashed border-slate-200 p-3">No audit entries yet.</li>
                    )}
                  </ul>
                </div>

                <form className="rounded-2xl border border-slate-200 bg-white p-4" onSubmit={handleVersionSubmit}>
                  <h4 className="text-sm font-semibold text-slate-700">Upload new version</h4>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      name="fileName"
                      value={versionForm.fileName}
                      onChange={handleVersionChange}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="deliverable_v2.zip"
                      required
                    />
                    <input
                      name="fileUrl"
                      value={versionForm.fileUrl}
                      onChange={handleVersionChange}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="https://cdn.gigvora.com/..."
                      required
                    />
                    <input
                      name="fileSize"
                      value={versionForm.fileSize}
                      onChange={handleVersionChange}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="File size in bytes"
                    />
                    <input
                      name="storageRegion"
                      value={versionForm.storageRegion}
                      onChange={handleVersionChange}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Storage region (eu-central-1)"
                    />
                  </div>
                  <textarea
                    name="notes"
                    value={versionForm.notes}
                    onChange={handleVersionChange}
                    rows={2}
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="QA findings, watermark adjustments, or review notes."
                  />
                  <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      name="watermarkApplied"
                      checked={versionForm.watermarkApplied}
                      onChange={handleVersionChange}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Apply dynamic watermark to this version
                  </label>
                  {versionError ? <p className="mt-2 text-sm text-rose-600">{versionError.message}</p> : null}
                  <button
                    type="submit"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    disabled={isAddingVersion}
                  >
                    {isAddingVersion ? 'Uploading…' : 'Upload version'}
                  </button>
                </form>

                <form className="rounded-2xl border border-slate-200 bg-white p-4" onSubmit={handlePackageSubmit}>
                  <h4 className="text-sm font-semibold text-slate-700">Generate delivery package</h4>
                  <textarea
                    name="summary"
                    value={packageForm.summary}
                    onChange={handlePackageChange}
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Custom delivery summary (optional)."
                  />
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact score</label>
                      <input
                        name="impactScore"
                        value={packageForm.impactScore}
                        onChange={handlePackageChange}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="92"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">On-time %</label>
                      <input
                        name="onTimeRate"
                        value={packageForm.onTimeRate}
                        onChange={handlePackageChange}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client CSAT</label>
                      <input
                        name="clientCsat"
                        value={packageForm.clientCsat}
                        onChange={handlePackageChange}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="4.9"
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry (days)</label>
                      <input
                        name="expiresInDays"
                        value={packageForm.expiresInDays}
                        onChange={handlePackageChange}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="45"
                      />
                    </div>
                    <label className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        name="includesWatermark"
                        checked={packageForm.includesWatermark}
                        onChange={handlePackageChange}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Include watermark in delivery bundle
                    </label>
                  </div>
                  {packageError ? <p className="mt-2 text-sm text-rose-600">{packageError.message}</p> : null}
                  <button
                    type="submit"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    disabled={isGeneratingPackage}
                  >
                    {isGeneratingPackage ? 'Generating…' : 'Generate package'}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function FreelancerDashboardPage() {
  const [activeMenuItemId, setActiveMenuItemId] = useState('deliverable-vault');
  const handleMenuItemClick = useCallback((item) => {
    setActiveMenuItemId(item.id ?? item.name);
  }, []);

  const showDeliverableVault = activeMenuItemId === 'deliverable-vault';

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer Operations HQ"
      subtitle="Service business cockpit"
      description="An operating system for independent talent to manage gigs, complex projects, finances, and growth partnerships in one streamlined workspace."
      menuSections={menuSections}
      sections={capabilitySections}
      profile={profile}
      availableDashboards={availableDashboards}
      activeMenuItemId={activeMenuItemId}
      onMenuItemClick={handleMenuItemClick}
    >
      {showDeliverableVault ? <DeliverableVaultPanel freelancerId={profile.id} /> : null}
    </DashboardLayout>
  );
}
