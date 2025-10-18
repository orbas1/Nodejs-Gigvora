import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheckIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import {
  approveTwoFactorEnrollment,
  createTwoFactorPolicy,
  deleteTwoFactorPolicy,
  fetchTwoFactorOverview,
  issueTwoFactorBypass,
  revokeTwoFactorEnrollment,
  updateTwoFactorBypass,
  updateTwoFactorPolicy,
} from '../../../services/adminTwoFactor.js';
import TwoFactorSummaryCards from '../../../components/admin/twofactor/TwoFactorSummaryCards.jsx';
import TwoFactorPolicyForm from '../../../components/admin/twofactor/TwoFactorPolicyForm.jsx';
import TwoFactorBypassForm from '../../../components/admin/twofactor/TwoFactorBypassForm.jsx';
import { ADMIN_MENU_SECTIONS } from './menuSections.js';
import formatDateTime from '../../../utils/formatDateTime.js';
import { formatRelativeTime } from '../../../utils/date.js';

const FALLBACK_OVERVIEW = {
  summary: {
    adminCoverageRate: 0.92,
    overallCoverageRate: 0.78,
    pendingEnrollments: 3,
    activeBypasses: 1,
    enforcedPolicies: 2,
    activeChallenges: 18,
  },
  coverage: {
    adminCount: 42,
    adminCovered: 39,
    overallCount: 1840,
    overallCovered: 1435,
    byMethod: {
      email: 986,
      app: 512,
      sms: 118,
      security_key: 42,
      backup_codes: 0,
    },
    adminCoverageRate: 0.92,
    overallCoverageRate: 0.78,
  },
  policies: [
    {
      id: 'fallback-admin',
      name: 'Admin console hard lock',
      description: 'Mandatory MFA for all administrator accounts with enforcement on privileged actions.',
      enforcementLevel: 'required',
      appliesToRole: 'admin',
      allowedMethods: ['email', 'app', 'security_key'],
      fallbackCodes: 6,
      sessionDurationMinutes: 720,
      requireForSensitiveActions: true,
      enforced: true,
      ipAllowlist: ['203.0.113.0/25', '198.51.100.42'],
      createdAt: '2024-05-01T09:00:00Z',
      updatedAt: '2024-05-18T12:15:00Z',
      notes: 'SOC2 control SC-12 reviewed by compliance.',
    },
    {
      id: 'fallback-staff',
      name: 'Internal staff progressive rollout',
      description: 'Gradually enable MFA for internal teams with session expiry aligned to shift schedules.',
      enforcementLevel: 'recommended',
      appliesToRole: 'staff',
      allowedMethods: ['email', 'app'],
      fallbackCodes: 4,
      sessionDurationMinutes: 1440,
      requireForSensitiveActions: true,
      enforced: true,
      ipAllowlist: [],
      createdAt: '2024-04-12T08:00:00Z',
      updatedAt: '2024-05-16T16:45:00Z',
      notes: 'Rollout managed by identity operations.',
    },
  ],
  enrollments: {
    pending: [
      {
        id: 'fallback-enroll-1',
        userId: 1204,
        userEmail: 'sonia.chen@gigvora.com',
        userName: 'Sonia Chen',
        status: 'pending',
        method: 'security_key',
        label: 'YubiKey 5 NFC',
        createdAt: '2024-05-18T09:45:00Z',
        metadata: { region: 'NYC office', attestation: 'verified' },
      },
      {
        id: 'fallback-enroll-2',
        userId: 1581,
        userEmail: 'ops.l1@gigvora.com',
        userName: 'Ops L1 Rotation',
        status: 'pending',
        method: 'app',
        label: 'Okta Verify',
        createdAt: '2024-05-18T08:32:00Z',
        metadata: { shift: 'weekend' },
      },
    ],
    active: [
      {
        id: 'fallback-enroll-3',
        userId: 904,
        userEmail: 'marco.varela@gigvora.com',
        userName: 'Marco Varela',
        status: 'active',
        method: 'app',
        label: 'Authy',
        activatedAt: '2024-05-12T18:05:00Z',
        lastUsedAt: '2024-05-18T07:40:00Z',
      },
    ],
  },
  bypasses: {
    pending: [
      {
        id: 'fallback-bypass-1',
        userId: 2003,
        userEmail: 'finance.desk@gigvora.com',
        userName: 'Finance Desk',
        status: 'pending',
        reason: 'Laptop rebuild after disk failure',
        expiresAt: '2024-05-18T22:00:00Z',
        createdAt: '2024-05-18T09:10:00Z',
      },
    ],
    active: [
      {
        id: 'fallback-bypass-2',
        userId: 1760,
        userEmail: 'amy.singh@gigvora.com',
        userName: 'Amy Singh',
        status: 'approved',
        reason: 'Travel with limited device access',
        expiresAt: '2024-05-19T18:00:00Z',
        approvedAt: '2024-05-18T07:00:00Z',
        approvedBy: 12,
      },
    ],
  },
  auditLog: [
    {
      id: 'fallback-audit-1',
      action: 'policy.updated',
      targetType: 'TwoFactorPolicy',
      targetId: 'fallback-admin',
      actorName: 'Jordan Kim',
      actorEmail: 'jordan.kim@gigvora.com',
      createdAt: '2024-05-18T12:16:00Z',
      notes: 'Raised enforcement to include security keys after phishing drill.',
    },
    {
      id: 'fallback-audit-2',
      action: 'bypass.approved',
      targetType: 'TwoFactorBypass',
      targetId: 'fallback-bypass-2',
      actorName: 'Priya Patel',
      actorEmail: 'priya.patel@gigvora.com',
      createdAt: '2024-05-18T07:00:00Z',
      notes: 'Approved for 24h during travel. Ticket SEC-2041.',
    },
  ],
  refreshedAt: '2024-05-18T12:16:00Z',
  lookbackDays: 30,
  activeChallenges: 18,
  fallback: true,
};

