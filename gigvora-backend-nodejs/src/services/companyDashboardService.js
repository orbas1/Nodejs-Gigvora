import { Op } from 'sequelize';
import {
  ProviderWorkspace,
  ProviderWorkspaceMember,
  ProviderWorkspaceInvite,
  ProviderContactNote,
  CompanyProfile,
  User,
  Profile,
  Job,
  Gig,
  Project,
  Application,
  ApplicationReview,
  HiringAlert,
  CandidateDemographicSnapshot,
  CandidateSatisfactionSurvey,
  InterviewSchedule,
  JobStage,
  JobApprovalWorkflow,
  JobCampaignPerformance,
  PartnerEngagement,
  PartnerAgreement,
  PartnerCommission,
  PartnerSlaSnapshot,
  PartnerCollaborationEvent,
  RecruitingCalendarEvent,
  EmployerBrandAsset,
  MessageThread,
  Message,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'dashboard:company';
const CACHE_TTL_SECONDS = 45;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 180;

function clamp(value, { min, max, fallback }) {
  if (!Number.isFinite(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  if (numeric < min) {
    return min;
  }
  if (numeric > max) {
    return max;
  }
  return numeric;
}

function differenceInDays(start, end = new Date()) {
  if (!start) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs)) {
    return null;
  }
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function average(numbers) {
  const valid = numbers.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return null;
  }
  const total = valid.reduce((sum, value) => sum + value, 0);
  return Number((total / valid.length).toFixed(1));
}

function median(numbers) {
  const valid = numbers.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!valid.length) {
    return null;
  }
  const mid = Math.floor(valid.length / 2);
  if (valid.length % 2 === 0) {
    return Number(((valid[mid - 1] + valid[mid]) / 2).toFixed(1));
  }
  return Number(valid[mid].toFixed(1));
}

function percentage(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) {
    return 0;
  }
  return Number(((part / total) * 100).toFixed(1));
}

function sumNumbers(values = []) {
  return values.reduce((total, value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return total;
    }
    return total + numeric;
  }, 0);
}

function normaliseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return metadata;
}

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toCents(value) {
  if (value == null) {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100);
}

function centsToAmount(value) {
  if (value == null) {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number((numeric / 100).toFixed(2));
}

function extractPartnerInfo(metadata, { fallbackName = 'Agency partner', fallbackType = 'agency' } = {}) {
  const normalised = normaliseMetadata(metadata);
  const partnerName = [
    normalised.partnerName,
    normalised.agencyName,
    normalised.headhunterName,
    normalised.vendor,
  ].find((value) => value && `${value}`.trim().length);

  const partnerType =
    normalised.partnerType || normalised.agencyType || normalised.relationshipType || fallbackType;

  return {
    partnerName: partnerName ? `${partnerName}` : fallbackName,
    partnerType: `${partnerType || fallbackType}`.toLowerCase(),
  };
}

function resolveWorkspaceSelector({ workspaceId, workspaceSlug }) {
  if (workspaceId != null && `${workspaceId}`.trim().length) {
    const parsed = Number(workspaceId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new ValidationError('workspaceId must be a positive integer.');
    }
    return { id: parsed };
  }

  if (workspaceSlug != null && `${workspaceSlug}`.trim().length) {
    return { slug: `${workspaceSlug}`.trim() };
  }

  throw new ValidationError('workspaceId or workspaceSlug is required.');
}

function buildMemberSummary(members) {
  const totals = {
    total: members.length,
    active: 0,
    pending: 0,
    bench: 0,
    averageWeeklyCapacity: null,
    timezones: new Set(),
  };

  const capacities = [];

  members.forEach((member) => {
    if (member.status === 'active') {
      totals.active += 1;
    }
    if (member.status === 'pending') {
      totals.pending += 1;
    }

    const profile = member.member?.Profile ?? member.member?.profile ?? null;
    if (profile?.availabilityStatus === 'available') {
      totals.bench += 1;
    }
    if (profile?.availableHoursPerWeek != null) {
      const numeric = Number(profile.availableHoursPerWeek);
      if (Number.isFinite(numeric)) {
        capacities.push(numeric);
      }
    }
    if (profile?.timezone) {
      totals.timezones.add(profile.timezone);
    }
  });

  totals.averageWeeklyCapacity = capacities.length ? average(capacities) : null;
  totals.uniqueTimezones = totals.timezones.size;
  delete totals.timezones;

  return totals;
}

function buildInviteSummary(invites) {
  if (!invites.length) {
    return { pending: 0, accepted: 0, expired: 0, lastSentAt: null };
  }

  const summary = { pending: 0, accepted: 0, expired: 0, lastSentAt: null };
  invites.forEach((invite) => {
    if (invite.status === 'pending') {
      summary.pending += 1;
    } else if (invite.status === 'accepted') {
      summary.accepted += 1;
    } else if (invite.status === 'expired' || invite.status === 'revoked') {
      summary.expired += 1;
    }

    if (!summary.lastSentAt || new Date(invite.createdAt) > new Date(summary.lastSentAt)) {
      summary.lastSentAt = invite.createdAt;
    }
  });
  return summary;
}

function buildPipelineSummary(applications) {
  const statusCounts = new Map();
  const sourceCounts = new Map();
  const velocityToDecision = [];
  const velocityToInterview = [];
  let interviews = 0;
  let offers = 0;
  let hires = 0;

  applications.forEach((application) => {
    statusCounts.set(application.status, (statusCounts.get(application.status) ?? 0) + 1);
    sourceCounts.set(application.sourceChannel, (sourceCounts.get(application.sourceChannel) ?? 0) + 1);

    if (application.status === 'interview') {
      interviews += 1;
    }
    if (application.status === 'offered') {
      offers += 1;
    }
    if (application.status === 'hired') {
      hires += 1;
    }

    if (application.decisionAt) {
      const days = differenceInDays(application.submittedAt ?? application.createdAt, application.decisionAt);
      if (Number.isFinite(days)) {
        velocityToDecision.push(days);
      }
    }

    if (application.metadata?.interviewScheduledAt) {
      const days = differenceInDays(
        application.submittedAt ?? application.createdAt,
        application.metadata.interviewScheduledAt,
      );
      if (Number.isFinite(days)) {
        velocityToInterview.push(days);
      }
    }
  });

  const totalApplications = applications.length;
  const convertedStatuses = Object.fromEntries(statusCounts.entries());
  const sources = Object.fromEntries(sourceCounts.entries());

  return {
    totals: {
      applications: totalApplications,
      interviews,
      offers,
      hires,
    },
    byStatus: convertedStatuses,
    bySource: sources,
    velocity: {
      averageDaysToDecision: average(velocityToDecision),
      medianDaysToInterview: median(velocityToInterview),
    },
    conversionRates: {
      offerRate: percentage(offers, totalApplications),
      hireRate: percentage(hires, totalApplications),
      interviewRate: percentage(interviews, totalApplications),
    },
  };
}

function buildProjectSummary(projects) {
  const buckets = {
    active: 0,
    planning: 0,
    atRisk: 0,
    completed: 0,
  };

  let automationEnabled = 0;
  let automationQueue = 0;

  projects.forEach((project) => {
    const status = (project.status ?? '').toLowerCase();
    if (['draft', 'planning', 'proposal', 'scoping'].includes(status)) {
      buckets.planning += 1;
    } else if (['delayed', 'blocked', 'on_hold', 'at_risk'].includes(status)) {
      buckets.atRisk += 1;
    } else if (['completed', 'closed', 'archived'].includes(status)) {
      buckets.completed += 1;
    } else {
      buckets.active += 1;
    }

    if (project.autoAssignEnabled) {
      automationEnabled += 1;
      if (project.autoAssignLastQueueSize != null) {
        const numeric = Number(project.autoAssignLastQueueSize);
        if (Number.isFinite(numeric)) {
          automationQueue += numeric;
        }
      }
    }
  });

  return {
    totals: buckets,
    automation: {
      automationEnabled,
      queueSize: automationQueue,
    },
  };
}

function sanitiseWorkspace(workspace, memberSummary, inviteSummary, badges = []) {
  const plain = workspace.get({ plain: true });
  const owner = workspace.owner?.get?.({ plain: true }) ?? workspace.owner ?? null;
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    timezone: plain.timezone,
    defaultCurrency: plain.defaultCurrency,
    intakeEmail: plain.intakeEmail,
    type: plain.type,
    isActive: plain.isActive,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    memberSummary,
    inviteSummary,
    health: {
      badges,
    },
    owner: owner
      ? {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
        }
      : null,
  };
}

