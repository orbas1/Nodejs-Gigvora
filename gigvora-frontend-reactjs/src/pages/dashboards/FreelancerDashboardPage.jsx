import { useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import {
  fetchFreelancerClientSuccessOverview,
  createClientSuccessPlaybook,
  enrollClientSuccessPlaybook,
  createClientSuccessReferral,
  createClientSuccessAffiliateLink,
} from '../../services/clientSuccessAutomation.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const DEFAULT_FREELANCER_ID = 1;
const availableDashboards = ['user', 'freelancer', 'agency', 'company', 'headhunter'];

const PLAYBOOK_TRIGGER_OPTIONS = [
  { value: 'gig_purchase', label: 'Gig purchase' },
  { value: 'kickoff_complete', label: 'Kickoff complete' },
  { value: 'milestone_reached', label: 'Milestone reached' },
  { value: 'delivery_submitted', label: 'Delivery submitted' },
  { value: 'delivery_accepted', label: 'Delivery accepted' },
  { value: 'renewal_window', label: 'Renewal window' },
  { value: 'manual', label: 'Manual trigger' },
];

const STEP_TYPE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'checklist', label: 'Checklist task' },
  { value: 'testimonial_request', label: 'Testimonial request' },
  { value: 'referral_invite', label: 'Referral invite' },
  { value: 'review_nudge', label: 'Review nudge' },
  { value: 'reward', label: 'Reward fulfillment' },
  { value: 'webhook', label: 'Webhook call' },
];

const STEP_CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'in_app', label: 'In-app message' },
  { value: 'sms', label: 'SMS' },
  { value: 'task', label: 'Task assignment' },
  { value: 'webhook', label: 'Webhook' },
];

const REFERRAL_STATUS_OPTIONS = [
  { value: 'invited', label: 'Invited' },
  { value: 'clicked', label: 'Clicked' },
  { value: 'converted', label: 'Converted' },
  { value: 'rewarded', label: 'Rewarded' },
  { value: 'expired', label: 'Expired' },
];

const AFFILIATE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

function formatNumber(value) {
  if (value == null || Number.isNaN(value)) {
    return '0';
  }
  const formatter = new Intl.NumberFormat('en-GB');
  return formatter.format(Number(value));
}