function computeInitials(name, fallback = 'GV') {
  if (!name) return fallback;
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase());
  if (!letters.length) {
    return fallback;
  }
  return letters.slice(0, 2).join('').padEnd(2, fallback.charAt(0) || 'G');
}

function normaliseArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

function normalisePolicy(policy) {
  if (!policy) {
    return null;
  }
  const allowedMethods = normaliseArray(policy.allowedMethods).filter(Boolean);
  const ipAllowlist = normaliseArray(policy.ipAllowlist).filter(Boolean);
  const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return {
    id: policy.id ?? `policy-${randomId}`,
    name: policy.name ?? 'Two-factor policy',
    description: policy.description ?? '',
    enforcementLevel: policy.enforcementLevel ?? 'required',
    appliesToRole: policy.appliesToRole ?? 'admin',
    allowedMethods,
    fallbackCodes: Number(policy.fallbackCodes ?? 0),
    sessionDurationMinutes: Number(policy.sessionDurationMinutes ?? 0),
    requireForSensitiveActions: Boolean(policy.requireForSensitiveActions ?? false),
    enforced: policy.enforced !== false,
    ipAllowlist,
    notes: policy.notes ?? '',
    createdAt: policy.createdAt ?? null,
    updatedAt: policy.updatedAt ?? null,
  };
}

function normaliseEnrollment(enrollment) {
  if (!enrollment) {
    return null;
  }
  const user = enrollment.user ?? {};
  const resolvedUserName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email ||
    (enrollment.userId ? `User #${enrollment.userId}` : 'Workspace member');
  const userName = enrollment.userName ?? resolvedUserName;
  const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return {
    id: enrollment.id ?? `enrollment-${randomId}`,
    userId: enrollment.userId ?? user.id ?? null,
    userEmail: enrollment.userEmail ?? user.email ?? null,
    userName,
    method: enrollment.method ?? 'app',
    status: enrollment.status ?? 'pending',
    label: enrollment.label ?? '',
    createdAt: enrollment.createdAt ?? null,
    activatedAt: enrollment.activatedAt ?? null,
    lastUsedAt: enrollment.lastUsedAt ?? null,
    metadata: enrollment.metadata ?? {},
  };
}