function deriveWorkspaceBadges({ memberSummary, pipelineSummary, projectSummary }) {
  const badges = new Set();
  if ((memberSummary?.active ?? 0) >= 10) {
    badges.add('Scaled recruiting operations');
  }
  if ((pipelineSummary?.conversionRates?.hireRate ?? 0) >= 15) {
    badges.add('High offer acceptance');
  }
  if ((projectSummary?.automation?.automationEnabled ?? 0) > 0) {
    badges.add('Automation enabled');
  }
  if ((memberSummary?.uniqueTimezones ?? 0) > 2) {
    badges.add('Global hiring coverage');
  }
  return Array.from(badges);
}

function sanitizeProfile(companyProfile) {
  if (!companyProfile) {
    return null;
  }
  const plain = companyProfile.get ? companyProfile.get({ plain: true }) : companyProfile;
  return {
    companyName: plain.companyName,
    description: plain.description,
    website: plain.website,
  };
}

function buildRecentNotes(notes) {
  return notes.map((note) => {
    const plain = note.get ? note.get({ plain: true }) : note;
    const author = note.author?.get?.({ plain: true }) ?? note.author ?? null;
    const subject = note.subject?.get?.({ plain: true }) ?? note.subject ?? null;
    return {
      id: plain.id,
      visibility: plain.visibility,
      note: plain.note,
      createdAt: plain.createdAt,
      author: author
        ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
          }
        : null,
      subject: subject
        ? {
            id: subject.id,
            firstName: subject.firstName,
            lastName: subject.lastName,
            email: subject.email,
          }
        : null,
    };
  });
}

async function fetchWorkspace(selector) {
  const workspace = await ProviderWorkspace.findOne({
    where: {
      type: 'company',
      ...(selector.id ? { id: selector.id } : {}),
      ...(selector.slug ? { slug: selector.slug } : {}),
    },
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
  });

  if (!workspace) {
    throw new NotFoundError('Company workspace not found.');
  }

  return workspace;
}

async function fetchMembers(workspaceId) {
  return ProviderWorkspaceMember.findAll({
    where: { workspaceId },
    include: [
      {
        model: User,
        as: 'member',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        include: [
          {
            model: Profile,
            as: 'Profile',
            attributes: ['availabilityStatus', 'availableHoursPerWeek', 'timezone'],
            required: false,
          },
        ],
      },
    ],
    order: [['createdAt', 'ASC']],
  });
}

async function fetchInvites(workspaceId) {
  return ProviderWorkspaceInvite.findAll({
    where: { workspaceId },
    order: [['createdAt', 'DESC']],
  });
}

async function fetchNotes(workspaceId) {
  return ProviderContactNote.findAll({
    where: { workspaceId },
    include: [
      { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'subject', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
    limit: 8,
    order: [['createdAt', 'DESC']],
  });
}

async function fetchApplications({ workspaceId, since }) {
  const where = {
    targetType: { [Op.in]: ['job', 'project', 'gig'] },
  };

  if (since) {
    where.createdAt = { [Op.gte]: since };
  }

  // We do not yet store a direct foreign key to the company workspace on applications.
  // As a pragmatic interim, we scope by metadata.workspaceId when present and fall back to all records.
  const applications = await Application.findAll({
    where,
    attributes: [
      'id',
      'applicantId',
      'targetType',
      'targetId',
      'status',
      'sourceChannel',
      'submittedAt',
      'decisionAt',
      'createdAt',
      'updatedAt',
      'metadata',
    ],
  });

  if (!applications.length) {
    return applications;
  }

  return applications.filter((application) => {
    const metadata = application.metadata ?? {};
    if (!metadata || typeof metadata !== 'object') {
      return true;
    }
    if (metadata.companyWorkspaceId && Number.isInteger(metadata.companyWorkspaceId)) {
      return Number(metadata.companyWorkspaceId) === workspaceId;
    }
    if (metadata.workspaceId && Number.isInteger(metadata.workspaceId)) {
      return Number(metadata.workspaceId) === workspaceId;
    }
    return true;
  });
}

async function fetchApplicationReviews({ applicationIds, since }) {
  if (!applicationIds.length) {
    return [];
  }
  const where = { applicationId: { [Op.in]: applicationIds } };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return ApplicationReview.findAll({
    where,
    attributes: ['id', 'applicationId', 'stage', 'decision', 'score', 'decidedAt', 'createdAt'],
  });
}

async function fetchProjects({ since, workspaceId }) {
  const where = {};
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  const projects = await Project.findAll({
    where,
    attributes: [
      'id',
      'status',
      'autoAssignEnabled',
      'autoAssignLastQueueSize',
      'autoAssignSettings',
      'createdAt',
      'updatedAt',
    ],
  });

  if (!projects.length) {
    return projects;
  }

  // Filter by metadata if present.
  return projects.filter((project) => {
    const metadata = project.autoAssignSettings ?? {};
    if (metadata && typeof metadata === 'object') {
      if (metadata.companyWorkspaceId && Number.isInteger(metadata.companyWorkspaceId)) {
        return Number(metadata.companyWorkspaceId) === workspaceId;
      }
      if (metadata.workspaceId && Number.isInteger(metadata.workspaceId)) {
        return Number(metadata.workspaceId) === workspaceId;
      }
    }
    return true;
  });
}

async function fetchJobs({ since }) {
  const where = {};
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return Job.findAll({ where, attributes: ['id', 'title', 'location', 'createdAt'] });
}

async function fetchGigs({ since }) {
  const where = {};
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return Gig.findAll({ where, attributes: ['id', 'title', 'location', 'createdAt'] });
}

async function fetchHiringAlerts({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.detectedAt = { [Op.gte]: since };
  }
  return HiringAlert.findAll({
    where,
    order: [['detectedAt', 'DESC']],
    limit: 25,
  });
}

async function fetchCandidateSnapshots({ workspaceId, applicationIds, since }) {
  const where = { workspaceId };
  if (since) {
    where.capturedAt = { [Op.gte]: since };
  }
  if (applicationIds?.length) {
    where.applicationId = { [Op.in]: applicationIds };
  }
  return CandidateDemographicSnapshot.findAll({
    where,
    attributes: [
      'id',
      'applicationId',
      'genderIdentity',
      'ethnicity',
      'veteranStatus',
      'disabilityStatus',
      'capturedAt',
    ],
    limit: 500,
  });
}

async function fetchCandidateSurveys({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.responseAt = { [Op.gte]: since };
  }
  return CandidateSatisfactionSurvey.findAll({
    where,
    order: [['responseAt', 'DESC']],
    limit: 100,
  });
}

async function fetchInterviewSchedules({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.scheduledAt = { [Op.gte]: since };
  }
  return InterviewSchedule.findAll({
    where,
    order: [['scheduledAt', 'ASC']],
    limit: 100,
  });
}

async function fetchJobStagesData({ workspaceId }) {
  return JobStage.findAll({
    where: { workspaceId },
    order: [['orderIndex', 'ASC']],
    limit: 50,
  });
}

async function fetchJobApprovals({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.createdAt = { [Op.gte]: since };
  }
  return JobApprovalWorkflow.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
}

async function fetchJobCampaigns({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.reportingDate = { [Op.gte]: since };
  }
  return JobCampaignPerformance.findAll({
    where,
    order: [['reportingDate', 'DESC']],
    limit: 120,
  });
}

async function fetchPartnerEngagements({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.lastInteractionAt = { [Op.gte]: since };
  }
  return PartnerEngagement.findAll({
    where,
    order: [['lastInteractionAt', 'DESC']],
    limit: 50,
  });
}

async function fetchPartnerCommissions({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.updatedAt = { [Op.gte]: since };
  }
  return PartnerCommission.findAll({
    where,
    order: [['dueDate', 'ASC']],
    limit: 120,
  });
}

async function fetchPartnerAgreements({ workspaceId }) {
  return PartnerAgreement.findAll({
    where: { workspaceId },
    order: [['renewalDate', 'ASC']],
    limit: 60,
  });
}

async function fetchPartnerSlaSnapshots({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.reportingPeriodStart = { [Op.gte]: since };
  }
  return PartnerSlaSnapshot.findAll({
    where,
    order: [['reportingPeriodEnd', 'DESC']],
    limit: 120,
  });
}

async function fetchPartnerCollaborationEvents({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.occurredAt = { [Op.gte]: since };
  }
  return PartnerCollaborationEvent.findAll({
    where,
    order: [['occurredAt', 'DESC']],
    limit: 120,
  });
}

async function fetchPartnerThreads({ workspaceId, since }) {
  const threads = await MessageThread.findAll({
    where: { state: 'active' },
    order: [['lastMessageAt', 'DESC']],
    limit: 25,
    include: [
      {
        model: Message,
        as: 'messages',
        required: false,
        where: since
          ? {
              createdAt: {
                [Op.gte]: since,
              },
            }
          : undefined,
        separate: true,
        limit: 40,
        order: [['createdAt', 'DESC']],
      },
    ],
  });

  if (!threads.length) {
    return [];
  }

  return threads.filter((thread) => {
    const metadata = normaliseMetadata(thread.metadata);
    const workspaceIds = [
      metadata.companyWorkspaceId,
      metadata.workspaceId,
      metadata.providerWorkspaceId,
      metadata.partnerWorkspaceId,
    ]
      .map((value) => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
      })
      .filter(Boolean);

    if (!workspaceIds.length) {
      return true;
    }
    return workspaceIds.includes(workspaceId);
  });
}

async function loadApplicants(applications) {
  const ids = Array.from(new Set(applications.map((application) => application.applicantId))).filter(Boolean);
  if (!ids.length) {
    return new Map();
  }

  const applicants = await User.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'firstName', 'lastName', 'email'],
    include: [
      {
        model: Profile,
        attributes: ['headline', 'location', 'availabilityStatus'],
        required: false,
      },
    ],
  });

  return new Map(applicants.map((applicant) => [applicant.id, applicant.get({ plain: true })]));
}

