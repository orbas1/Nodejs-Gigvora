import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AcademicCapIcon,
  BanknotesIcon,
  BoltIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Modal from '../ui/Modal.jsx';
import {
  createProject,
  createGigOrder,
  createEscrowTransaction,
} from '../../services/projectGigManagement.js';
import { createTransferRequest } from '../../services/walletManagement.js';
import { createMentoringSession } from '../../services/userMentoring.js';

const ACTIONS = [
  {
    id: 'project',
    title: 'Launch a project',
    description: 'Kick off a scoped engagement with budget, brief, and timelines.',
    icon: BriefcaseIcon,
    accent: 'bg-sky-50 border-sky-100',
  },
  {
    id: 'gig-order',
    title: 'Issue a gig order',
    description: 'Engage a vendor with service scope, pricing, and deliverables.',
    icon: BoltIcon,
    accent: 'bg-violet-50 border-violet-100',
  },
  {
    id: 'escrow',
    title: 'Fund escrow milestone',
    description: 'Secure a delivery by reserving funds and setting a release plan.',
    icon: ShieldCheckIcon,
    accent: 'bg-emerald-50 border-emerald-100',
  },
  {
    id: 'wallet',
    title: 'Schedule wallet transfer',
    description: 'Move funds across sources, wallets, or payouts with confidence.',
    icon: BanknotesIcon,
    accent: 'bg-amber-50 border-amber-100',
  },
  {
    id: 'mentoring',
    title: 'Book a mentor',
    description: 'Lock in a session with curated experts and attach a prep brief.',
    icon: AcademicCapIcon,
    accent: 'bg-indigo-50 border-indigo-100',
  },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
];

const TRANSFER_TYPES = [
  { value: 'instant', label: 'Instant payout' },
  { value: 'scheduled', label: 'Scheduled transfer' },
  { value: 'recurring', label: 'Recurring automation' },
];

const ACTION_WIZARDS = {
  project: [
    { title: 'Brief', description: 'Summarise the mandate, outcomes, and scope.' },
    { title: 'Crew', description: 'Reference templates and collaborators to notify instantly.' },
    { title: 'Timeline', description: 'Set due dates, kickoff links, and hero media.' },
  ],
  'gig-order': [
    { title: 'Scope', description: 'Choose the project context and vendor service.' },
    { title: 'Terms', description: 'Lock in amount, currency, and delivery windows.' },
    { title: 'Handoff', description: 'Attach briefs or media so fulfilment begins immediately.' },
  ],
  escrow: [
    { title: 'Reference', description: 'Link the milestone or gig order that is being secured.' },
    { title: 'Safeguard', description: 'Allocate funds, account, and the release strategy.' },
    { title: 'Signal', description: 'Notify all stakeholders for auditing and trust.' },
  ],
  wallet: [
    { title: 'Source', description: 'Select wallet and funding source or enter manually.' },
    { title: 'Destination', description: 'Define the receiving party, purpose, and cadence.' },
    { title: 'Govern', description: 'Add treasury notes so reconciliation stays effortless.' },
  ],
  mentoring: [
    { title: 'Mentor', description: 'Pick the expert or paste their handle to cross-invite.' },
    { title: 'Session', description: 'Schedule, confirm duration, and share prep material.' },
    { title: 'Enablement', description: 'Drop meeting links, recordings, and compliance signals.' },
  ],
};

const DEFAULT_ACTIVITY_PLACEHOLDER = [
  {
    id: 'activity-project',
    title: 'Onboarded new product launch project',
    summary: 'Kickoff deck shared with design and growth pods.',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'activity-escrow',
    title: 'Escrow milestone funded',
    summary: 'USD 12,500 reserved for “Launch sprint” deliverable.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'activity-mentor',
    title: 'Mentor session confirmed',
    summary: 'Booked with Jordan Wells for go-to-market rehearsal.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'activity-wallet',
    title: 'Treasury automation executed',
    summary: 'Recurring transfer pushed to growth wallet.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

function isValidUrl(value) {
  if (!value) {
    return true;
  }
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch (error) {
    return false;
  }
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function splitEmails(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

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
    return `${currency} ${formatNumber(value)}`;
  }
}

function formatDateTime(value) {
  if (!value) {
    return 'Just now';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }
  return date.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  });
}

function parseNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return numeric;
}

function toIsoDate(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function buildInitialForm(actionId) {
  switch (actionId) {
    case 'project':
      return {
        title: '',
        description: '',
        budget: '',
        currency: 'USD',
        dueDate: '',
        templateId: '',
        kickoffLink: '',
        mediaUrl: '',
      };
    case 'gig-order':
      return {
        projectId: '',
        vendorName: '',
        serviceName: '',
        amount: '',
        currency: 'USD',
        dueAt: '',
        notes: '',
        briefUrl: '',
        attachmentUrl: '',
      };
    case 'escrow':
      return {
        escrowAccountId: '',
        orderId: '',
        amount: '',
        currency: 'USD',
        releaseAfter: '',
        memo: '',
        autoRelease: 'manual',
        notificationEmails: '',
      };
    case 'wallet':
      return {
        walletAccountId: '',
        fundingSourceId: '',
        amount: '',
        transferType: 'instant',
        scheduledAt: '',
        notes: '',
        destination: '',
        referenceCode: '',
      };
    case 'mentoring':
      return {
        mentorId: '',
        topic: '',
        scheduledAt: '',
        durationMinutes: '60',
        notes: '',
        meetingUrl: '',
        recordingConsent: 'allow',
        preSessionVideoUrl: '',
      };
    default:
      return {};
  }
}

function validateForm(actionId, form) {
  const errors = {};
  if (actionId === 'project') {
    if (!form.title?.trim()) {
      errors.title = 'Add a project name.';
    }
    if (!form.description?.trim()) {
      errors.description = 'Add a project description.';
    }
    const budget = parseNumber(form.budget);
    if (form.budget && (budget == null || budget <= 0)) {
      errors.budget = 'Enter a valid amount.';
    }
    if (form.kickoffLink && !isValidUrl(form.kickoffLink)) {
      errors.kickoffLink = 'Enter a valid kickoff URL.';
    }
    if (form.mediaUrl && !isValidUrl(form.mediaUrl)) {
      errors.mediaUrl = 'Provide a valid media link.';
    }
  }
  if (actionId === 'gig-order') {
    if (!form.vendorName?.trim()) {
      errors.vendorName = 'Enter the vendor or freelancer name.';
    }
    if (!form.serviceName?.trim()) {
      errors.serviceName = 'Describe the service ordered.';
    }
    const amount = parseNumber(form.amount);
    if (amount == null || amount <= 0) {
      errors.amount = 'Add a positive amount.';
    }
    if (form.briefUrl && !isValidUrl(form.briefUrl)) {
      errors.briefUrl = 'Enter a valid brief URL.';
    }
    if (form.attachmentUrl && !isValidUrl(form.attachmentUrl)) {
      errors.attachmentUrl = 'Enter a valid attachment URL.';
    }
  }
  if (actionId === 'escrow') {
    if (!form.orderId?.trim()) {
      errors.orderId = 'Reference the related gig order ID.';
    }
    const amount = parseNumber(form.amount);
    if (amount == null || amount <= 0) {
      errors.amount = 'Escrow requires a positive amount.';
    }
    const emails = splitEmails(form.notificationEmails);
    if (emails.some((email) => !isValidEmail(email))) {
      errors.notificationEmails = 'Fix the email list (comma separated).';
    }
    if (form.autoRelease && !['manual', 'date', 'milestone'].includes(form.autoRelease)) {
      errors.autoRelease = 'Choose a valid release mode.';
    }
  }
  if (actionId === 'wallet') {
    const amount = parseNumber(form.amount);
    if (amount == null || amount <= 0) {
      errors.amount = 'Enter an amount to transfer.';
    }
    if (!form.walletAccountId?.trim()) {
      errors.walletAccountId = 'Wallet account ID is required.';
    }
    if (form.destination && form.destination.trim().length < 3) {
      errors.destination = 'Describe where the transfer is headed.';
    }
    if (form.referenceCode && form.referenceCode.trim().length < 3) {
      errors.referenceCode = 'Reference code is too short.';
    }
  }
  if (actionId === 'mentoring') {
    if (!form.mentorId?.trim()) {
      errors.mentorId = 'Select a mentor.';
    }
    if (!form.topic?.trim()) {
      errors.topic = 'Add a session focus.';
    }
    const duration = parseNumber(form.durationMinutes);
    if (duration == null || duration <= 0) {
      errors.durationMinutes = 'Duration must be positive.';
    }
    if (form.meetingUrl && !isValidUrl(form.meetingUrl)) {
      errors.meetingUrl = 'Enter a valid meeting link.';
    }
    if (form.preSessionVideoUrl && !isValidUrl(form.preSessionVideoUrl)) {
      errors.preSessionVideoUrl = 'Link to a valid prep video.';
    }
    if (form.recordingConsent && !['allow', 'deny'].includes(form.recordingConsent)) {
      errors.recordingConsent = 'Select a consent option.';
    }
  }
  return errors;
}

async function submitAction(actionId, userId, form) {
  switch (actionId) {
    case 'project': {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        budgetAllocated: parseNumber(form.budget) ?? undefined,
        budgetCurrency: form.currency || 'USD',
        dueDate: toIsoDate(form.dueDate),
      };
      const metadata = {};
      const templateId = form.templateId?.trim();
      if (templateId) {
        payload.templateId = templateId;
        metadata.templateId = templateId;
      }
      const kickoffLink = form.kickoffLink?.trim();
      if (kickoffLink) {
        metadata.kickoffLink = kickoffLink;
      }
      const mediaUrl = form.mediaUrl?.trim();
      if (mediaUrl) {
        metadata.heroMedia = { url: mediaUrl };
      }
      if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }
      await createProject(userId, payload);
      return 'Project created successfully.';
    }
    case 'gig-order': {
      const payload = {
        vendorName: form.vendorName.trim(),
        serviceName: form.serviceName.trim(),
        amount: parseNumber(form.amount),
        currency: form.currency || 'USD',
        dueAt: toIsoDate(form.dueAt),
        notes: form.notes?.trim() || undefined,
      };
      const metadata = {};
      const projectId = form.projectId?.trim();
      if (projectId) {
        payload.projectId = projectId;
      }
      const briefUrl = form.briefUrl?.trim();
      if (briefUrl) {
        metadata.briefUrl = briefUrl;
      }
      const attachmentUrl = form.attachmentUrl?.trim();
      if (attachmentUrl) {
        metadata.attachmentUrl = attachmentUrl;
      }
      if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }
      await createGigOrder(userId, payload);
      return 'Gig order issued.';
    }
    case 'escrow': {
      const payload = {
        orderId: form.orderId.trim(),
        amount: parseNumber(form.amount),
        currency: form.currency || 'USD',
        releaseAfter: toIsoDate(form.releaseAfter),
        memo: form.memo?.trim() || undefined,
      };
      const metadata = {};
      const escrowAccountId = form.escrowAccountId?.trim();
      if (escrowAccountId) {
        payload.escrowAccountId = escrowAccountId;
      }
      if (form.autoRelease && form.autoRelease !== 'manual') {
        metadata.releaseStrategy = form.autoRelease;
      }
      const emails = splitEmails(form.notificationEmails);
      if (emails.length) {
        metadata.notificationEmails = emails;
      }
      if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }
      await createEscrowTransaction(userId, payload);
      return 'Escrow funded for the order.';
    }
    case 'wallet': {
      const payload = {
        walletAccountId: form.walletAccountId.trim(),
        fundingSourceId: form.fundingSourceId?.trim() || undefined,
        amount: parseNumber(form.amount),
        transferType: form.transferType || 'instant',
        notes: form.notes?.trim() || undefined,
        scheduledAt: toIsoDate(form.scheduledAt),
      };
      const metadata = {};
      const destination = form.destination?.trim();
      if (destination) {
        metadata.destination = destination;
      }
      const referenceCode = form.referenceCode?.trim();
      if (referenceCode) {
        payload.referenceCode = referenceCode;
      }
      if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }
      await createTransferRequest(userId, payload);
      return 'Wallet transfer scheduled.';
    }
    case 'mentoring': {
      const payload = {
        mentorId: form.mentorId.trim(),
        topic: form.topic.trim(),
        scheduledAt: toIsoDate(form.scheduledAt),
        durationMinutes: parseNumber(form.durationMinutes) ?? 60,
        notes: form.notes?.trim() || undefined,
      };
      const metadata = {};
      const meetingUrl = form.meetingUrl?.trim();
      if (meetingUrl) {
        payload.meetingUrl = meetingUrl;
      }
      if (form.recordingConsent) {
        payload.recordingConsent = form.recordingConsent;
      }
      const preSessionVideoUrl = form.preSessionVideoUrl?.trim();
      if (preSessionVideoUrl) {
        metadata.preSessionVideoUrl = preSessionVideoUrl;
      }
      if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }
      await createMentoringSession(userId, payload);
      return 'Mentor session booked.';
    }
    default:
      return null;
  }
}