function formatPercentage(value, { fractionDigits = 1 } = {}) {
  if (value == null || Number.isNaN(value)) {
    return '0%';
  }
  const percentage = Number(value) * 100;
  return `${percentage.toFixed(fractionDigits)}%`;
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(amount)) {
    return `${currency} 0.00`;
  }
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  try {
    return formatter.format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

function summarizeAffiliateRevenue(affiliateRevenue) {
  if (!Array.isArray(affiliateRevenue) || affiliateRevenue.length === 0) {
    return 'USD 0.00';
  }
  return affiliateRevenue
    .map((entry) => formatCurrency(entry.amount, entry.currency || 'USD'))
    .join(' · ');
}

function extractErrorMessage(error) {
  if (!error) {
    return 'Something went wrong.';
  }
  if (error.body?.message) {
    return error.body.message;
  }
  if (Array.isArray(error.body?.errors)) {
    return error.body.errors.join(', ');
  }
  return error.message || String(error);
}

function createDefaultStep() {
  return {
    localId: `step-${Math.random().toString(36).slice(2)}`,
    name: '',
    stepType: 'email',
    channel: 'email',
    offsetHours: 0,
    waitForCompletion: false,
    templateSubject: '',
    templateBody: '',
  };
}

function createDefaultPlaybookForm() {
  return {
    name: '',
    triggerType: 'gig_purchase',
    description: '',
    tagsText: '',
    isActive: true,
    steps: [createDefaultStep()],
  };
}

function createDefaultEnrollmentForm() {
  return {
    playbookId: '',
    clientId: '',
    gigId: '',
    startAt: '',
    notes: '',
    referralCode: '',
  };
}

function createDefaultReferralForm() {
  return {
    gigId: '',
    referrerId: '',
    referredEmail: '',
    referralCode: '',
    status: 'invited',
    rewardValue: '',
    rewardCurrency: 'USD',
    notes: '',
  };
}

function createDefaultAffiliateForm() {
  return {
    gigId: '',
    label: '',
    destinationUrl: '',
    commissionRate: '',
    status: 'active',
    code: '',
    notes: '',
  };
}

function normalizeInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function renderStepSummary(step) {
  return `${step.name} · ${step.stepType.replace(/_/g, ' ')} via ${step.channel}`;
}

export default function FreelancerDashboardPage() {
  const freelancerId = DEFAULT_FREELANCER_ID;
  const [activeMenuItem, setActiveMenuItem] = useState('overview');
  const [playbookForm, setPlaybookForm] = useState(() => createDefaultPlaybookForm());
  const [playbookSubmitting, setPlaybookSubmitting] = useState(false);
  const [playbookFeedback, setPlaybookFeedback] = useState({ error: null, success: null });

  const [enrollmentForm, setEnrollmentForm] = useState(() => createDefaultEnrollmentForm());
  const [enrollmentSubmitting, setEnrollmentSubmitting] = useState(false);
  const [enrollmentFeedback, setEnrollmentFeedback] = useState({ error: null, success: null });

  const [referralForm, setReferralForm] = useState(() => createDefaultReferralForm());
  const [referralSubmitting, setReferralSubmitting] = useState(false);
  const [referralFeedback, setReferralFeedback] = useState({ error: null, success: null });

  const [affiliateForm, setAffiliateForm] = useState(() => createDefaultAffiliateForm());
  const [affiliateSubmitting, setAffiliateSubmitting] = useState(false);
  const [affiliateFeedback, setAffiliateFeedback] = useState({ error: null, success: null });

  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
  } = useCachedResource(
    `dashboard:freelancer:${freelancerId}:client-success`,
    ({ signal }) => fetchFreelancerClientSuccessOverview(freelancerId, { signal }),
    { ttl: 1000 * 45 },
  );

  const summary = data?.summary ?? {
    activePlaybooks: 0,
    totalSteps: 0,
    clientsEnrolled: 0,
    activeEnrollments: 0,
    referralConversionRate: 0,
    reviewResponseRate: 0,
    affiliateRevenue: [],
    automationEventsCompleted: 0,
  };

  const playbooks = useMemo(() => (Array.isArray(data?.playbooks) ? data.playbooks : []), [data]);
  const upcomingEvents = useMemo(() => (Array.isArray(data?.upcomingEvents) ? data.upcomingEvents : []), [data]);
  const reviewNudges = useMemo(() => (Array.isArray(data?.reviewNudges) ? data.reviewNudges : []), [data]);
  const affiliateLinks = useMemo(() => (Array.isArray(data?.affiliateLinks) ? data.affiliateLinks : []), [data]);
  const referrals = data?.referrals ?? {
    totals: { total: 0, converted: 0, rewarded: 0, pendingRewards: 0, conversionRate: 0 },
    byGig: [],
    recent: [],
  };

  const menuSections = useMemo(() => {
    const activeJourneys = formatNumber(summary.activeEnrollments);
    const activePlaybooks = formatNumber(summary.activePlaybooks);
    return [
      {
        label: 'Client success automation',
        items: [
          {
            id: 'overview',
            name: 'Automation cockpit',
            description: `Monitor ${activePlaybooks} playbooks with ${activeJourneys} live journeys and response KPIs.`,
            tags: ['analytics', 'events'],
          },
          {
            id: 'playbooks',
            name: 'Lifecycle playbooks',
            description: 'Design onboarding, education, testimonial, and referral sequences.',
            tags: ['journeys', 'templates'],
          },
          {
            id: 'reviews',
            name: 'Review nudges',
            description: 'Schedule smart review prompts tied to deliveries and milestones.',
            tags: ['csat', 'automation'],
          },
          {
            id: 'referrals',
            name: 'Referral engine',
            description: 'Track referral performance and reward advocates in one place.',
            tags: ['advocacy', 'revenue'],
          },
          {
            id: 'affiliates',
            name: 'Affiliate hub',
            description: 'Manage affiliate links, commission rules, and performance.',
            tags: ['growth'],
          },
        ],
      },
      {
        label: 'Operations',
        items: [
          {
            id: 'coaching',
            name: 'Success coaching tips',
            description: 'Playbooks, rituals, and templates to run proactive client success.',
            tags: ['playbooks'],
          },
        ],
      },
    ];
  }, [summary.activeEnrollments, summary.activePlaybooks]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Active playbooks',
        value: formatNumber(summary.activePlaybooks),
        description: 'Automation sequences currently available to enroll clients.',
      },
      {
        label: 'Total automation steps',
        value: formatNumber(summary.totalSteps),
        description: 'Individual touchpoints across all lifecycle journeys.',
      },
      {
        label: 'Clients onboarded',
        value: formatNumber(summary.clientsEnrolled),
        description: 'Unique clients with recorded lifecycle experiences.',
      },
      {
        label: 'Live enrollments',
        value: formatNumber(summary.activeEnrollments),
        description: 'Journeys currently running or awaiting actions.',
      },
      {
        label: 'Referral conversion',
        value: formatPercentage(summary.referralConversionRate),
        description: 'Percentage of referrals that converted or earned rewards.',
      },
      {
        label: 'Review response rate',
        value: formatPercentage(summary.reviewResponseRate),
        description: 'Clients responding to review nudges across gigs.',
      },
      {
        label: 'Affiliate revenue',
        value: summarizeAffiliateRevenue(summary.affiliateRevenue),
        description: 'Tracked revenue from affiliate links and advocates.',
      },
      {
        label: 'Automation events completed',
        value: formatNumber(summary.automationEventsCompleted),
        description: 'Touchpoints executed successfully across all journeys.',
      },
    ],
    [summary],
  );

  const profileCard = useMemo(
    () => ({
      name: 'Freelancer success automation',
      role: 'Lifecycle & advocacy engine',
      initials: 'CS',
      status: `${formatNumber(summary.activePlaybooks)} playbooks · ${formatNumber(summary.activeEnrollments)} live journeys`,
      badges: [
        summary.reviewResponseRate ? `${formatPercentage(summary.reviewResponseRate)} review responses` : null,
        summary.referralConversionRate ? `${formatPercentage(summary.referralConversionRate)} referral conversion` : null,
      ].filter(Boolean),
      metrics: [
        { label: 'Clients onboarded', value: formatNumber(summary.clientsEnrolled) },
        { label: 'Referrals', value: formatNumber(referrals?.totals?.total ?? 0) },
        { label: 'Affiliate links', value: formatNumber(affiliateLinks.length) },
      ],
    }),
    [affiliateLinks.length, referrals?.totals?.total, summary],
  );

  const heroTitle = 'Freelancer client success command center';
  const heroSubtitle = 'Automation, advocacy, and retention dashboard';
  const heroDescription =
    'Activate onboarding journeys, review campaigns, referral programs, and affiliate revenue streams from a single control plane.';

  const handlePlaybookFieldChange = (field, value) => {
    setPlaybookForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (localId, field, value) => {
    setPlaybookForm((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.localId === localId
          ? {
              ...step,
              [field]:
                field === 'offsetHours'
                  ? value === ''
                    ? ''
                    : Number(value)
                  : field === 'waitForCompletion'
                  ? Boolean(value)
                  : value,
            }
          : step,
      ),
    }));
  };

  const handleAddStep = () => {
    setPlaybookForm((prev) => ({
      ...prev,
      steps: [...prev.steps, createDefaultStep()],
    }));
  };

  const handleRemoveStep = (localId) => {
    setPlaybookForm((prev) => ({
      ...prev,
      steps: prev.steps.length > 1 ? prev.steps.filter((step) => step.localId !== localId) : prev.steps,
    }));
  };
  const handlePlaybookSubmit = async (event) => {
    event.preventDefault();
    setPlaybookSubmitting(true);
    setPlaybookFeedback({ error: null, success: null });
    try {
      const tags = playbookForm.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      await createClientSuccessPlaybook(freelancerId, {
        name: playbookForm.name,
        triggerType: playbookForm.triggerType,
        description: playbookForm.description,
        isActive: playbookForm.isActive,
        tags,
        steps: playbookForm.steps.map(({ localId, offsetHours, ...rest }, index) => ({
          ...rest,
          orderIndex: index,
          offsetHours: Number(offsetHours) || 0,
        })),
      });
      setPlaybookFeedback({ error: null, success: 'Playbook created successfully.' });
      setPlaybookForm(createDefaultPlaybookForm());
      await refresh({ force: true });
    } catch (err) {
      setPlaybookFeedback({ error: extractErrorMessage(err), success: null });
    } finally {
      setPlaybookSubmitting(false);
    }
  };

  const handleEnrollmentSubmit = async (event) => {
    event.preventDefault();
    setEnrollmentSubmitting(true);
    setEnrollmentFeedback({ error: null, success: null });
    try {
      const playbookId = normalizeInteger(enrollmentForm.playbookId);
      if (!playbookId) {
        throw new Error('Select a playbook to enroll.');
      }
      const payload = {
        clientId: normalizeInteger(enrollmentForm.clientId),
        gigId: normalizeInteger(enrollmentForm.gigId),
        metadata: enrollmentForm.notes ? { notes: enrollmentForm.notes } : undefined,
        startAt: enrollmentForm.startAt ? new Date(enrollmentForm.startAt).toISOString() : undefined,
        referralCode: enrollmentForm.referralCode || undefined,
      };
      await enrollClientSuccessPlaybook(freelancerId, playbookId, payload);
      setEnrollmentFeedback({ error: null, success: 'Client enrolled and events scheduled.' });
      setEnrollmentForm(createDefaultEnrollmentForm());
      await refresh({ force: true });
    } catch (err) {
      setEnrollmentFeedback({ error: extractErrorMessage(err), success: null });
    } finally {
      setEnrollmentSubmitting(false);
    }
  };

  const handleReferralSubmit = async (event) => {
    event.preventDefault();
    setReferralSubmitting(true);
    setReferralFeedback({ error: null, success: null });
    try {
      const payload = {
        gigId: normalizeInteger(referralForm.gigId),
        referrerId: normalizeInteger(referralForm.referrerId),
        referredEmail: referralForm.referredEmail || undefined,
        referralCode: referralForm.referralCode || undefined,
        status: referralForm.status,
        rewardValue: referralForm.rewardValue ? Number(referralForm.rewardValue) : undefined,
        rewardCurrency: referralForm.rewardCurrency || undefined,
        metadata: referralForm.notes ? { notes: referralForm.notes } : undefined,
      };
      if (payload.gigId == null) {
        throw new Error('Gig ID is required.');
      }
      await createClientSuccessReferral(freelancerId, payload.gigId, payload);
      setReferralFeedback({ error: null, success: 'Referral recorded.' });
      setReferralForm(createDefaultReferralForm());
      await refresh({ force: true });
    } catch (err) {
      setReferralFeedback({ error: extractErrorMessage(err), success: null });
    } finally {
      setReferralSubmitting(false);
    }
  };

  const handleAffiliateSubmit = async (event) => {
    event.preventDefault();
    setAffiliateSubmitting(true);
    setAffiliateFeedback({ error: null, success: null });
    try {
      const payload = {
        gigId: normalizeInteger(affiliateForm.gigId),
        label: affiliateForm.label || undefined,
        destinationUrl: affiliateForm.destinationUrl || undefined,
        commissionRate: affiliateForm.commissionRate ? Number(affiliateForm.commissionRate) : undefined,
        status: affiliateForm.status,
        code: affiliateForm.code || undefined,
        metadata: affiliateForm.notes ? { notes: affiliateForm.notes } : undefined,
      };
      if (payload.gigId == null) {
        throw new Error('Gig ID is required.');
      }
      await createClientSuccessAffiliateLink(freelancerId, payload.gigId, payload);
      setAffiliateFeedback({ error: null, success: 'Affiliate link created.' });
      setAffiliateForm(createDefaultAffiliateForm());
      await refresh({ force: true });
    } catch (err) {
      setAffiliateFeedback({ error: extractErrorMessage(err), success: null });
    } finally {
      setAffiliateSubmitting(false);
    }
  };
  const renderOverviewPanel = () => (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Automation health summary</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Keep a pulse on onboarding throughput, lifecycle engagement, review feedback, and referral performance across your Gigvora clients.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</dt>
                <dd className="mt-2 text-xl font-semibold text-slate-900">{card.value}</dd>
                <p className="mt-1 text-xs text-slate-500">{card.description}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Upcoming automation events</h3>
            <p className="mt-1 text-sm text-slate-600">
              Next touchpoints scheduled for active client journeys across onboarding, education, and advocacy tracks.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {formatNumber(upcomingEvents.length)} queued
          </span>
        </div>
        <div className="mt-6 overflow-x-auto">
          {upcomingEvents.length ? (
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Touchpoint</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Playbook</th>
                  <th className="px-4 py-2">Scheduled</th>
                  <th className="px-4 py-2">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {upcomingEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{event.step?.name ?? 'Automation step'}</div>
                      <div className="text-xs text-slate-500">{event.step?.stepType?.replace(/_/g, ' ') ?? 'event'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{event.client?.name || event.client?.email || 'Unassigned'}</div>
                      <div className="text-xs text-slate-500">{event.gig?.title || 'General journey'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{event.playbook?.name || 'Playbook'}</div>
                      <div className="text-xs text-slate-500">#{event.playbook?.id ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{formatAbsolute(event.scheduledAt)}</div>
                      <div className="text-xs text-slate-500">{formatRelativeTime(event.scheduledAt)}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{event.channel || 'auto'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">No automation events are queued. Enroll a client to generate schedules.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Referral funnel</h3>
            <p className="mt-1 text-sm text-slate-600">
              Track advocates bringing in new work, reward status, and conversion rates by gig.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Total referrals</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(referrals.totals?.total ?? 0)}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Conversion rate</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatPercentage(referrals.totals?.conversionRate)}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Rewards paid</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(referrals.totals?.rewarded ?? 0)}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Pending rewards</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{formatNumber(referrals.totals?.pendingRewards ?? 0)}</dd>
              </div>
            </dl>
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Top gigs</h4>
              {referrals.byGig?.length ? (
                <ul className="space-y-3">
                  {referrals.byGig.slice(0, 4).map((entry) => (
                    <li key={entry.gigId ?? entry.gigTitle} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{entry.gigTitle}</p>
                      <p className="text-xs text-slate-500">
                        {formatNumber(entry.referrals)} referrals · {formatPercentage(entry.conversionRate, { fractionDigits: 0 })} conversion
                      </p>
                      <p className="text-xs text-slate-400">
                        Rewards paid: {formatCurrency(entry.rewardsPaidValue, summary.affiliateRevenue?.[0]?.currency || 'USD')}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No referral data yet. Encourage advocates to share your gigs.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-900">Recent referrals</h3>
            <p className="mt-1 text-sm text-slate-600">
              Latest advocacy submissions, including advocate details and referral codes.
            </p>
            <div className="mt-4 space-y-3">
              {referrals.recent?.length ? (
                referrals.recent.slice(0, 6).map((referral) => (
                  <div key={referral.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{referral.gig?.title || 'Gig referral'}</p>
                        <p className="text-xs text-slate-500">Code: {referral.referralCode}</p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {referral.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Advocate: {referral.referrer?.name || referral.referrer?.email || 'Client'} · {formatAbsolute(referral.occurredAt)}
                    </p>
                    {referral.referredEmail ? (
                      <p className="text-xs text-slate-400">Introduced: {referral.referredEmail}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Referrals will appear here once advocates begin sharing your gigs.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
  const renderPlaybookPanel = () => (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Lifecycle playbooks</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Automate onboarding, education, testimonial requests, referral campaigns, and rewards with tailored sequences.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {formatNumber(playbooks.length)} playbooks
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {playbooks.length ? (
            playbooks.map((playbook) => (
              <div key={playbook.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{playbook.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Trigger: {playbook.triggerType.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    playbook.isActive
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-slate-200 bg-slate-100 text-slate-500'
                  }`}>
                    {playbook.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                {playbook.description ? (
                  <p className="mt-3 text-sm text-slate-600">{playbook.description}</p>
                ) : null}
                {playbook.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {playbook.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <dt className="uppercase tracking-wide">Enrollments</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{formatNumber(playbook.metrics?.totalEnrollments ?? 0)}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <dt className="uppercase tracking-wide">Completion rate</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">{formatPercentage(playbook.metrics?.completionRate)}</dd>
                  </div>
                </dl>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Steps</p>
                  {playbook.steps?.length ? (
                    playbook.steps.map((step) => (
                      <div key={step.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <p className="font-semibold text-slate-900">{renderStepSummary(step)}</p>
                        <p className="text-xs text-slate-500">
                          Offset: {step.offsetHours}h · {formatNumber(step.metrics?.completed ?? 0)} completed · {formatNumber(step.metrics?.failed ?? 0)} failed
                        </p>
                        {step.templateSubject ? (
                          <p className="mt-1 text-xs text-slate-500">Subject: {step.templateSubject}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p>No steps configured.</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No playbooks yet. Use the builder below to create your first onboarding or advocacy sequence.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-xl font-semibold text-slate-900">Create a new playbook</h3>
        <p className="mt-1 text-sm text-slate-600">
          Capture every client milestone with automated welcome messages, education drip content, testimonial prompts, and referral invites tailored to your gig.
        </p>

        <form onSubmit={handlePlaybookSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Playbook name</span>
              <input
                type="text"
                value={playbookForm.name}
                onChange={(event) => handlePlaybookFieldChange('name', event.target.value)}
                required
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Trigger</span>
              <select
                value={playbookForm.triggerType}
                onChange={(event) => handlePlaybookFieldChange('triggerType', event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {PLAYBOOK_TRIGGER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
              <span className="font-semibold text-slate-800">Description</span>
              <textarea
                value={playbookForm.description}
                onChange={(event) => handlePlaybookFieldChange('description', event.target.value)}
                rows={3}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={playbookForm.isActive}
                onChange={(event) => handlePlaybookFieldChange('isActive', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-800">Activate immediately</span>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Tags (comma separated)</span>
              <input
                type="text"
                value={playbookForm.tagsText}
                onChange={(event) => handlePlaybookFieldChange('tagsText', event.target.value)}
                placeholder="onboarding, advocacy"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Automation steps</h4>
              <button
                type="button"
                onClick={handleAddStep}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              >
                Add step
              </button>
            </div>
            {playbookForm.steps.map((step, index) => (
              <div key={step.localId} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Step {index + 1}</p>
                  {playbookForm.steps.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(step.localId)}
                      className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Name</span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(event) => handleStepChange(step.localId, 'name', event.target.value)}
                      required
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Step type</span>
                    <select
                      value={step.stepType}
                      onChange={(event) => handleStepChange(step.localId, 'stepType', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {STEP_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Channel</span>
                    <select
                      value={step.channel}
                      onChange={(event) => handleStepChange(step.localId, 'channel', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {STEP_CHANNEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Delay (hours)</span>
                    <input
                      type="number"
                      value={step.offsetHours}
                      onChange={(event) => handleStepChange(step.localId, 'offsetHours', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-600 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={step.waitForCompletion}
                      onChange={(event) => handleStepChange(step.localId, 'waitForCompletion', event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">Wait for completion before moving on</span>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
                    <span className="font-semibold text-slate-800">Template subject</span>
                    <input
                      type="text"
                      value={step.templateSubject}
                      onChange={(event) => handleStepChange(step.localId, 'templateSubject', event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
                    <span className="font-semibold text-slate-800">Template body</span>
                    <textarea
                      value={step.templateBody}
                      onChange={(event) => handleStepChange(step.localId, 'templateBody', event.target.value)}
                      rows={3}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {playbookFeedback.error ? (
            <p className="text-sm text-red-600">{playbookFeedback.error}</p>
          ) : null}
          {playbookFeedback.success ? (
            <p className="text-sm text-emerald-600">{playbookFeedback.success}</p>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setPlaybookForm(createDefaultPlaybookForm())}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={playbookSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {playbookSubmitting ? 'Saving…' : 'Save playbook'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-xl font-semibold text-slate-900">Enroll a client</h3>
        <p className="mt-1 text-sm text-slate-600">
          Launch a journey for a client to trigger scheduled emails, nudges, and referral invitations automatically.
        </p>

        <form onSubmit={handleEnrollmentSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Playbook</span>
            <select
              value={enrollmentForm.playbookId}
              onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, playbookId: event.target.value }))}
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select a playbook</option>
              {playbooks.map((playbook) => (
                <option key={playbook.id} value={playbook.id}>
                  {playbook.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Client ID (optional)</span>
            <input
              type="number"
              value={enrollmentForm.clientId}
              onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, clientId: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Existing client ID"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Gig ID (optional)</span>
            <input
              type="number"
              value={enrollmentForm.gigId}
              onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, gigId: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Gig linked to this journey"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Start at</span>
            <input
              type="datetime-local"
              value={enrollmentForm.startAt}
              onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, startAt: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
            <span className="font-semibold text-slate-800">Notes</span>
            <textarea
              value={enrollmentForm.notes}
              onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Internal context to store in metadata"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
            <span className="font-semibold text-slate-800">Referral code (optional)</span>
            <input
              type="text"
              value={enrollmentForm.referralCode}
              onChange={(event) => setEnrollmentForm((prev) => ({ ...prev, referralCode: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          {enrollmentFeedback.error ? (
            <p className="sm:col-span-2 text-sm text-red-600">{enrollmentFeedback.error}</p>
          ) : null}
          {enrollmentFeedback.success ? (
            <p className="sm:col-span-2 text-sm text-emerald-600">{enrollmentFeedback.success}</p>
          ) : null}
          <div className="sm:col-span-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEnrollmentForm(createDefaultEnrollmentForm())}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={enrollmentSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enrollmentSubmitting ? 'Enrolling…' : 'Enroll client'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
  const renderReviewsPanel = () => (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Review nudges</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Automate post-delivery review requests with smart timing, channel routing, and follow-ups tied to client milestones.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {formatNumber(reviewNudges.length)} records
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          {reviewNudges.length ? (
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Gig</th>
                  <th className="px-4 py-2">Channel</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Scheduled</th>
                  <th className="px-4 py-2">Responded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {reviewNudges.map((nudge) => (
                  <tr key={nudge.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{nudge.client?.name || nudge.client?.email || 'Client'}</div>
                      <div className="text-xs text-slate-500">#{nudge.clientId ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{nudge.gig?.title || 'Gig order'}</div>
                      <div className="text-xs text-slate-500">{nudge.metadata?.playbookId ? `Playbook #${nudge.metadata.playbookId}` : 'Manual trigger'}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{nudge.channel || 'email'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {nudge.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{nudge.scheduledAt ? formatAbsolute(nudge.scheduledAt) : '—'}</div>
                      <div className="text-xs text-slate-500">{nudge.scheduledAt ? formatRelativeTime(nudge.scheduledAt) : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{nudge.responseAt ? formatAbsolute(nudge.responseAt) : 'Pending'}</div>
                      <div className="text-xs text-slate-500">{nudge.responseAt ? formatRelativeTime(nudge.responseAt) : ''}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">No review nudges have been scheduled yet. Enroll a playbook with review steps.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm sm:p-8">
        <h3 className="text-xl font-semibold text-blue-900">Best practices for collecting social proof</h3>
        <ul className="mt-4 space-y-3 text-sm text-blue-800">
          <li className="flex gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
            <span>Layer a warm in-app thank-you followed by an email or SMS reminder 24 hours after delivery acceptance.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
            <span>Include preview snippets of their project impact or stats to make reviews more compelling.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
            <span>Automatically share approved reviews to your Gigvora profile, landing pages, and email signature.</span>
          </li>
        </ul>
      </section>
    </div>
  );
  const renderReferralsPanel = () => (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Referral engine</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Monitor every advocate-led introduction, reward status, and conversion outcome to grow repeat revenue.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {formatNumber(referrals.totals?.total ?? 0)} referrals
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Converted</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(referrals.totals?.converted ?? 0)}</dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Rewarded</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(referrals.totals?.rewarded ?? 0)}</dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Pending rewards</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(referrals.totals?.pendingRewards ?? 0)}</dd>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Conversion rate</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{formatPercentage(referrals.totals?.conversionRate)}</dd>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-xl font-semibold text-slate-900">Log a referral</h3>
        <p className="mt-1 text-sm text-slate-600">
          Capture referrals from clients or partners, track their reward status, and trigger follow-up automations.
        </p>

        <form onSubmit={handleReferralSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Gig ID</span>
            <input
              type="number"
              value={referralForm.gigId}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, gigId: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Referrer client ID (optional)</span>
            <input
              type="number"
              value={referralForm.referrerId}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, referrerId: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Referred email</span>
            <input
              type="email"
              value={referralForm.referredEmail}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, referredEmail: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="prospect@company.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Referral status</span>
            <select
              value={referralForm.status}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {REFERRAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Reward value</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={referralForm.rewardValue}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, rewardValue: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. 50"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Reward currency</span>
            <input
              type="text"
              value={referralForm.rewardCurrency}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, rewardCurrency: event.target.value.toUpperCase() }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="USD"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Referral code (optional)</span>
            <input
              type="text"
              value={referralForm.referralCode}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, referralCode: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
            <span className="font-semibold text-slate-800">Notes</span>
            <textarea
              value={referralForm.notes}
              onChange={(event) => setReferralForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Details about the referral reward or relationship context"
            />
          </label>
          {referralFeedback.error ? (
            <p className="sm:col-span-2 text-sm text-red-600">{referralFeedback.error}</p>
          ) : null}
          {referralFeedback.success ? (
            <p className="sm:col-span-2 text-sm text-emerald-600">{referralFeedback.success}</p>
          ) : null}
          <div className="sm:col-span-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setReferralForm(createDefaultReferralForm())}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={referralSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {referralSubmitting ? 'Logging…' : 'Log referral'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
  const renderAffiliatesPanel = () => (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Affiliate hub</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage affiliate links, track clicks and conversions, and automate partner rewards tied to your gigs.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {formatNumber(affiliateLinks.length)} links
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          {affiliateLinks.length ? (
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Label</th>
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Gig</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Commission</th>
                  <th className="px-4 py-2">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {affiliateLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{link.label || 'Affiliate link'}</div>
                      <div className="text-xs text-slate-500">Updated {formatRelativeTime(link.updatedAt)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{link.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{link.gig?.title || 'Global link'}</div>
                      <div className="text-xs text-slate-500">Gig #{link.gigId ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        link.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {link.commissionRate != null ? `${Number(link.commissionRate).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{formatNumber(link.totalClicks)} clicks</p>
                      <p className="text-xs text-slate-500">{formatNumber(link.totalConversions)} conversions</p>
                      <p className="text-xs text-slate-400">{formatCurrency(link.totalRevenue, link.revenueCurrency || 'USD')} revenue</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">No affiliate links yet. Use the form below to create a trackable link for your gigs.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-xl font-semibold text-slate-900">Create affiliate link</h3>
        <p className="mt-1 text-sm text-slate-600">
          Issue a new affiliate link for a gig, define commission rules, and share it with trusted partners.
        </p>

        <form onSubmit={handleAffiliateSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Gig ID</span>
            <input
              type="number"
              value={affiliateForm.gigId}
              onChange={(event) => setAffiliateForm((prev) => ({ ...prev, gigId: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Label</span>
            <input
              type="text"
              value={affiliateForm.label}
              onChange={(event) => setAffiliateForm((prev) => ({ ...prev, label: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. Newsletter partners"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
            <span className="font-semibold text-slate-800">Destination URL</span>
            <input
              type="url"
              value={affiliateForm.destinationUrl}
              onChange={(event) => setAffiliateForm((prev) => ({ ...prev, destinationUrl: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="https://"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Commission rate (%)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={affiliateForm.commissionRate}
              onChange={(event) => setAffiliateForm((prev) => ({ ...prev, commissionRate: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Status</span>
            <select
              value={affiliateForm.status}
              onChange={(event) => setAffiliateForm((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {AFFILIATE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Custom code (optional)</span>
            <input
              type="text"
              value={affiliateForm.code}
              onChange={(event) => setAffiliateForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="e.g. PARTNER20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 sm:col-span-2">
            <span className="font-semibold text-slate-800">Notes</span>
            <textarea
              value={affiliateForm.notes}
              onChange={(event) => setAffiliateForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Partner eligibility, incentives, or redemption instructions"
            />
          </label>
          {affiliateFeedback.error ? (
            <p className="sm:col-span-2 text-sm text-red-600">{affiliateFeedback.error}</p>
          ) : null}
          {affiliateFeedback.success ? (
            <p className="sm:col-span-2 text-sm text-emerald-600">{affiliateFeedback.success}</p>
          ) : null}
          <div className="sm:col-span-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setAffiliateForm(createDefaultAffiliateForm())}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={affiliateSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-blue-500 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {affiliateSubmitting ? 'Creating…' : 'Create link'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
  const renderCoachingPanel = () => (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Success coaching playbooks</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Embed proactive success rituals into your weekly workflow: predict churn risks, celebrate advocates, and keep clients engaged.
          </p>
        </div>
        <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700">
          Advisory
        </span>
      </div>
      <ul className="space-y-4 text-sm text-slate-600">
        <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-semibold text-slate-900">Weekly success review</h3>
          <p className="mt-1 text-sm text-slate-600">
            Every Friday, review active enrollments, upcoming automation events, and clients with stalled progress. Adjust playbook offsets or add manual check-ins.
          </p>
        </li>
        <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-semibold text-slate-900">Advocacy spotlight</h3>
          <p className="mt-1 text-sm text-slate-600">
            Celebrate advocates with a thank-you email, social shout-out, or credit once a referral converts. Rotate incentives monthly to keep programs fresh.
          </p>
        </li>
        <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-semibold text-slate-900">Voice of customer digest</h3>
          <p className="mt-1 text-sm text-slate-600">
            Compile review responses and testimonials into a quarterly digest for marketing, update your gig copy, and feed insights into new automation experiments.
          </p>
        </li>
      </ul>
    </section>
  );
  const renderActivePanel = () => {
    switch (activeMenuItem) {
      case 'playbooks':
        return renderPlaybookPanel();
      case 'reviews':
        return renderReviewsPanel();
      case 'referrals':
        return renderReferralsPanel();
      case 'affiliates':
        return renderAffiliatesPanel();
      case 'coaching':
        return renderCoachingPanel();
      case 'overview':
      default:
        return renderOverviewPanel();
    }
  };
  const fetchError = error ? extractErrorMessage(error) : null;

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title={heroTitle}
      subtitle={heroSubtitle}
      description={heroDescription}
      menuSections={menuSections}
      sections={[]}
      profile={profileCard}
      availableDashboards={availableDashboards}
      activeMenuItem={activeMenuItem}
      onMenuItemSelect={setActiveMenuItem}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataStatus
            loading={loading}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
          {fetchError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {fetchError}
            </div>
          ) : null}
        </div>
        {renderActivePanel()}
      </div>
    </DashboardLayout>
  );
}