async function fetchCalendarEvents({ workspaceId, since }) {
  const where = { workspaceId };
  if (since) {
    where.startsAt = { [Op.gte]: since };
  }
  return RecruitingCalendarEvent.findAll({
    where,
    order: [['startsAt', 'ASC']],
    limit: 50,
  });
}

async function fetchBrandAssets({ workspaceId }) {
  return EmployerBrandAsset.findAll({
    where: { workspaceId },
    order: [['updatedAt', 'DESC']],
    limit: 25,
  });
}

function buildJobSummary({ jobs, gigs }) {
  const total = jobs.length + gigs.length;
  const byType = {
    jobs: jobs.length,
    gigs: gigs.length,
  };

  const locations = new Map();
  [...jobs, ...gigs].forEach((record) => {
    if (record.location) {
      locations.set(record.location, (locations.get(record.location) ?? 0) + 1);
    }
  });

  return {
    total,
    byType,
    topLocations: Array.from(locations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count })),
  };
}

function buildRecommendations({ memberSummary, pipelineSummary, inviteSummary }) {
  const recommendations = [];

  if ((inviteSummary?.pending ?? 0) > 0) {
    recommendations.push({
      title: 'Follow up on pending invites',
      description:
        'A few workspace invites are still awaiting acceptance. Consider nudging stakeholders to maintain hiring momentum.',
      action: 'Review pending invites and resend reminders where appropriate.',
    });
  }

  if ((pipelineSummary?.conversionRates?.interviewRate ?? 0) < 25) {
    recommendations.push({
      title: 'Increase interview throughput',
      description: 'Interview conversion is below target for the selected lookback window.',
      action: 'Audit screening criteria and ensure interviewers are responding promptly to scheduling requests.',
    });
  }

  if ((memberSummary?.bench ?? 0) > 0) {
    recommendations.push({
      title: 'Re-engage bench recruiters',
      description: 'Some active workspace members are marked as available. Balance load by assigning them to priority roles.',
      action: 'Distribute requisitions to underutilised teammates and share refreshed hiring goals.',
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      title: 'Keep momentum strong',
      description:
        'Hiring operations are running smoothly. Continue monitoring interview velocity and candidate experience metrics.',
      action: 'Schedule a weekly review to celebrate wins and align on upcoming requisitions.',
    });
  }

  return recommendations;
}

function normalizeCategory(value, fallback = 'Unspecified') {
  if (value == null) {
    return fallback;
  }
  const label = `${value}`.trim();
  return label.length ? label : fallback;
}

function buildBreakdown(records, key) {
  const counts = new Map();
  records.forEach((record) => {
    const plain = record?.get ? record.get({ plain: true }) : record;
    const label = normalizeCategory(plain?.[key]);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return counts;
}

function formatBreakdown(counts, total) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, percentage: percentage(count, total) }));
}

function computeDiversityIndex(counts, total) {
  if (!total) {
    return null;
  }
  const normalised = Array.from(counts.values()).reduce((sum, count) => {
    const share = count / total;
    return sum + share * share;
  }, 0);
  return Number((1 - normalised).toFixed(3));
}

function buildDiversityMetrics(snapshots) {
  const total = snapshots.length;
  if (!total) {
    return {
      total,
      breakdowns: {
        gender: [],
        ethnicity: [],
        veteranStatus: [],
        disabilityStatus: [],
      },
      representationIndex: null,
    };
  }

  const genderCounts = buildBreakdown(snapshots, 'genderIdentity');
  const ethnicityCounts = buildBreakdown(snapshots, 'ethnicity');
  const veteranCounts = buildBreakdown(snapshots, 'veteranStatus');
  const disabilityCounts = buildBreakdown(snapshots, 'disabilityStatus');

  return {
    total,
    breakdowns: {
      gender: formatBreakdown(genderCounts, total),
      ethnicity: formatBreakdown(ethnicityCounts, total),
      veteranStatus: formatBreakdown(veteranCounts, total),
      disabilityStatus: formatBreakdown(disabilityCounts, total),
    },
    representationIndex: computeDiversityIndex(ethnicityCounts, total),
  };
}

function sanitizeAlert(alert) {
  const plain = alert?.get ? alert.get({ plain: true }) : alert;
  return {
    id: plain.id,
    category: plain.category,
    severity: plain.severity,
    status: plain.status,
    message: plain.message,
    detectedAt: plain.detectedAt,
    resolvedAt: plain.resolvedAt,
  };
}

function buildAlertsSummary(alerts) {
  if (!alerts?.length) {
    return {
      total: 0,
      open: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: {},
      byCategory: {},
      latestDetection: null,
      items: [],
    };
  }

  const bySeverity = new Map();
  const byCategory = new Map();
  let open = 0;
  let acknowledged = 0;
  let resolved = 0;
  let latestDetection = null;

  alerts.forEach((alert) => {
    const plain = alert?.get ? alert.get({ plain: true }) : alert;
    bySeverity.set(plain.severity, (bySeverity.get(plain.severity) ?? 0) + 1);
    byCategory.set(plain.category, (byCategory.get(plain.category) ?? 0) + 1);

    if (plain.status === 'open') {
      open += 1;
    } else if (plain.status === 'acknowledged') {
      acknowledged += 1;
    } else if (plain.status === 'resolved') {
      resolved += 1;
    }

    if (!latestDetection || new Date(plain.detectedAt) > new Date(latestDetection)) {
      latestDetection = plain.detectedAt;
    }
  });

  return {
    total: alerts.length,
    open,
    acknowledged,
    resolved,
    bySeverity: Object.fromEntries(bySeverity.entries()),
    byCategory: Object.fromEntries(byCategory.entries()),
    latestDetection,
    items: alerts.slice(0, 12).map(sanitizeAlert),
  };
}

function buildJobLifecycleInsights({ jobStages, approvals, campaigns, pipelineSummary, jobSummary }) {
  const sortedStages = [...jobStages].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  const averageStageDuration = average(
    sortedStages
      .map((stage) => (stage.averageDurationHours == null ? null : Number(stage.averageDurationHours)))
      .filter((value) => Number.isFinite(value)),
  );

  const pendingApprovals = approvals.filter((item) => item.status !== 'approved');
  const overdueApprovals = pendingApprovals.filter((item) => {
    if (!item.dueAt) return false;
    return new Date(item.dueAt) < new Date();
  });

  const completionDurations = approvals
    .filter((item) => item.completedAt)
    .map((item) => {
      const end = new Date(item.completedAt);
      const start = item.createdAt ? new Date(item.createdAt) : null;
      if (!start || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return Number.isFinite(diffHours) ? diffHours : null;
    })
    .filter((value) => Number.isFinite(value));

  const campaignsByChannel = new Map();
  campaigns.forEach((campaign) => {
    const channel = normalizeCategory(campaign.channel, 'Direct');
    const entry = campaignsByChannel.get(channel) ?? {
      impressions: 0,
      clicks: 0,
      applications: 0,
      hires: 0,
      spend: 0,
    };
    entry.impressions += Number(campaign.impressions ?? 0);
    entry.clicks += Number(campaign.clicks ?? 0);
    entry.applications += Number(campaign.applications ?? 0);
    entry.hires += Number(campaign.hires ?? 0);
    entry.spend += Number.parseFloat(campaign.spendAmount ?? 0);
    campaignsByChannel.set(channel, entry);
  });

  const totalSpend = Array.from(campaignsByChannel.values()).reduce((sum, entry) => sum + entry.spend, 0);

  return {
    totalStages: jobStages.length,
    averageStageDurationHours: averageStageDuration,
    pendingApprovals: pendingApprovals.length,
    overdueApprovals: overdueApprovals.length,
    averageApprovalTurnaroundHours: completionDurations.length ? Number(average(completionDurations)) : null,
    stageGuides: sortedStages.slice(0, 8).map((stage) => ({
      id: stage.id,
      name: stage.name,
      slaHours: stage.slaHours,
      averageDurationHours: stage.averageDurationHours == null ? null : Number(stage.averageDurationHours),
      guideUrl: stage.guideUrl,
    })),
    campaigns: {
      totalSpend,
      byChannel: Array.from(campaignsByChannel.entries())
        .sort((a, b) => b[1].applications - a[1].applications)
        .map(([channel, metrics]) => ({
          channel,
          ...metrics,
          conversionRate: metrics.applications ? Number(((metrics.hires / metrics.applications) * 100).toFixed(1)) : 0,
        })),
    },
    atsHealth: {
      conversionRates: pipelineSummary?.conversionRates ?? {},
      velocity: pipelineSummary?.velocity ?? {},
      activeRequisitions: jobSummary?.total ?? 0,
    },
  };
}

function buildJobDesignStudioSummary({ approvals, jobStages, jobSummary, alerts }) {
  const approvalsInFlight = approvals.filter((item) => ['pending', 'in_review'].includes(item.status));
  const coAuthorSessions = approvals.filter((item) => (item.metadata?.coAuthorCount ?? 1) > 1);
  const complianceAlerts = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('compliance'));

  return {
    totalRequisitions: jobSummary?.total ?? 0,
    approvalsInFlight: approvalsInFlight.length,
    coAuthorSessions: coAuthorSessions.length,
    structuredStages: jobStages.length,
    complianceAlerts: complianceAlerts.length,
  };
}