function Field({ label, error, children, required }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-700">
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
};

Field.defaultProps = {
  error: '',
  required: false,
};

function StatusMessage({ status }) {
  if (!status) {
    return null;
  }
  const tone = status.type === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-600'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <div className={clsx('rounded-2xl border px-4 py-3 text-sm font-medium', tone)}>{status.message}</div>
  );
}

StatusMessage.propTypes = {
  status: PropTypes.shape({
    type: PropTypes.oneOf(['error', 'success']).isRequired,
    message: PropTypes.string.isRequired,
  }),
};

StatusMessage.defaultProps = {
  status: null,
};

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  hint: PropTypes.string,
};

MetricCard.defaultProps = {
  hint: '',
};

function ActionWizard({ steps }) {
  if (!steps || steps.length === 0) {
    return null;
  }
  return (
    <ol className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title ?? index} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Step {index + 1}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{step.title}</p>
          <p className="mt-1 text-xs text-slate-600">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}

ActionWizard.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    }),
  ),
};

ActionWizard.defaultProps = {
  steps: [],
};

function ActivityList({ items, mentorsUpcoming }) {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Live activity feed</h3>
        {mentorsUpcoming != null ? (
          <span className="rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
            {formatNumber(mentorsUpcoming)} mentor {mentorsUpcoming === 1 ? 'session' : 'sessions'}
          </span>
        ) : null}
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200 hover:bg-white"
          >
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            {item.summary ? <p className="mt-1 text-xs text-slate-600">{item.summary}</p> : null}
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {formatDateTime(item.timestamp)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

ActivityList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      summary: PropTypes.string,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
  ),
  mentorsUpcoming: PropTypes.number,
};