function normaliseBypass(bypass) {
  if (!bypass) {
    return null;
  }
  const user = bypass.user ?? {};
  const resolvedUserName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email ||
    (bypass.userId ? `User #${bypass.userId}` : 'Workspace member');
  const userName = bypass.userName ?? resolvedUserName;
  const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return {
    id: bypass.id ?? `bypass-${randomId}`,
    userId: bypass.userId ?? user.id ?? null,
    userEmail: bypass.userEmail ?? user.email ?? null,
    userName,
    reason: bypass.reason ?? '',
    status: bypass.status ?? 'pending',
    expiresAt: bypass.expiresAt ?? null,
    approvedAt: bypass.approvedAt ?? bypass.issuedAt ?? null,
    approvedBy: bypass.approvedBy ?? null,
    createdAt: bypass.createdAt ?? null,
    notes: bypass.notes ?? '',
  };
}

function normaliseAudit(event) {
  if (!event) {
    return null;
  }
  const actor = event.actor ?? {};
  const resolvedActorName =
    [actor.firstName, actor.lastName].filter(Boolean).join(' ').trim() ||
    actor.email ||
    'System';
  const actorName = event.actorName ?? resolvedActorName;
  const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return {
    id: event.id ?? `audit-${randomId}`,
    action: event.action ?? 'updated',
    targetType: event.targetType ?? 'TwoFactorPolicy',
    targetId: event.targetId ?? null,
    actorName,
    actorEmail: event.actorEmail ?? actor.email ?? null,
    createdAt: event.createdAt ?? event.occurredAt ?? null,
    notes: event.notes ?? event.message ?? '',
  };
}

function normaliseOverview(payload = {}) {
  const summary = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
  const coverage = payload.coverage && typeof payload.coverage === 'object' ? payload.coverage : {};
  const policies = (Array.isArray(payload.policies) ? payload.policies : []).map(normalisePolicy).filter(Boolean);
  const enrollmentsPayload = payload.enrollments && typeof payload.enrollments === 'object' ? payload.enrollments : {};
  const bypassesPayload = payload.bypasses && typeof payload.bypasses === 'object' ? payload.bypasses : {};

  const pendingEnrollments = (Array.isArray(enrollmentsPayload.pending) ? enrollmentsPayload.pending : [])
    .map(normaliseEnrollment)
    .filter(Boolean);
  const activeEnrollments = (Array.isArray(enrollmentsPayload.active) ? enrollmentsPayload.active : [])
    .map(normaliseEnrollment)
    .filter(Boolean);

  const pendingBypasses = (Array.isArray(bypassesPayload.pending) ? bypassesPayload.pending : [])
    .map(normaliseBypass)
    .filter(Boolean);
  const activeBypasses = (Array.isArray(bypassesPayload.active) ? bypassesPayload.active : [])
    .map(normaliseBypass)
    .filter(Boolean);

  return {
    summary: {
      adminCoverageRate: Number(summary.adminCoverageRate ?? coverage.adminCoverageRate ?? 0),
      overallCoverageRate: Number(summary.overallCoverageRate ?? coverage.overallCoverageRate ?? 0),
      pendingEnrollments: Number(summary.pendingEnrollments ?? pendingEnrollments.length ?? 0),
      activeBypasses: Number(summary.activeBypasses ?? activeBypasses.length ?? 0),
      enforcedPolicies: Number(
        summary.enforcedPolicies ?? policies.filter((policy) => policy?.enforced).length ?? policies.length ?? 0,
      ),
      activeChallenges: Number(summary.activeChallenges ?? payload.activeChallenges ?? 0),
    },
    coverage: {
      adminCount: Number(coverage.adminCount ?? 0),
      adminCovered: Number(coverage.adminCovered ?? 0),
      overallCount: Number(coverage.overallCount ?? 0),
      overallCovered: Number(coverage.overallCovered ?? 0),
      byMethod: coverage.byMethod && typeof coverage.byMethod === 'object' ? coverage.byMethod : {},
      adminCoverageRate: Number(summary.adminCoverageRate ?? coverage.adminCoverageRate ?? 0),
      overallCoverageRate: Number(summary.overallCoverageRate ?? coverage.overallCoverageRate ?? 0),
    },
    policies,
    enrollments: {
      pending: pendingEnrollments,
      active: activeEnrollments,
    },
    bypasses: {
      pending: pendingBypasses,
      active: activeBypasses,
    },
    auditLog: (Array.isArray(payload.auditLog) ? payload.auditLog : []).map(normaliseAudit).filter(Boolean),
    refreshedAt: payload.refreshedAt ?? summary.refreshedAt ?? new Date().toISOString(),
    lookbackDays: Number(payload.lookbackDays ?? 30),
    activeChallenges: Number(payload.activeChallenges ?? summary.activeChallenges ?? 0),
    fallback: Boolean(payload.fallback),
  };
}