function buildSourcingSummary({ pipelineSummary, campaigns }) {
  const sources = Object.entries(pipelineSummary?.bySource ?? {}).map(([source, count]) => ({
    source,
    count,
    percentage: percentage(count, pipelineSummary?.totals?.applications ?? 0),
  }));

  const campaignTotals = campaigns.reduce(
    (totals, campaign) => {
      totals.applications += Number(campaign.applications ?? 0);
      totals.hires += Number(campaign.hires ?? 0);
      totals.spend += Number.parseFloat(campaign.spendAmount ?? 0);
      return totals;
    },
    { applications: 0, hires: 0, spend: 0 },
  );

  return {
    sources: sources.sort((a, b) => b.count - a.count),
    campaignTotals,
    averageCostPerApplication:
      campaignTotals.applications > 0 ? Number((campaignTotals.spend / campaignTotals.applications).toFixed(2)) : null,
    hireContributionRate:
      campaignTotals.applications > 0 ? percentage(campaignTotals.hires, campaignTotals.applications) : 0,
  };
}

function buildApplicantRelationshipManagerSummary({ surveys, pipelineSummary, partnerSummary }) {
  const followUpsScheduled = surveys.filter((survey) => {
    if (!survey.followUpScheduledAt) return false;
    return new Date(survey.followUpScheduledAt) > new Date();
  }).length;
  const complianceReviews = surveys.filter((survey) => normalizeCategory(survey.sentiment).toLowerCase() === 'compliance').length;

  return {
    totalActiveCandidates: pipelineSummary?.totals?.applications ?? 0,
    nurtureCampaigns: partnerSummary?.touchpoints ?? 0,
    followUpsScheduled,
    complianceReviews,
  };
}

function buildAnalyticsForecastingSummary({ pipelineSummary, jobSummary, projectSummary }) {
  const applications = pipelineSummary?.totals?.applications ?? 0;
  const hireRate = pipelineSummary?.conversionRates?.hireRate ?? 0;
  const projectedHires = Math.round((applications * hireRate) / 100);
  const backlog = (jobSummary?.total ?? 0) - projectedHires;
  const atRiskProjects = projectSummary?.totals?.atRisk ?? 0;

  return {
    projectedHires,
    backlog: backlog > 0 ? backlog : 0,
    timeToFillDays: pipelineSummary?.velocity?.averageDaysToDecision ?? null,
    atRiskProjects,
  };
}

function buildInterviewOperationsSummary({ schedules, reviews }) {
  const now = new Date();
  const upcoming = [];
  const durations = [];
  const leadTimes = [];
  let reschedules = 0;

  schedules.forEach((schedule) => {
    const plain = schedule?.get ? schedule.get({ plain: true }) : schedule;
    if (plain.rescheduleCount) {
      reschedules += Number(plain.rescheduleCount);
    }
    if (plain.durationMinutes != null) {
      durations.push(Number(plain.durationMinutes));
    }
    if (plain.createdAt && plain.scheduledAt) {
      const start = new Date(plain.createdAt);
      const scheduled = new Date(plain.scheduledAt);
      if (Number.isFinite(start.getTime()) && Number.isFinite(scheduled.getTime())) {
        const hours = (scheduled.getTime() - start.getTime()) / (1000 * 60 * 60);
        if (Number.isFinite(hours)) {
          leadTimes.push(hours);
        }
      }
    }
    if (!plain.completedAt && plain.scheduledAt && new Date(plain.scheduledAt) >= now) {
      upcoming.push({
        id: plain.id,
        stage: plain.interviewStage,
        scheduledAt: plain.scheduledAt,
        interviewerCount: Array.isArray(plain.interviewerRoster) ? plain.interviewerRoster.length : null,
      });
    }
  });

  const completedReviews = reviews.filter((review) => review.decision && review.decision !== 'pending');

  return {
    upcomingCount: upcoming.length,
    upcoming: upcoming.slice(0, 6),
    averageDurationMinutes: durations.length ? Number(average(durations)) : null,
    averageLeadTimeHours: leadTimes.length ? Number(average(leadTimes).toFixed(1)) : null,
    rescheduleRate: schedules.length ? percentage(reschedules, schedules.length) : 0,
    feedbackLogged: completedReviews.length,
  };
}

function buildCandidateExperienceSummary({ surveys }) {
  if (!surveys.length) {
    return {
      responseCount: 0,
      averageScore: null,
      nps: null,
      sentiments: {},
      followUpsPending: 0,
      latestFeedback: [],
    };
  }

  const scores = [];
  let promoters = 0;
  let detractors = 0;
  const sentiments = new Map();
  let followUpsPending = 0;

  const latestFeedback = surveys
    .slice()
    .sort((a, b) => new Date(b.responseAt ?? b.createdAt ?? 0) - new Date(a.responseAt ?? a.createdAt ?? 0))
    .slice(0, 6)
    .map((survey) => {
      const plain = survey?.get ? survey.get({ plain: true }) : survey;
      return {
        id: plain.id,
        stage: plain.stage,
        score: plain.score,
        npsRating: plain.npsRating,
        sentiment: plain.sentiment,
        notes: plain.notes,
        responseAt: plain.responseAt,
      };
    });

  surveys.forEach((survey) => {
    const plain = survey?.get ? survey.get({ plain: true }) : survey;
    if (plain.score != null && Number.isFinite(Number(plain.score))) {
      scores.push(Number(plain.score));
    }
    if (plain.npsRating != null && Number.isFinite(Number(plain.npsRating))) {
      const rating = Number(plain.npsRating);
      if (rating >= 9) promoters += 1;
      else if (rating <= 6) detractors += 1;
    }
    const sentimentLabel = normalizeCategory(plain.sentiment);
    sentiments.set(sentimentLabel, (sentiments.get(sentimentLabel) ?? 0) + 1);
    if (plain.followUpScheduledAt && new Date(plain.followUpScheduledAt) > new Date()) {
      followUpsPending += 1;
    }
  });

  const totalResponses = surveys.length;
  const nps = totalResponses ? Number((((promoters - detractors) / totalResponses) * 100).toFixed(1)) : null;

  return {
    responseCount: totalResponses,
    averageScore: scores.length ? Number(average(scores).toFixed(1)) : null,
    nps,
    sentiments: Object.fromEntries(sentiments.entries()),
    followUpsPending,
    latestFeedback,
  };
}

function buildOfferAndOnboardingSummary({ offers, candidateExperience, interviewOperations, applications, alerts }) {
  const openOffers = Math.max((offers?.extended ?? 0) - (offers?.accepted ?? 0), 0);
  const rescheduleAlerts = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('schedule'));

  const startLeadTimes = applications
    .filter((application) => application.status === 'hired' && application.decisionAt && application.availabilityDate)
    .map((application) => {
      const decision = new Date(application.decisionAt);
      const availability = new Date(application.availabilityDate);
      if (Number.isNaN(decision.getTime()) || Number.isNaN(availability.getTime())) {
        return null;
      }
      const diff = (availability.getTime() - decision.getTime()) / (1000 * 60 * 60 * 24);
      return Number.isFinite(diff) ? diff : null;
    })
    .filter((value) => Number.isFinite(value));

  return {
    openOffers,
    acceptanceRate: offers?.winRate ?? 0,
    onboardingFollowUps: candidateExperience.followUpsPending ?? 0,
    interviewsToSchedule: interviewOperations.upcomingCount ?? 0,
    scheduleAlerts: rescheduleAlerts.length,
    averageDaysToStart: startLeadTimes.length ? Number(average(startLeadTimes).toFixed(1)) : null,
  };
}