ActivityList.defaultProps = {
  items: [],
  mentorsUpcoming: null,
};

export default function UserDashboardQuickActions({ userId, onActionComplete, className, context }) {
  const [activeAction, setActiveAction] = useState(null);
  const [form, setForm] = useState(() => buildInitialForm(null));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const {
    projects = [],
    projectTemplates = [],
    walletAccounts = [],
    fundingSources = [],
    mentors = [],
    escrowAccounts = [],
    activityFeed = [],
    metrics = {},
  } = context ?? {};

  const currency = metrics?.currency ?? 'USD';

  const projectOptions = useMemo(() => {
    return projects
      .map((project) => {
        const meta = project?.project ?? project;
        const id = project?.id ?? meta?.id ?? meta?.slug ?? meta?.code ?? null;
        if (!id) {
          return null;
        }
        const title = meta?.title ?? meta?.name ?? meta?.label ?? `Project ${id}`;
        const statusLabel = project?.status ?? meta?.status ?? 'active';
        return { id, title, status: statusLabel };
      })
      .filter(Boolean);
  }, [projects]);

  const templateOptions = useMemo(() => {
    return projectTemplates
      .map((template, index) => {
        const id = template?.id ?? template?.slug ?? template?.code ?? template?.name ?? `template-${index}`;
        const name = template?.name ?? template?.title ?? `Template ${index + 1}`;
        const description = template?.description ?? template?.summary ?? '';
        return { id, name, description };
      })
      .filter(Boolean);
  }, [projectTemplates]);

  const walletOptions = useMemo(() => {
    return walletAccounts
      .map((wallet, index) => {
        const id = wallet?.id ?? wallet?.accountId ?? wallet?.slug ?? wallet?.code ?? `wallet-${index}`;
        const label = wallet?.name ?? wallet?.label ?? wallet?.accountName ?? `Wallet ${index + 1}`;
        const walletCurrency = wallet?.currency ?? currency;
        const balance = wallet?.balance ?? wallet?.availableBalance ?? wallet?.currentBalance ?? 0;
        return { id, label, currency: walletCurrency, balance };
      })
      .filter(Boolean);
  }, [walletAccounts, currency]);

  const fundingOptions = useMemo(() => {
    return fundingSources
      .map((source, index) => {
        const id = source?.id ?? source?.sourceId ?? source?.slug ?? source?.code ?? `source-${index}`;
        const label = source?.name ?? source?.label ?? source?.type ?? `Source ${index + 1}`;
        return { id, label };
      })
      .filter(Boolean);
  }, [fundingSources]);

  const mentorOptions = useMemo(() => {
    return mentors
      .map((mentor, index) => {
        const id = mentor?.id ?? mentor?.mentorId ?? mentor?.handle ?? mentor?.username ?? `mentor-${index}`;
        const name =
          mentor?.name ??
          [mentor?.firstName, mentor?.lastName].filter(Boolean).join(' ') ??
          mentor?.handle ??
          `Mentor ${index + 1}`;
        const headline = mentor?.headline ?? mentor?.title ?? mentor?.expertise ?? '';
        return { id, name: name.trim(), headline };
      })
      .filter(Boolean);
  }, [mentors]);

  const escrowOptions = useMemo(() => {
    return escrowAccounts
      .map((account, index) => {
        const id = account?.id ?? account?.accountId ?? account?.slug ?? account?.code ?? `escrow-${index}`;
        const name = account?.name ?? account?.label ?? account?.title ?? `Escrow ${index + 1}`;
        const accountCurrency = account?.currency ?? currency;
        return { id, name, currency: accountCurrency };
      })
      .filter(Boolean);
  }, [escrowAccounts, currency]);

  const resolvedActivity = useMemo(() => {
    const base = Array.isArray(activityFeed) && activityFeed.length ? activityFeed : DEFAULT_ACTIVITY_PLACEHOLDER;
    return base.slice(0, 6).map((item, index) => ({
      id: item?.id ?? item?.activityId ?? `activity-${index}`,
      title: item?.title ?? item?.name ?? item?.action ?? 'Activity update',
      summary: item?.summary ?? item?.description ?? item?.details ?? '',
      timestamp: item?.timestamp ?? item?.performedAt ?? item?.createdAt ?? item?.date ?? null,
    }));
  }, [activityFeed]);

  const mentorsUpcoming = metrics?.mentorsUpcoming ?? 0;

  const quickStats = useMemo(() => {
    return [
      {
        id: 'projects',
        label: 'Active projects',
        value: formatNumber(metrics?.activeProjects ?? 0),
        hint: 'Running now',
      },
      {
        id: 'orders',
        label: 'Open gig orders',
        value: formatNumber(metrics?.openGigOrders ?? 0),
        hint: 'Awaiting delivery',
      },
      {
        id: 'escrow',
        label: 'Escrow in flight',
        value: formatCurrency(metrics?.escrowHeld ?? 0, currency),
        hint: 'Secured funds',
      },
      {
        id: 'wallet',
        label: 'Wallet balance',
        value: formatCurrency(metrics?.walletBalance ?? 0, currency),
        hint: 'Ready to deploy',
      },
    ];
  }, [currency, metrics?.activeProjects, metrics?.escrowHeld, metrics?.openGigOrders, metrics?.walletBalance]);

  const modalConfig = useMemo(() => ACTIONS.find((action) => action.id === activeAction), [activeAction]);

  const openAction = (actionId) => {
    setActiveAction(actionId);
    setForm(buildInitialForm(actionId));
    setErrors({});
    setStatus(null);
  };

  const closeModal = () => {
    setActiveAction(null);
    setStatus(null);
  };

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeAction) {
      return;
    }
    const validation = validateForm(activeAction, form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setStatus({ type: 'error', message: 'Review the highlighted fields.' });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    try {
      const message = await submitAction(activeAction, userId, form);
      setStatus({ type: 'success', message: message ?? 'Action completed.' });
      setErrors({});
      onActionComplete?.(activeAction);
      setTimeout(() => {
        closeModal();
      }, 1200);
    } catch (error) {
      setStatus({ type: 'error', message: error?.message ?? 'Unable to complete the action.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = () => {
    if (!activeAction) {
      return null;
    }
    switch (activeAction) {
      case 'project':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ActionWizard steps={ACTION_WIZARDS.project} />
            <StatusMessage status={status} />
            <Field label="Project name" error={errors.title} required>
              <input
                type="text"
                value={form.title}
                onChange={handleChange('title')}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="Growth marketing sprint"
              />
            </Field>
            <Field label="Project description" error={errors.description} required>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="Outline the outcomes, stakeholders, and timeline expectations."
              />
            </Field>
            {templateOptions.length > 0 ? (
              <Field label="Starter template">
                <select
                  value={form.templateId}
                  onChange={handleChange('templateId')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  <option value="">Blank canvas</option>
                  {templateOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {form.templateId
                  ? (() => {
                      const selected = templateOptions.find((option) => option.id === form.templateId);
                      return selected?.description ? (
                        <p className="mt-1 text-xs text-slate-500">{selected.description}</p>
                      ) : null;
                    })()
                  : null}
              </Field>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Budget" error={errors.budget}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.budget}
                  onChange={handleChange('budget')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="25000"
                />
              </Field>
              <Field label="Currency">
                <select
                  value={form.currency}
                  onChange={handleChange('currency')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Target go-live date">
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={handleChange('dueDate')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kickoff link" error={errors.kickoffLink}>
                <input
                  type="url"
                  value={form.kickoffLink}
                  onChange={handleChange('kickoffLink')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="https://meet.gigvora.com/project-kickoff"
                />
              </Field>
              <Field label="Hero media" error={errors.mediaUrl}>
                <input
                  type="url"
                  value={form.mediaUrl}
                  onChange={handleChange('mediaUrl')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="https://drive.google.com/file/..."
                />
              </Field>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Saving...' : 'Create project'}
              </button>
            </div>
          </form>
        );
      case 'gig-order':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ActionWizard steps={ACTION_WIZARDS['gig-order']} />
            <StatusMessage status={status} />
            {projectOptions.length > 0 ? (
              <Field label="Link to project">
                <select
                  value={form.projectId}
                  onChange={handleChange('projectId')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  <option value="">Standalone order</option>
                  {projectOptions.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} · {project.status}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vendor / partner" error={errors.vendorName} required>
                <input
                  type="text"
                  value={form.vendorName}
                  onChange={handleChange('vendorName')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="Acme Studio"
                />
              </Field>
              <Field label="Service" error={errors.serviceName} required>
                <input
                  type="text"
                  value={form.serviceName}
                  onChange={handleChange('serviceName')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="Product design sprint"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Order value" error={errors.amount} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange('amount')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="9800"
                />
              </Field>
              <Field label="Currency">
                <select
                  value={form.currency}
                  onChange={handleChange('currency')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Delivery due">
                <input
                  type="date"
                  value={form.dueAt}
                  onChange={handleChange('dueAt')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                />
              </Field>
            </div>
            <Field label="Delivery brief">
              <textarea
                value={form.notes}
                onChange={handleChange('notes')}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="Outline deliverables, brand guardrails, or approval notes."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brief URL" error={errors.briefUrl}>
                <input
                  type="url"
                  value={form.briefUrl}
                  onChange={handleChange('briefUrl')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="https://docs.gigvora.com/brief"
                />
              </Field>
              <Field label="Attachment URL" error={errors.attachmentUrl}>
                <input
                  type="url"
                  value={form.attachmentUrl}
                  onChange={handleChange('attachmentUrl')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="https://drive.google.com/file/..."
                />
              </Field>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Publishing...' : 'Issue order'}
              </button>
            </div>
          </form>
        );
      case 'escrow':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ActionWizard steps={ACTION_WIZARDS.escrow} />
            <StatusMessage status={status} />
            {escrowOptions.length > 0 ? (
              <Field label="Escrow account">
                <select
                  value={form.escrowAccountId}
                  onChange={handleChange('escrowAccountId')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  <option value="">Select account</option>
                  {escrowOptions.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currency}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Linked gig order" error={errors.orderId} required>
              <input
                type="text"
                value={form.orderId}
                onChange={handleChange('orderId')}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="ORDER-12345"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Amount" error={errors.amount} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange('amount')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="15000"
                />
              </Field>
              <Field label="Currency">
                <select
                  value={form.currency}
                  onChange={handleChange('currency')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Release on">
                <input
                  type="date"
                  value={form.releaseAfter}
                  onChange={handleChange('releaseAfter')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                />
              </Field>
            </div>
            <Field label="Memorandum">
              <textarea
                value={form.memo}
                onChange={handleChange('memo')}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="Describe what needs to be delivered for release."
              />
            </Field>
            <Field label="Release strategy" error={errors.autoRelease}>
              <select
                value={form.autoRelease}
                onChange={handleChange('autoRelease')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
              >
                <option value="manual">Manual approval</option>
                <option value="date">Auto-release on date</option>
                <option value="milestone">Auto-release on milestone</option>
              </select>
            </Field>
            <Field label="Notify (emails)" error={errors.notificationEmails}>
              <input
                type="text"
                value={form.notificationEmails}
                onChange={handleChange('notificationEmails')}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="ops@gigvora.com, finance@gigvora.com"
              />
              <p className="mt-1 text-xs text-slate-500">Comma separated — each contact receives confirmation.</p>
            </Field>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Securing...' : 'Fund milestone'}
              </button>
            </div>
          </form>
        );
      case 'wallet':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ActionWizard steps={ACTION_WIZARDS.wallet} />
            <StatusMessage status={status} />
            <Field label="Wallet account" error={errors.walletAccountId} required>
              <input
                type="text"
                list="wallet-account-options"
                value={form.walletAccountId}
                onChange={handleChange('walletAccountId')}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="WALLET-OPS-01"
              />
              {walletOptions.length > 0 ? (
                <datalist id="wallet-account-options">
                  {walletOptions.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.label} · {formatCurrency(wallet.balance, wallet.currency)}
                    </option>
                  ))}
                </datalist>
              ) : null}
            </Field>
            <Field label="Funding source">
              <input
                type="text"
                list="funding-source-options"
                value={form.fundingSourceId}
                onChange={handleChange('fundingSourceId')}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="Primary corporate card"
              />
              {fundingOptions.length > 0 ? (
                <datalist id="funding-source-options">
                  {fundingOptions.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.label}
                    </option>
                  ))}
                </datalist>
              ) : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Transfer amount" error={errors.amount} required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange('amount')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="4500"
                />
              </Field>
              <Field label="Transfer type">
                <select
                  value={form.transferType}
                  onChange={handleChange('transferType')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  {TRANSFER_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Schedule on">
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={handleChange('scheduledAt')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Destination / recipient" error={errors.destination}>
                <input
                  type="text"
                  value={form.destination}
                  onChange={handleChange('destination')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="Growth wallet · vendor payout"
                />
              </Field>
              <Field label="Reference code" error={errors.referenceCode}>
                <input
                  type="text"
                  value={form.referenceCode}
                  onChange={handleChange('referenceCode')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="FIN-2024-APR-OPS"
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={handleChange('notes')}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="Add audit memo or internal approvals."
              />
            </Field>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Scheduling...' : 'Submit transfer'}
              </button>
            </div>
          </form>
        );
      case 'mentoring':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ActionWizard steps={ACTION_WIZARDS.mentoring} />
            <StatusMessage status={status} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mentor" error={errors.mentorId} required>
                <input
                  type="text"
                  list="mentor-options"
                  value={form.mentorId}
                  onChange={handleChange('mentorId')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="mentor_jordan_wells"
                />
                {mentorOptions.length > 0 ? (
                  <datalist id="mentor-options">
                    {mentorOptions.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.name}
                        {mentor.headline ? ` — ${mentor.headline}` : ''}
                      </option>
                    ))}
                  </datalist>
                ) : null}
              </Field>
              <Field label="Session focus" error={errors.topic} required>
                <input
                  type="text"
                  value={form.topic}
                  onChange={handleChange('topic')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="Pitch deck review"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Scheduled for">
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={handleChange('scheduledAt')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                />
              </Field>
              <Field label="Duration (minutes)" error={errors.durationMinutes}>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={form.durationMinutes}
                  onChange={handleChange('durationMinutes')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Meeting link" error={errors.meetingUrl}>
                <input
                  type="url"
                  value={form.meetingUrl}
                  onChange={handleChange('meetingUrl')}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                  placeholder="https://meet.gigvora.com/mentor-session"
                />
              </Field>
              <Field label="Recording consent" error={errors.recordingConsent}>
                <select
                  value={form.recordingConsent}
                  onChange={handleChange('recordingConsent')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  <option value="allow">Recording allowed</option>
                  <option value="deny">No recording</option>
                </select>
              </Field>
            </div>
            <Field label="Prep video" error={errors.preSessionVideoUrl}>
              <input
                type="url"
                value={form.preSessionVideoUrl}
                onChange={handleChange('preSessionVideoUrl')}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="https://loom.com/share/prep"
              />
            </Field>
            <Field label="Prep notes">
              <textarea
                value={form.notes}
                onChange={handleChange('notes')}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                placeholder="Share agenda, links, or documents to review."
              />
            </Field>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Booking...' : 'Book mentor'}
              </button>
            </div>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className={clsx('space-y-8', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Command actions</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Deploy workflows in seconds</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Launch projects, secure payments, automate treasury, and organise mentoring without leaving the dashboard. Every
            action triggers the underlying CRUD workflows and updates the live data views instantly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-lg md:flex">
            <span className="text-lg font-semibold">UX</span>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
            Live production
          </div>
        </div>
      </div>

      {quickStats.length ? (
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => (
            <MetricCard key={stat.id} label={stat.label} value={stat.value} hint={stat.hint} />
          ))}
        </dl>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ACTIONS.map((action) => (
          <article
            key={action.id}
            className={clsx(
              'group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg',
              action.accent,
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                  <action.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
                  <p className="text-sm text-slate-600">{action.description}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => openAction(action.id)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700"
              >
                Launch workflow
              </button>
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">CRUD</span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-200 bg-slate-900/90 px-5 py-4 text-white">
            <h3 className="text-base font-semibold">Mentor spotlight</h3>
            <p className="mt-1 text-sm text-slate-200">Clip your prep playback for upcoming engagements.</p>
          </div>
          <div className="relative aspect-video w-full bg-slate-900">
            <video
              className="h-full w-full object-cover"
              controls
              preload="metadata"
              poster="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
            >
              <source src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Operational guardrails</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Every workflow above persists through the API, refreshes the cache, and updates the dashboard sections below.
                  Audit events, notifications, and status feeds trigger automatically.
                </p>
              </div>
              <div className="rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                {formatNumber(mentorsUpcoming)} mentor {mentorsUpcoming === 1 ? 'session' : 'sessions'} in queue
              </div>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Escrow sync</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">Under 5s</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Gig provisioning</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">Real-time</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Finance analytics</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">Continuous</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mentor coverage</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">24 countries</dd>
              </div>
            </dl>
          </div>
          <ActivityList items={resolvedActivity} mentorsUpcoming={mentorsUpcoming} />
        </div>
      </div>

      <Modal
        open={Boolean(activeAction && modalConfig)}
        onClose={closeModal}
        title={modalConfig?.title}
        description={modalConfig?.description}
        wide
      >
        {renderForm()}
      </Modal>
    </div>
  );
}

UserDashboardQuickActions.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onActionComplete: PropTypes.func,
  className: PropTypes.string,
  context: PropTypes.shape({
    projects: PropTypes.array,
    projectTemplates: PropTypes.array,
    walletAccounts: PropTypes.array,
    fundingSources: PropTypes.array,
    mentors: PropTypes.array,
    escrowAccounts: PropTypes.array,
    activityFeed: PropTypes.array,
    metrics: PropTypes.shape({
      activeProjects: PropTypes.number,
      openGigOrders: PropTypes.number,
      escrowHeld: PropTypes.number,
      walletBalance: PropTypes.number,
      mentorsUpcoming: PropTypes.number,
      currency: PropTypes.string,
    }),
  }),
};

UserDashboardQuickActions.defaultProps = {
  onActionComplete: undefined,
  className: '',
  context: null,
};