function formatMethods(methods = []) {
  if (!methods.length) {
    return 'No methods enabled';
  }
  const labels = {
    email: 'Email code',
    app: 'Authenticator app',
    sms: 'SMS code',
    security_key: 'Security key',
    backup_codes: 'Backup codes',
  };
  return methods.map((method) => labels[method] ?? method).join(' • ');
}

function formatMinutes(minutes) {
  const numeric = Number(minutes ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Instant expiry';
  }
  if (numeric >= 1440) {
    return `${(numeric / 1440).toFixed(1)} days`;
  }
  if (numeric >= 60) {
    return `${(numeric / 60).toFixed(1)} hours`;
  }
  return `${numeric.toFixed(0)} minutes`;
}

function formatPercent(value, digits = 0) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  return `${(numeric * 100).toFixed(digits)}%`;
}

export default function AdminTwoFactorManagementPage() {
  const { session, isAuthenticated } = useSession();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyEditing, setPolicyEditing] = useState(null);
  const [policySubmitting, setPolicySubmitting] = useState(false);
  const [bypassSubmitting, setBypassSubmitting] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchTwoFactorOverview();
      setOverview(normaliseOverview(payload));
    } catch (err) {
      console.error('Failed to load 2FA overview', err);
      setError(err?.message ?? 'Unable to load two-factor telemetry right now. Showing cached defaults.');
      setOverview(normaliseOverview(FALLBACK_OVERVIEW));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const profile = useMemo(() => {
    if (!session) {
      return null;
    }
    const name = [session.firstName, session.lastName].filter(Boolean).join(' ').trim() || session.name || session.email || 'Admin';
    const title = session.title ?? 'Platform Administrator';
    const badges = new Set(['Identity ops ready']);
    if (overview?.fallback) {
      badges.add('Fallback data');
    }
    if (session.twoFactorEnabled === false) {
      badges.add('2FA disabled');
    }
    return {
      name,
      role: title,
      initials: session.initials ?? computeInitials(name, session.email),
      avatarUrl: session.avatarUrl ?? null,
      status: overview?.refreshedAt ? `Last sync ${formatRelativeTime(overview.refreshedAt)}` : 'Loading telemetry…',
      badges: Array.from(badges),
      metrics: [
        { label: 'Policies', value: `${overview?.policies?.length ?? 0}` },
        { label: 'Active bypasses', value: `${overview?.summary?.activeBypasses ?? 0}` },
        { label: 'Pending approvals', value: `${overview?.summary?.pendingEnrollments ?? 0}` },
        {
          label: 'Admin coverage',
          value: formatPercent(overview?.summary?.adminCoverageRate ?? 0),
        },
      ],
    };
  }, [session, overview]);

  const handleCreatePolicy = () => {
    setPolicyEditing(null);
    setPolicyModalOpen(true);
  };

  const handleEditPolicy = (policy) => {
    setPolicyEditing(policy);
    setPolicyModalOpen(true);
  };

  const handlePolicySubmit = async (payload) => {
    setPolicySubmitting(true);
    setActionFeedback(null);
    try {
      if (policyEditing?.id) {
        await updateTwoFactorPolicy(policyEditing.id, payload);
        setActionFeedback({ type: 'success', message: 'Policy updated successfully.' });
      } else {
        await createTwoFactorPolicy(payload);
        setActionFeedback({ type: 'success', message: 'Policy created successfully.' });
      }
      setPolicyModalOpen(false);
      setPolicyEditing(null);
      await loadOverview();
    } catch (err) {
      console.error('Failed to persist policy', err);
      setActionFeedback({ type: 'error', message: err?.message ?? 'Unable to save policy.' });
    } finally {
      setPolicySubmitting(false);
    }
  };

  const handlePolicyToggle = async (policy) => {
    setActionFeedback(null);
    try {
      await updateTwoFactorPolicy(policy.id, {
        name: policy.name,
        description: policy.description,
        appliesToRole: policy.appliesToRole,
        enforcementLevel: policy.enforcementLevel,
        allowedMethods: policy.allowedMethods,
        fallbackCodes: policy.fallbackCodes,
        sessionDurationMinutes: policy.sessionDurationMinutes,
        requireForSensitiveActions: policy.requireForSensitiveActions,
        enforced: !policy.enforced,
        ipAllowlist: policy.ipAllowlist,
        notes: policy.notes,
      });
      setActionFeedback({
        type: 'success',
        message: !policy.enforced ? 'Policy enforcement enabled.' : 'Policy enforcement paused.',
      });
      await loadOverview();
    } catch (err) {
      console.error('Failed to toggle policy', err);
      setActionFeedback({ type: 'error', message: err?.message ?? 'Unable to update enforcement state.' });
    }
  };

  const handlePolicyDelete = async (policy) => {
    if (!policy?.id) {
      return;
    }
    const confirmed = window.confirm(`Delete policy “${policy.name}”? This cannot be undone.`);
    if (!confirmed) {
      return;
    }
    setActionFeedback(null);
    try {
      await deleteTwoFactorPolicy(policy.id);
      setActionFeedback({ type: 'success', message: 'Policy deleted.' });
      await loadOverview();
    } catch (err) {
      console.error('Failed to delete policy', err);
      setActionFeedback({ type: 'error', message: err?.message ?? 'Unable to delete policy.' });
    }
  };

  const handleApproveEnrollment = async (enrollment) => {
    setActionFeedback(null);
    try {
      await approveTwoFactorEnrollment(enrollment.id, { note: 'Approved via 2FA console' });
      setActionFeedback({ type: 'success', message: `Approved ${enrollment.userName}'s device.` });
      await loadOverview();
    } catch (err) {
      console.error('Failed to approve enrollment', err);
      setActionFeedback({ type: 'error', message: err?.message ?? 'Unable to approve device.' });
    }
  };

  const handleRevokeEnrollment = async (enrollment) => {
    setActionFeedback(null);
    try {
      await revokeTwoFactorEnrollment(enrollment.id, { note: 'Revoked via 2FA console' });
      setActionFeedback({ type: 'success', message: `Revoked ${enrollment.userName}'s device.` });
      await loadOverview();
    } catch (err) {
      console.error('Failed to revoke enrollment', err);
      setActionFeedback({ type: 'error', message: err?.message ?? 'Unable to revoke device.' });
    }
  };

  const handleBypassSubmit = async (payload) => {
    setBypassSubmitting(true);
    setActionFeedback(null);
    try {
      await issueTwoFactorBypass(payload);
      setActionFeedback({ type: 'success', message: 'Bypass issued successfully.' });
      await loadOverview();
    } catch (err) {
      console.error('Failed to issue bypass', err);
      setActionFeedback({ type: 'error', message: err?.message ?? 'Unable to issue bypass.' });
    } finally {
      setBypassSubmitting(false);
    }
  };

  const handleBypassStatus = async (bypass, status, options = {}) => {
    setActionFeedback(null);
    try {
      await updateTwoFactorBypass(bypass.id, {
        status,
        expiresAt: options.expiresAt,
        notes: options.notes,
      });
      const messageMap = {
        approved: `Approved bypass for ${bypass.userName}.`,
        denied: `Denied bypass for ${bypass.userName}.`,
        revoked: `Revoked bypass for ${bypass.userName}.`,
      };
      setActionFeedback({ type: 'success', message: messageMap[status] ?? 'Bypass updated.' });
      await loadOverview();
    } catch (err) {
      console.error('Failed to update bypass', err);
      setActionFeedback({ type: 'error', message: err?.message ?? 'Unable to update bypass.' });
    }
  };

  const coverageByMethod = overview?.coverage?.byMethod ?? {};
  const coverageMethods = Object.keys(coverageByMethod);

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="2FA management hub"
      subtitle="Keep multi-factor protection tight"
      description="Track coverage, tune policies, and handle device bypasses from one place."
      menuSections={ADMIN_MENU_SECTIONS}
      activeMenuItem="two-factor-management"
      profile={profile}
      sections={[]}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
    >
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Two-factor enforcement</h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor adoption, iterate policies, and unblock trusted operators with temporary bypasses that auto-expire.
            </p>
          </div>
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            <ShieldCheckIcon className={`h-5 w-5 ${loading ? 'animate-spin text-blue-600' : 'text-blue-500'}`} />
            {loading ? 'Refreshing…' : 'Refresh data'}
          </button>
        </header>

        {actionFeedback ? (
          <div
            className={`rounded-3xl border px-4 py-3 text-sm ${
              actionFeedback.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {actionFeedback.message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        {loading && !overview ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading two-factor telemetry…
          </div>
        ) : null}

        {overview ? (
          <div className="space-y-8">
            <TwoFactorSummaryCards
              summary={overview.summary}
              coverage={overview.coverage}
              activeChallenges={overview.activeChallenges}
            />

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Policies</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Adjust enforcement across roles and methods. Updates take effect immediately for future sign-ins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreatePolicy}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <WrenchScrewdriverIcon className="h-5 w-5" /> Create policy
                </button>
              </div>

              {overview.policies.length ? (
                <div className="mt-6 space-y-4">
                  {overview.policies.map((policy) => (
                    <article
                      key={policy.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-inner"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{policy.name}</h3>
                          <p className="text-sm text-slate-600">{policy.description || 'No description provided.'}</p>
                          <dl className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                            <div>
                              <dt className="font-semibold text-slate-700">Applies to</dt>
                              <dd className="mt-1 capitalize">{policy.appliesToRole}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-700">Enforcement level</dt>
                              <dd className="mt-1 capitalize">{policy.enforcementLevel}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-700">Allowed methods</dt>
                              <dd className="mt-1">{formatMethods(policy.allowedMethods)}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-700">Session timeout</dt>
                              <dd className="mt-1">{formatMinutes(policy.sessionDurationMinutes)}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-700">Fallback codes</dt>
                              <dd className="mt-1">{policy.fallbackCodes}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-700">Sensitive actions</dt>
                              <dd className="mt-1">{policy.requireForSensitiveActions ? 'Always challenge' : 'Optional'}</dd>
                            </div>
                          </dl>
                          {policy.ipAllowlist.length ? (
                            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-700">
                              <p className="font-semibold uppercase tracking-wide">IP allowlist</p>
                              <p className="mt-1 break-words">{policy.ipAllowlist.join(', ')}</p>
                            </div>
                          ) : null}
                          {policy.notes ? (
                            <p className="mt-3 text-xs text-slate-500">Auditor notes: {policy.notes}</p>
                          ) : null}
                          <p className="mt-3 text-xs text-slate-400">
                            Updated {policy.updatedAt ? formatRelativeTime(policy.updatedAt) : 'recently'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              policy.enforced
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {policy.enforced ? 'Enforced' : 'Paused'}
                          </span>
                          <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row">
                            <button
                              type="button"
                              onClick={() => handleEditPolicy(policy)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePolicyToggle(policy)}
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                            >
                              {policy.enforced ? 'Pause enforcement' : 'Enforce now'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePolicyDelete(policy)}
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                  No policies configured yet. Create one to enforce MFA coverage.
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Device enrollments</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Approve security keys and authenticator apps before they unlock privileged workflows.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Pending approval</h3>
                  <div className="mt-3 space-y-3">
                    {overview.enrollments.pending.length ? (
                      overview.enrollments.pending.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">{enrollment.userName}</p>
                              <p className="text-xs text-slate-500">{enrollment.userEmail}</p>
                            </div>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              {enrollment.method}
                            </span>
                          </div>
                          <p className="mt-2">{enrollment.label || 'Unlabelled device'}</p>
                          {enrollment.metadata && Object.keys(enrollment.metadata).length ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {Object.entries(enrollment.metadata)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(' • ')}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-400">
                            Requested {enrollment.createdAt ? formatRelativeTime(enrollment.createdAt) : 'recently'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveEnrollment(enrollment)}
                              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeEnrollment(enrollment)}
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                        No pending enrollments.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Active devices</h3>
                  <div className="mt-3 space-y-3">
                    {overview.enrollments.active.length ? (
                      overview.enrollments.active.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">{enrollment.userName}</p>
                              <p className="text-xs text-slate-500">{enrollment.userEmail}</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {enrollment.method}
                            </span>
                          </div>
                          <p className="mt-2">{enrollment.label || 'Verified device'}</p>
                          <p className="mt-2 text-xs text-slate-400">
                            Last used {enrollment.lastUsedAt ? formatRelativeTime(enrollment.lastUsedAt) : 'recently'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleRevokeEnrollment(enrollment)}
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                        No active devices recorded.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Bypass requests</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Approve or revoke temporary access when admins are locked out of their second factor.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">Pending</h3>
                  {overview.bypasses.pending.length ? (
                    overview.bypasses.pending.map((bypass) => (
                      <div
                        key={bypass.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{bypass.userName}</p>
                            <p className="text-xs text-slate-500">{bypass.userEmail}</p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Pending
                          </span>
                        </div>
                        <p className="mt-2">{bypass.reason || 'No reason provided.'}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          Expires {bypass.expiresAt ? formatRelativeTime(bypass.expiresAt) : 'once reviewed'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleBypassStatus(bypass, 'approved')}
                            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBypassStatus(bypass, 'denied')}
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                      No pending bypasses.
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800">Active</h3>
                  {overview.bypasses.active.length ? (
                    overview.bypasses.active.map((bypass) => (
                      <div
                        key={bypass.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{bypass.userName}</p>
                            <p className="text-xs text-slate-500">{bypass.userEmail}</p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        </div>
                        <p className="mt-2">{bypass.reason || 'No reason provided.'}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          Expires {bypass.expiresAt ? formatRelativeTime(bypass.expiresAt) : 'when revoked'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleBypassStatus(bypass, 'approved', {
                                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                              })
                            }
                            className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:text-blue-700"
                          >
                            Extend 24h
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBypassStatus(bypass, 'revoked')}
                            className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                      No active bypasses.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <TwoFactorBypassForm onSubmit={handleBypassSubmit} submitting={bypassSubmitting} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Coverage analytics</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin accounts</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {overview.coverage.adminCovered} / {overview.coverage.adminCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatPercent(overview.summary.adminCoverageRate)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace accounts</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {overview.coverage.overallCovered} / {overview.coverage.overallCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatPercent(overview.summary.overallCoverageRate)}</p>
                </div>
                {coverageMethods.map((method) => (
                  <div key={method} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{method}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {coverageByMethod[method] ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Audit trail</h2>
              {overview.auditLog.length ? (
                <div className="mt-4 space-y-3">
                  {overview.auditLog.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{event.action}</p>
                          <p className="text-xs text-slate-500">
                            {event.actorName}
                            {event.actorEmail ? ` • ${event.actorEmail}` : ''}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {event.createdAt ? formatDateTime(event.createdAt) : 'Recently'}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{event.notes || 'No additional notes.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
                  No audit entries recorded yet.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <TwoFactorPolicyForm
        initialValue={policyEditing}
        open={policyModalOpen}
        onClose={() => {
          setPolicyModalOpen(false);
          setPolicyEditing(null);
        }}
        onSubmit={handlePolicySubmit}
        submitting={policySubmitting}
      />
    </DashboardLayout>
  );
}