function buildCandidateCareSummary({ candidateExperience, alerts }) {
  const escalations = alerts.items.filter((item) => normalizeCategory(item.category).toLowerCase().includes('experience'));

  return {
    satisfaction: candidateExperience.averageScore,
    nps: candidateExperience.nps,
    followUpsPending: candidateExperience.followUpsPending,
    escalations: escalations.length,
  };
}

function buildHeadhunterDashboardSummary({
  jobs,
  partnerApplications,
  interviewSchedules,
  commissions,
  applicantDirectory,
}) {
  const jobRecords = jobs.map((job) => (job?.get ? job.get({ plain: true }) : job));
  const interviewRecords = interviewSchedules.map((schedule) => (schedule?.get ? schedule.get({ plain: true }) : schedule));

  const applicationMap = new Map();
  const applicationByTarget = new Map();

  partnerApplications.forEach((application) => {
    applicationMap.set(application.id, application);
    const key = `${application.targetType}:${application.targetId}`;
    const entry = applicationByTarget.get(key) ?? {
      submissions: 0,
      hires: 0,
      partners: new Set(),
      latestSubmission: null,
    };
    entry.submissions += 1;
    if (application.status === 'hired') {
      entry.hires += 1;
    }
    const { partnerName } = extractPartnerInfo(application.metadata, {
      fallbackName: 'Agency partner',
      fallbackType: application.sourceChannel,
    });
    entry.partners.add(partnerName);
    const submittedAt = toDate(application.submittedAt ?? application.createdAt);
    if (submittedAt && (!entry.latestSubmission || submittedAt > entry.latestSubmission)) {
      entry.latestSubmission = submittedAt;
    }
    applicationByTarget.set(key, entry);
  });

  const jobBriefs = jobRecords
    .map((job) => {
      const summary = applicationByTarget.get(`job:${job.id}`) ?? {
        submissions: 0,
        hires: 0,
        partners: new Set(),
        latestSubmission: null,
      };
      return {
        id: job.id,
        title: job.title,
        location: job.location ?? 'Remote',
        submissions: summary.submissions,
        hires: summary.hires,
        partners: Array.from(summary.partners),
        lastSubmissionAt: summary.latestSubmission ? summary.latestSubmission.toISOString() : null,
        createdAt: job.createdAt,
      };
    })
    .filter((brief) => brief.submissions > 0 || differenceInDays(brief.createdAt) <= 45)
    .sort((a, b) => (b.submissions ?? 0) - (a.submissions ?? 0))
    .slice(0, 8);

  const candidateSubmissions = partnerApplications
    .map((application) => {
      const metadata = normaliseMetadata(application.metadata);
      const { partnerName, partnerType } = extractPartnerInfo(metadata, {
        fallbackName: 'Agency partner',
        fallbackType: application.sourceChannel,
      });
      const applicant = applicantDirectory.get(application.applicantId) ?? {};
      const candidateName =
        [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') ||
        applicant.email ||
        `Candidate ${application.applicantId}`;
      return {
        applicationId: application.id,
        candidateId: application.applicantId,
        candidateName,
        partnerName,
        partnerType,
        status: application.status,
        stage: metadata.stage ?? application.status,
        submittedAt: application.submittedAt ?? application.createdAt,
        rateExpectation: application.rateExpectation == null ? null : Number(application.rateExpectation),
      };
    })
    .sort((a, b) => new Date(b.submittedAt ?? 0) - new Date(a.submittedAt ?? 0))
    .slice(0, 12);

  const interviews = interviewRecords
    .filter((schedule) => applicationMap.has(schedule.applicationId))
    .map((schedule) => {
      const application = applicationMap.get(schedule.applicationId);
      const metadata = normaliseMetadata(schedule.metadata);
      const applicant = applicantDirectory.get(application.applicantId) ?? {};
      const candidateName =
        [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') ||
        applicant.email ||
        `Candidate ${application.applicantId}`;
      return {
        interviewId: schedule.id,
        applicationId: schedule.applicationId,
        stage: schedule.interviewStage,
        scheduledAt: schedule.scheduledAt,
        durationMinutes: schedule.durationMinutes,
        interviewerRoster: Array.isArray(schedule.interviewerRoster) ? schedule.interviewerRoster : [],
        candidateName,
        partnerName: extractPartnerInfo(application.metadata, {
          fallbackName: 'Agency partner',
          fallbackType: application.sourceChannel,
        }).partnerName,
        status: schedule.completedAt ? 'completed' : 'scheduled',
        rescheduleCount: schedule.rescheduleCount ?? 0,
        location: metadata.location ?? metadata.videoUrl ?? null,
      };
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const commissionEntries = commissions.map((commission) => {
    const plain = commission?.get ? commission.get({ plain: true }) : commission;
    const { partnerName, partnerType } = extractPartnerInfo(plain.metadata, {
      fallbackName: plain.partnerName,
      fallbackType: plain.partnerType,
    });
    return {
      id: plain.id,
      partnerName,
      partnerType,
      status: plain.status,
      dueDate: plain.dueDate,
      paidAt: plain.paidAt,
      invoiceNumber: plain.invoiceNumber ?? null,
      amountCents: plain.commissionAmountCents ?? 0,
      amount: centsToAmount(plain.commissionAmountCents ?? 0),
      currencyCode: plain.currencyCode ?? 'USD',
    };
  });

  const scorecards = candidateSubmissions
    .map((submission) => {
      const application = applicationMap.get(submission.applicationId);
      const metadata = normaliseMetadata(application?.metadata);
      if (!metadata.scorecardUrl && !metadata.scorecardId) {
        return null;
      }
      return {
        applicationId: submission.applicationId,
        candidateName: submission.candidateName,
        partnerName: submission.partnerName,
        scorecardId: metadata.scorecardId ?? null,
        scorecardUrl: metadata.scorecardUrl ?? null,
        updatedAt: application.updatedAt ?? application.createdAt,
        summary: metadata.scorecardSummary ?? null,
      };
    })
    .filter(Boolean)
    .slice(0, 8);

  const openBriefs = jobBriefs.length;
  const activeSubmissions = partnerApplications.filter(
    (application) => !['hired', 'rejected', 'withdrawn'].includes(application.status),
  ).length;
  const upcomingInterviews = interviews.filter((interview) => {
    const scheduled = toDate(interview.scheduledAt);
    return scheduled && scheduled > new Date();
  }).length;
  const commissionsDue = commissionEntries.filter((entry) => entry.status !== 'paid').length;
  const totalCommissionValue = centsToAmount(sumNumbers(commissionEntries.map((entry) => entry.amountCents)));
  const offersCount = partnerApplications.filter((application) =>
    ['offered', 'hired'].includes(application.status),
  ).length;
  const hiresCount = partnerApplications.filter((application) => application.status === 'hired').length;
  const fillRate = percentage(hiresCount, offersCount || partnerApplications.length || 1);

  return {
    stats: {
      openBriefs,
      activeSubmissions,
      interviewsScheduled: upcomingInterviews,
      commissionsDue,
      totalCommissionValue,
      fillRate,
    },
    jobBriefs,
    submissions: candidateSubmissions,
    interviews: interviews.slice(0, 12),
    commissions: commissionEntries.slice(0, 12),
    scorecards,
  };
}

function buildPartnerPerformanceManagerSummary({
  engagements,
  commissions,
  slaSnapshots,
  agreements,
  partnerApplications,
}) {
  const engagementRecords = engagements.map((engagement) => (engagement?.get ? engagement.get({ plain: true }) : engagement));
  const commissionRecords = commissions.map((commission) => (commission?.get ? commission.get({ plain: true }) : commission));
  const slaRecords = slaSnapshots.map((snapshot) => (snapshot?.get ? snapshot.get({ plain: true }) : snapshot));
  const agreementRecords = agreements.map((agreement) => (agreement?.get ? agreement.get({ plain: true }) : agreement));

  const keyFor = (partnerType, partnerName) => `${partnerType}:${partnerName}`;
  const volumeByPartner = new Map();

  partnerApplications.forEach((application) => {
    const metadata = normaliseMetadata(application.metadata);
    const { partnerName, partnerType } = extractPartnerInfo(metadata, {
      fallbackName: 'Agency partner',
      fallbackType: application.sourceChannel,
    });
    const key = keyFor(partnerType, partnerName);
    const entry = volumeByPartner.get(key) ?? {
      partnerName,
      partnerType,
      submissions: 0,
      hires: 0,
      offers: 0,
      revenueCents: 0,
    };
    entry.submissions += 1;
    if (application.status === 'hired') {
      entry.hires += 1;
    }
    if (application.status === 'offered' || application.status === 'hired') {
      entry.offers += 1;
    }
    entry.revenueCents += toCents(application.rateExpectation);
    volumeByPartner.set(key, entry);
  });

  const commissionByPartner = new Map();
  commissionRecords.forEach((record) => {
    const key = keyFor(record.partnerType, record.partnerName);
    commissionByPartner.set(key, (commissionByPartner.get(key) ?? 0) + (record.commissionAmountCents ?? 0));
  });

  const slaByPartner = new Map();
  slaRecords.forEach((record) => {
    const key = keyFor(record.partnerType, record.partnerName);
    const existing = slaByPartner.get(key) ?? [];
    existing.push(record);
    slaByPartner.set(key, existing);
  });

  const leaderboardKeys = new Set([
    ...engagementRecords.map((record) => keyFor(record.partnerType, record.partnerName)),
    ...volumeByPartner.keys(),
  ]);

  const leaderboard = Array.from(leaderboardKeys)
    .map((key) => {
      const [partnerType, partnerName] = key.split(':');
      const engagement = engagementRecords.find(
        (record) => keyFor(record.partnerType, record.partnerName) === key,
      ) ?? { touchpoints: 0, activeBriefs: 0, conversionRate: null };
      const volume = volumeByPartner.get(key) ?? {
        submissions: 0,
        hires: 0,
        offers: 0,
        revenueCents: 0,
      };
      const slaList = slaByPartner.get(key) ?? [];
      const latestSla = slaList[0] ?? null;
      const commissionLiabilityCents = commissionByPartner.get(key) ?? 0;

      const conversionRate = volume.submissions
        ? Number(((volume.hires / volume.submissions) * 100).toFixed(1))
        : engagement.conversionRate == null
        ? null
        : Number(engagement.conversionRate);

      const fillRate = volume.offers
        ? Number(((volume.hires / volume.offers) * 100).toFixed(1))
        : latestSla?.fillRate == null
        ? null
        : Number(latestSla.fillRate);

      return {
        name: partnerName,
        type: partnerType,
        touchpoints: engagement.touchpoints ?? volume.submissions ?? 0,
        activeBriefs: engagement.activeBriefs ?? 0,
        conversionRate,
        fillRate,
        submissionToInterviewHours:
          latestSla?.submissionToInterviewHours == null
            ? null
            : Number(Number(latestSla.submissionToInterviewHours).toFixed(1)),
        interviewToOfferHours:
          latestSla?.interviewToOfferHours == null
            ? null
            : Number(Number(latestSla.interviewToOfferHours).toFixed(1)),
        revenueContribution: centsToAmount(volume.revenueCents),
        commissionLiability: centsToAmount(commissionLiabilityCents),
      };
    })
    .sort((a, b) => b.revenueContribution - a.revenueContribution);

  const submissionToInterview = slaRecords
    .map((record) => Number(record.submissionToInterviewHours))
    .filter((value) => Number.isFinite(value));
  const interviewToOffer = slaRecords
    .map((record) => Number(record.interviewToOfferHours))
    .filter((value) => Number.isFinite(value));
  const fillRates = slaRecords
    .map((record) => Number(record.fillRate))
    .filter((value) => Number.isFinite(value));
  const complianceScores = slaRecords
    .map((record) => Number(record.complianceScore))
    .filter((value) => Number.isFinite(value));

  const totalCommissionCents = sumNumbers(commissionRecords.map((record) => record.commissionAmountCents));
  const totalRevenueCents = sumNumbers(Array.from(volumeByPartner.values()).map((entry) => entry.revenueCents));
  const roiPercentage =
    totalCommissionCents > 0
      ? Number((((totalRevenueCents - totalCommissionCents) / totalCommissionCents) * 100).toFixed(1))
      : null;

  const invoiceStatusCounts = commissionRecords.reduce((acc, record) => {
    const status = record.status ?? 'draft';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const renewalThreshold = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const renewals = agreementRecords
    .filter((record) => {
      const renewalDate = toDate(record.renewalDate);
      return (
        record.status === 'pending_renewal' ||
        (renewalDate && renewalDate >= new Date() && renewalDate <= renewalThreshold)
      );
    })
    .slice(0, 10)
    .map((record) => ({
      id: record.id,
      partnerName: record.partnerName,
      partnerType: record.partnerType,
      renewalDate: record.renewalDate,
      complianceStatus: record.complianceStatus,
    }));

  const terminated = agreementRecords
    .filter((record) => record.status === 'terminated' || record.status === 'suspended')
    .slice(0, 5)
    .map((record) => ({
      id: record.id,
      partnerName: record.partnerName,
      partnerType: record.partnerType,
      status: record.status,
      terminatedAt: record.endDate ?? record.updatedAt ?? null,
    }));

  return {
    leaderboard: leaderboard.slice(0, 10),
    sla: {
      averages: {
        submissionToInterviewHours: submissionToInterview.length ? Number(average(submissionToInterview)) : null,
        interviewToOfferHours: interviewToOffer.length ? Number(average(interviewToOffer)) : null,
        fillRate: fillRates.length ? Number(average(fillRates)) : null,
        complianceScore: complianceScores.length ? Number(average(complianceScores)) : null,
      },
      snapshots: slaRecords.slice(0, 8).map((record) => ({
        partnerName: record.partnerName,
        partnerType: record.partnerType,
        reportingPeriodStart: record.reportingPeriodStart,
        reportingPeriodEnd: record.reportingPeriodEnd,
        submissionToInterviewHours:
          record.submissionToInterviewHours == null ? null : Number(record.submissionToInterviewHours),
        interviewToOfferHours:
          record.interviewToOfferHours == null ? null : Number(record.interviewToOfferHours),
        fillRate: record.fillRate == null ? null : Number(record.fillRate),
        complianceScore: record.complianceScore == null ? null : Number(record.complianceScore),
        escalations: record.escalations ?? 0,
      })),
    },
    roi: {
      totalCommission: centsToAmount(totalCommissionCents),
      totalRevenue: centsToAmount(totalRevenueCents),
      roiPercentage,
      invoiceStatusCounts,
    },
    agreements: {
      total: agreementRecords.length,
      active: agreementRecords.filter((record) => record.status === 'active').length,
      renewals,
      terminated,
    },
  };
}

function buildCollaborationSuiteSummary({ partnerThreads, collaborationEvents, notes }) {
  const threadRecords = partnerThreads.map((thread) => (thread?.get ? thread.get({ plain: true }) : thread));
  const eventRecords = collaborationEvents.map((event) => (event?.get ? event.get({ plain: true }) : event));
  const noteRecords = notes.map((note) => (note?.get ? note.get({ plain: true }) : note));

  const threads = threadRecords.map((thread) => {
    const messages = [...(thread.messages ?? [])]
      .map((message) => (message?.get ? message.get({ plain: true }) : message))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const lastMessage = messages.at(-1) ?? null;
    const inboundReplies = messages.filter(
      (message) => normaliseMetadata(message.metadata).direction === 'inbound',
    ).length;
    const awaitingResponse =
      lastMessage && normaliseMetadata(lastMessage.metadata).direction === 'outbound' && !lastMessage.deliveredAt;
    return {
      threadId: thread.id,
      subject: thread.subject ?? 'Partner collaboration',
      channel: thread.channelType ?? 'direct',
      lastMessageAt: thread.lastMessageAt ?? lastMessage?.createdAt ?? null,
      totalMessages: messages.length,
      inboundReplies,
      awaitingResponse: Boolean(awaitingResponse),
    };
  });

  const messageCount = sumNumbers(threads.map((thread) => thread.totalMessages));
  const awaitingResponses = threads.filter((thread) => thread.awaitingResponse).length;
  const filesShared = eventRecords.filter((event) => event.eventType === 'file').length;
  const decisionThreads = eventRecords.filter((event) => event.eventType === 'decision').length;
  const escalationsOpen = eventRecords.filter((event) => {
    if (event.eventType !== 'escalation') {
      return false;
    }
    const metadata = normaliseMetadata(event.metadata);
    return !metadata.resolvedAt;
  }).length;

  const latestActivity = eventRecords
    .slice()
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 10)
    .map((event) => ({
      id: event.id,
      partnerName: event.partnerName,
      partnerType: event.partnerType,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      actorName: event.actorName ?? null,
      summary: normaliseMetadata(event.metadata).summary ?? null,
    }));

  const scorecards = eventRecords
    .filter((event) => event.eventType === 'scorecard')
    .slice(0, 8)
    .map((event) => {
      const metadata = normaliseMetadata(event.metadata);
      return {
        id: event.id,
        partnerName: event.partnerName,
        candidateName: metadata.candidateName ?? metadata.candidateEmail ?? null,
        scorecardUrl: metadata.url ?? metadata.link ?? null,
        status: metadata.status ?? 'shared',
        sharedAt: event.occurredAt,
      };
    });

  const noteHighlights = noteRecords.slice(0, 6).map((note) => {
    const authorName = [note.author?.firstName, note.author?.lastName].filter(Boolean).join(' ');
    const subjectName = [note.subject?.firstName, note.subject?.lastName].filter(Boolean).join(' ');
    return {
      id: note.id,
      note: note.note,
      authorName: authorName || 'Unknown author',
      subjectName: subjectName || 'Partner contact',
      createdAt: note.createdAt,
      visibility: note.visibility,
    };
  });

  return {
    activeThreads: threadRecords.length,
    messageCount,
    awaitingResponses,
    filesShared,
    decisionThreads,
    escalationsOpen,
    latestActivity,
    threads: threads.slice(0, 10),
    scorecards,
    notes: noteHighlights,
  };
}

function buildPartnerCalendarCommunicationsSummary({
  calendarEvents,
  interviewSchedules,
  collaborationEvents,
  partnerApplications,
  commissions,
}) {
  const calendarRecords = calendarEvents.map((event) => (event?.get ? event.get({ plain: true }) : event));
  const interviewRecords = interviewSchedules.map((schedule) => (schedule?.get ? schedule.get({ plain: true }) : schedule));
  const eventRecords = collaborationEvents.map((event) => (event?.get ? event.get({ plain: true }) : event));
  const partnerApplicationIds = new Set(partnerApplications.map((application) => application.id));

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = calendarRecords
    .filter((event) => {
      const start = toDate(event.startsAt);
      return start && start >= now;
    })
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, 8);

  const eventsThisWeek = calendarRecords.filter((event) => {
    const start = toDate(event.startsAt);
    return start && start >= now && start <= weekAhead;
  });

  const loadByDay = new Map();
  interviewRecords
    .filter((schedule) => partnerApplicationIds.has(schedule.applicationId))
    .forEach((schedule) => {
      const start = toDate(schedule.scheduledAt);
      if (!start) {
        return;
      }
      const key = start.toISOString().slice(0, 10);
      const entry = loadByDay.get(key) ?? { date: key, interviews: 0, escalations: 0 };
      entry.interviews += 1;
      loadByDay.set(key, entry);
    });

  const escalationEvents = eventRecords.filter((event) => event.eventType === 'escalation');
  escalationEvents.forEach((event) => {
    const occurred = toDate(event.occurredAt);
    if (!occurred) {
      return;
    }
    const key = occurred.toISOString().slice(0, 10);
    const entry = loadByDay.get(key) ?? { date: key, interviews: 0, escalations: 0 };
    entry.escalations += 1;
    loadByDay.set(key, entry);
  });

  const interviewLoad = Array.from(loadByDay.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  const integrationSources = new Set(
    eventRecords
      .map((event) => normaliseMetadata(event.metadata).integration)
      .filter((value) => value && `${value}`.trim().length)
      .map((value) => `${value}`.toLowerCase()),
  );

  const integrationStatus = {
    hris: integrationSources.has('hris'),
    slack: integrationSources.has('slack'),
    email: integrationSources.has('email') || integrationSources.has('outlook') || integrationSources.has('gmail'),
    gigvoraMessaging: true,
  };

  const commissionsDueSoon = commissions
    .map((commission) => (commission?.get ? commission.get({ plain: true }) : commission))
    .filter((record) => {
      if (record.status === 'paid') {
        return false;
      }
      const dueDate = toDate(record.dueDate);
      if (!dueDate) {
        return false;
      }
      const days = differenceInDays(dueDate, now);
      return days != null && days >= 0 && days <= 7;
    }).length;

  const pendingEscalations = escalationEvents.filter((event) => !normaliseMetadata(event.metadata).resolvedAt).length;

  const weeklyDigest = {
    nextSendAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    highlights: [
      `Partner interviews scheduled this week: ${interviewRecords.filter((schedule) => partnerApplicationIds.has(schedule.applicationId)).length}`,
      `Upcoming recruiting events this week: ${eventsThisWeek.length}`,
      `Open partner escalations: ${pendingEscalations}`,
      `Commissions due within 7 days: ${commissionsDueSoon}`,
    ],
  };

  return {
    eventsThisWeek: eventsThisWeek.length,
    upcoming,
    interviewLoad,
    integrations: integrationStatus,
    pendingEscalations,
    weeklyDigest,
  };
}

function buildPartnerCollaborationSummary({
  partnerSummary,
  engagements,
  partnerApplications,
  jobs,
  interviewSchedules,
  commissions,
  slaSnapshots,
  agreements,
  collaborationEvents,
  partnerThreads,
  notes,
  applicantDirectory,
  calendarEvents,
}) {
  const headhunterDashboard = buildHeadhunterDashboardSummary({
    jobs,
    partnerApplications,
    interviewSchedules,
    commissions,
    applicantDirectory,
  });

  const partnerPerformanceManager = buildPartnerPerformanceManagerSummary({
    engagements,
    commissions,
    slaSnapshots,
    agreements,
    partnerApplications,
  });

  const collaborationSuite = buildCollaborationSuiteSummary({
    partnerThreads,
    collaborationEvents,
    notes,
  });

  const calendarCommunications = buildPartnerCalendarCommunicationsSummary({
    calendarEvents,
    interviewSchedules,
    collaborationEvents,
    partnerApplications,
    commissions,
  });

  return {
    overview: {
      engagedContacts: partnerSummary?.engagedContacts ?? 0,
      touchpoints: partnerSummary?.touchpoints ?? 0,
      pendingInvites: partnerSummary?.pendingInvites ?? 0,
      activePartners: partnerPerformanceManager.leaderboard.length,
      totalCommissionLiability: partnerPerformanceManager.roi.totalCommission ?? 0,
    },
    headhunterDashboard,
    partnerPerformanceManager,
    collaborationSuite,
    calendarCommunications,
  };
}

function buildBrandIntelligenceSummary({ profile, assets, jobSummary }) {
  const publishedAssets = assets.filter((asset) => asset.status === 'published');
  const engagementScores = publishedAssets
    .map((asset) => (asset.engagementScore == null ? null : Number(asset.engagementScore)))
    .filter((value) => Number.isFinite(value));

  const profileCompleteness = (() => {
    if (!profile) return 0;
    const fields = ['companyName', 'description', 'website'];
    const completed = fields.reduce((count, field) => (profile[field] ? count + 1 : count), 0);
    return Number(((completed / fields.length) * 100).toFixed(0));
  })();

  return {
    publishedAssets: publishedAssets.length,
    averageEngagementScore: engagementScores.length ? Number(average(engagementScores).toFixed(1)) : null,
    profileCompleteness,
    activeRoles: jobSummary?.total ?? 0,
    assets: publishedAssets.slice(0, 6).map((asset) => ({
      id: asset.id,
      title: asset.title,
      assetType: asset.assetType,
      url: asset.url,
      engagementScore: asset.engagementScore,
      publishedAt: asset.publishedAt,
    })),
  };
}

function buildGovernanceSummary({ approvals, alerts, workspace }) {
  const pendingApprovals = approvals.filter((item) => ['pending', 'in_review'].includes(item.status));
  const criticalAlerts = alerts.items.filter((item) => item.severity === 'critical');

  return {
    pendingApprovals: pendingApprovals.length,
    criticalAlerts: criticalAlerts.length,
    workspaceActive: Boolean(workspace?.isActive),
    timezone: workspace?.timezone ?? null,
  };
}

function buildCalendarDigest(events) {
  if (!events.length) {
    return { upcoming: [], eventCount: 0 };
  }

  const upcoming = events
    .map((event) => (event?.get ? event.get({ plain: true }) : event))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .filter((event) => new Date(event.endsAt ?? event.startsAt) >= new Date())
    .map((event) => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
    }));

  return {
    eventCount: events.length,
    upcoming: upcoming.slice(0, 8),
  };
}

function buildMemberships(workspace) {
  return [
    {
      name: 'Company',
      active: Boolean(workspace?.isActive),
      description: 'Full access to hiring operations, analytics, and governance controls.',
    },
    {
      name: 'Headhunter',
      active: true,
      description: 'Collaborate with agencies and external recruiters on shared briefs.',
    },
    {
      name: 'User & Job Seeker',
      active: true,
      description: 'Talent community experience for employees, referrals, and alumni.',
    },
  ];
}

async function listAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 25,
  });
  return workspaces.map((workspace) => workspace.get({ plain: true }));
}

export async function getCompanyDashboard({ workspaceId, workspaceSlug, lookbackDays } = {}) {
  const selector = resolveWorkspaceSelector({ workspaceId, workspaceSlug });
  const lookback = clamp(lookbackDays, {
    min: MIN_LOOKBACK_DAYS,
    max: MAX_LOOKBACK_DAYS,
    fallback: 30,
  });

  const cacheKey = buildCacheKey(CACHE_NAMESPACE, { selector, lookback });

  return appCache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const workspace = await fetchWorkspace(selector);
    const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

    const [members, invites, notes, companyProfile, availableWorkspaces] = await Promise.all([
      fetchMembers(workspace.id),
      fetchInvites(workspace.id),
      fetchNotes(workspace.id),
      CompanyProfile.findOne({ where: { userId: workspace.ownerId } }),
      listAvailableWorkspaces(),
    ]);

    const [
      applications,
      jobs,
      gigs,
      projects,
      jobStages,
      jobApprovals,
      jobCampaigns,
      interviewSchedules,
      hiringAlerts,
      candidateSurveys,
      partnerEngagements,
      calendarEvents,
      brandAssets,
      partnerCommissions,
      partnerSlaSnapshots,
      partnerAgreements,
      partnerCollaborationEvents,
      partnerThreads,
    ] = await Promise.all([
      fetchApplications({ workspaceId: workspace.id, since }),
      fetchJobs({ since }),
      fetchGigs({ since }),
      fetchProjects({ workspaceId: workspace.id, since }),
      fetchJobStagesData({ workspaceId: workspace.id }),
      fetchJobApprovals({ workspaceId: workspace.id, since }),
      fetchJobCampaigns({ workspaceId: workspace.id, since }),
      fetchInterviewSchedules({ workspaceId: workspace.id, since }),
      fetchHiringAlerts({ workspaceId: workspace.id, since }),
      fetchCandidateSurveys({ workspaceId: workspace.id, since }),
      fetchPartnerEngagements({ workspaceId: workspace.id, since }),
      fetchCalendarEvents({ workspaceId: workspace.id, since }),
      fetchBrandAssets({ workspaceId: workspace.id }),
      fetchPartnerCommissions({ workspaceId: workspace.id, since }),
      fetchPartnerSlaSnapshots({ workspaceId: workspace.id, since }),
      fetchPartnerAgreements({ workspaceId: workspace.id }),
      fetchPartnerCollaborationEvents({ workspaceId: workspace.id, since }),
      fetchPartnerThreads({ workspaceId: workspace.id, since }),
    ]);

    const applicationIds = applications.map((application) => application.id);
    const [reviews, demographicSnapshots] = await Promise.all([
      fetchApplicationReviews({ applicationIds, since }),
      fetchCandidateSnapshots({ workspaceId: workspace.id, applicationIds, since }),
    ]);

    const partnerApplications = applications.filter((application) => {
      const metadata = normaliseMetadata(application.metadata);
      return (
        application.sourceChannel === 'agency' ||
        Boolean(
          metadata.partnerName ||
            metadata.agencyName ||
            metadata.headhunterName ||
            metadata.partnerWorkspaceId ||
            metadata.agencyWorkspaceId,
        )
      );
    });

    const applicantDirectory = await loadApplicants(partnerApplications);

    const memberSummary = buildMemberSummary(members);
    const inviteSummary = buildInviteSummary(invites);
    const jobSummary = buildJobSummary({ jobs, gigs });
    const pipelineSummary = buildPipelineSummary(applications);
    const projectSummary = buildProjectSummary(projects);
    const badges = deriveWorkspaceBadges({ memberSummary, pipelineSummary, projectSummary });

    const reviewScores = reviews.map((review) => (review.score == null ? null : Number(review.score))).filter((score) =>
      Number.isFinite(score),
    );

    const profile = sanitizeProfile(companyProfile);

    const workspaceSummary = sanitiseWorkspace(workspace, memberSummary, inviteSummary, badges);
    const memberships = buildMemberships(workspaceSummary);
    const recommendations = buildRecommendations({ memberSummary, pipelineSummary, inviteSummary });

    const partnerContactIds = new Set(notes.map((note) => note.subjectUserId));

    const partnerSummary = {
      engagedContacts: partnerContactIds.size,
      touchpoints: notes.length,
      pendingInvites: inviteSummary.pending,
      activeMembers: memberSummary.active,
    };

    const recentNotes = buildRecentNotes(notes);

    const offersAccepted = pipelineSummary.totals.hires;
    const offersExtended = pipelineSummary.totals.offers;
    const offers = {
      accepted: offersAccepted,
      extended: offersExtended,
      winRate: percentage(offersAccepted, offersExtended || pipelineSummary.totals.applications || 1),
    };

    const diversityMetrics = buildDiversityMetrics(demographicSnapshots);
    const alertsSummary = buildAlertsSummary(hiringAlerts);
    const interviewOperations = buildInterviewOperationsSummary({ schedules: interviewSchedules, reviews });
    const candidateExperience = buildCandidateExperienceSummary({ surveys: candidateSurveys });
    const jobLifecycle = buildJobLifecycleInsights({
      jobStages,
      approvals: jobApprovals,
      campaigns: jobCampaigns,
      pipelineSummary,
      jobSummary,
    });
    const jobDesign = buildJobDesignStudioSummary({
      approvals: jobApprovals,
      jobStages,
      jobSummary,
      alerts: alertsSummary,
    });
    const sourcing = buildSourcingSummary({ pipelineSummary, campaigns: jobCampaigns });
    const applicantRelationshipManager = buildApplicantRelationshipManagerSummary({
      surveys: candidateSurveys,
      pipelineSummary,
      partnerSummary,
    });
    const analyticsForecasting = buildAnalyticsForecastingSummary({ pipelineSummary, jobSummary, projectSummary });
    const partnerCollaborationDetails = buildPartnerCollaborationSummary({
      partnerSummary,
      engagements: partnerEngagements,
      partnerApplications,
      jobs,
      interviewSchedules,
      commissions: partnerCommissions,
      slaSnapshots: partnerSlaSnapshots,
      agreements: partnerAgreements,
      collaborationEvents: partnerCollaborationEvents,
      partnerThreads,
      notes,
      applicantDirectory,
      calendarEvents,
    });
    const plainBrandAssets = brandAssets.map((asset) => (asset?.get ? asset.get({ plain: true }) : asset));
    const brandIntelligence = buildBrandIntelligenceSummary({ profile, assets: plainBrandAssets, jobSummary });
    const governance = buildGovernanceSummary({ approvals: jobApprovals, alerts: alertsSummary, workspace: workspaceSummary });
    const calendarDigest = buildCalendarDigest(calendarEvents);
    const offerOnboarding = buildOfferAndOnboardingSummary({
      offers,
      candidateExperience,
      interviewOperations,
      applications,
      alerts: alertsSummary,
    });
    const candidateCare = buildCandidateCareSummary({ candidateExperience, alerts: alertsSummary });

    const insights = {
      averageReviewScore: reviewScores.length ? average(reviewScores) : null,
      reviewSampleSize: reviewScores.length,
      candidateSources: pipelineSummary.bySource,
      topLocations: jobSummary.topLocations,
      diversityIndex: diversityMetrics.representationIndex,
      candidateNps: candidateExperience.nps,
    };

    return {
      meta: {
        lookbackDays: lookback,
        selectedWorkspaceId: workspace.id,
        availableWorkspaces,
        memberships,
      },
      workspace: workspaceSummary,
      profile,
      memberSummary,
      inviteSummary,
      jobSummary,
      pipelineSummary,
      projectSummary,
      partnerSummary,
      insights,
      diversity: diversityMetrics,
      alerts: alertsSummary,
      jobLifecycle,
      jobDesign,
      sourcing,
      applicantRelationshipManager,
      analyticsForecasting,
      interviewOperations,
      candidateExperience,
      offerOnboarding,
      candidateCare,
      partnerCollaboration: partnerCollaborationDetails,
      brandIntelligence,
      governance,
      calendar: calendarDigest,
      reviews: {
        total: reviews.length,
        averageScore: insights.averageReviewScore,
      },
      offers,
      recommendations,
      memberships,
      recentNotes,
      generatedAt: new Date().toISOString(),
    };
  });
}

export default {
  getCompanyDashboard,
};

