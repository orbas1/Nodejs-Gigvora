import { Op } from 'sequelize';
import {
  sequelize,
  ProviderWorkspace,
  ProviderWorkspaceMember,
  Job,
  JobAdvert,
  JobFavorite,
  JobKeyword,
  JobAdvertHistory,
  JobCandidateResponse,
  JobCandidateNote,
  Application,
  InterviewSchedule,
  JobStage,
  JobApprovalWorkflow,
  JobCampaignPerformance,
  User,
  Profile,
  APPLICATION_STATUSES,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_LOOKBACK_DAYS = 90;
const MIN_LOOKBACK_DAYS = 7;
const MAX_LOOKBACK_DAYS = 365;

const JOB_STATUS_OPTIONS = Object.freeze([
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]);

const REMOTE_TYPE_OPTIONS = Object.freeze([
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]);

const APPLICATION_STATUS_OPTIONS = APPLICATION_STATUSES.map((status) => ({
  value: status,
  label: status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' '),
}));

function clamp(value, { min, max, fallback }) {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(Math.max(numeric, min), max);
}

function normaliseNumber(value, { fallback = null } = {}) {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
}

function parseWorkspaceSelector({ workspaceId, workspaceSlug }) {
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

async function fetchWorkspace(selector) {
  const workspace = await ProviderWorkspace.findOne({
    where: {
      type: 'company',
      ...(selector.id ? { id: selector.id } : {}),
      ...(selector.slug ? { slug: selector.slug } : {}),
    },
    include: [
      {
        model: ProviderWorkspaceMember,
        as: 'members',
        required: false,
        attributes: ['id'],
      },
    ],
  });
  if (!workspace) {
    throw new NotFoundError('Company workspace not found.');
  }
  return workspace;
}

async function listAvailableWorkspaces() {
  const workspaces = await ProviderWorkspace.findAll({
    where: { type: 'company' },
    attributes: ['id', 'name', 'slug'],
    order: [['name', 'ASC']],
    limit: 25,
  });
  return workspaces.map((record) => record.get({ plain: true }));
}

function toPlain(record) {
  return record?.get ? record.get({ plain: true }) : record ?? null;
}

function buildKeywordMatches(keywords, applicationsForJob) {
  const keywordList = (keywords ?? []).map((entry) =>
    typeof entry === 'string'
      ? entry.trim().toLowerCase()
      : `${entry?.keyword ?? ''}`.trim().toLowerCase(),
  ).filter(Boolean);
  if (!keywordList.length) {
    return [];
  }
  const uniqueKeywords = Array.from(new Set(keywordList));
  const matches = [];
  applicationsForJob.forEach((application) => {
    const applicant = application.applicant ?? {};
    const profile = applicant.Profile ?? {};
    const searchable = [
      applicant.firstName,
      applicant.lastName,
      applicant.email,
      profile.headline,
      profile.bio,
      profile.skills,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!searchable) {
      return;
    }
    const matchedKeywords = uniqueKeywords.filter((keyword) => searchable.includes(keyword));
    if (!matchedKeywords.length) {
      return;
    }
    const score = Number((matchedKeywords.length / uniqueKeywords.length).toFixed(2));
    matches.push({
      applicationId: application.id,
      candidateId: applicant.id ?? null,
      candidateName: [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') || applicant.email,
      matchedKeywords,
      score,
    });
  });
  return matches.sort((a, b) => b.score - a.score).slice(0, 10);
}

function buildKanbanColumns(applications, jobMap) {
  const columns = APPLICATION_STATUS_OPTIONS.map((option) => ({
    status: option.value,
    label: option.label,
    applications: [],
  }));
  const columnByStatus = new Map(columns.map((column) => [column.status, column]));
  applications.forEach((application) => {
    const column = columnByStatus.get(application.status) ?? columnByStatus.get('submitted');
    if (!column) {
      return;
    }
    const job = jobMap.get(application.targetId ?? application.jobId ?? null);
    const applicant = application.applicant ?? {};
    column.applications.push({
      id: application.id,
      jobId: application.targetId,
      jobTitle: job?.job?.title ?? job?.title ?? null,
      submittedAt: application.submittedAt ?? application.createdAt ?? null,
      status: application.status,
      candidateName: [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') || applicant.email,
      candidateId: applicant.id ?? null,
    });
  });
  columns.forEach((column) => {
    column.applications.sort((a, b) => {
      const left = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const right = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return right - left;
    });
  });
  return columns;
}

const APPLICATION_FUNNEL = [
  { status: 'applied', label: 'Applied', matches: ['submitted', 'applied', 'new'] },
  { status: 'screen', label: 'Screen', matches: ['screen', 'phone', 'review'] },
  { status: 'assessment', label: 'Assessment', matches: ['assessment', 'challenge', 'test'] },
  { status: 'interview', label: 'Interview', matches: ['interview', 'onsite', 'panel'] },
  { status: 'offer', label: 'Offer', matches: ['offer', 'extend', 'sign'] },
  { status: 'hired', label: 'Hired', matches: ['hire', 'accepted', 'placed'] },
];

function toTimestamp(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

function hoursBetween(later, earlier) {
  const start = toTimestamp(earlier);
  const end = toTimestamp(later);
  if (start == null || end == null) {
    return null;
  }
  return (end - start) / (1000 * 60 * 60);
}

function average(values) {
  if (!values?.length) {
    return null;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function median(values) {
  if (!values?.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function normaliseDepartment(advert) {
  return advert?.metadata?.department ?? advert?.job?.metadata?.department ?? null;
}

function buildPipelineTrend(applications, lookbackDays) {
  if (!applications?.length) {
    return [];
  }
  const now = Date.now();
  const windowMs = Math.max(lookbackDays || DEFAULT_LOOKBACK_DAYS, 7) * 24 * 60 * 60 * 1000;
  const earliest = now - windowMs;
  const bucketSpan = Math.max(Math.floor((lookbackDays || DEFAULT_LOOKBACK_DAYS) / 8), 7) * 24 * 60 * 60 * 1000;
  const bucketMap = new Map();
  applications.forEach((application) => {
    const submitted = toTimestamp(application.submittedAt ?? application.createdAt);
    if (submitted == null || submitted < earliest) {
      return;
    }
    const bucketKey = Math.floor((submitted - earliest) / bucketSpan);
    const bucketStart = earliest + bucketKey * bucketSpan;
    const key = Number.isFinite(bucketStart) ? bucketStart : earliest;
    const entry = bucketMap.get(key) ?? { value: 0, label: new Date(key).toLocaleDateString() };
    entry.value += 1;
    bucketMap.set(key, entry);
  });
  return Array.from(bucketMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, entry]) => ({ label: entry.label, value: entry.value }));
}

function buildFunnel(applications) {
  if (!applications?.length) {
    return [];
  }
  const total = applications.length;
  let previousCount = total;
  return APPLICATION_FUNNEL.map((stage) => {
    const count = applications.filter((application) => {
      const status = (application.status ?? '').toLowerCase();
      return stage.matches.some((match) => status.includes(match));
    }).length;
    const cumulativeConversion = total ? (count / total) * 100 : 0;
    const conversionFromPrevious = previousCount ? (count / previousCount) * 100 : 0;
    previousCount = count || previousCount;
    return {
      status: stage.status,
      label: stage.label,
      count,
      cumulativeConversion: Number(cumulativeConversion.toFixed(1)),
      conversionFromPrevious: Number(conversionFromPrevious.toFixed(1)),
    };
  }).filter((stage) => stage.count > 0 || stage.status === 'applied');
}

function buildStagePerformance(jobStages, applications) {
  if (!jobStages?.length) {
    return [];
  }
  return jobStages.map((stage) => {
    const stageKey = (stage.name ?? stage.metadata?.key ?? '').toLowerCase();
    const relatedApplications = applications.filter((application) => {
      const status = (application.status ?? '').toLowerCase();
      if (!stageKey) {
        return false;
      }
      return status.includes(stageKey);
    });
    const total = relatedApplications.length;
    const rejected = relatedApplications.filter((application) =>
      (application.status ?? '').toLowerCase().includes('reject'),
    ).length;
    const holds = relatedApplications.filter((application) =>
      (application.status ?? '').toLowerCase().includes('hold'),
    ).length;
    const advanced = relatedApplications.filter((application) =>
      (application.status ?? '').toLowerCase().includes('offer') ||
      (application.status ?? '').toLowerCase().includes('hire'),
    ).length;
    const pendingReviews = relatedApplications.filter((application) =>
      (application.status ?? '').toLowerCase().includes('pending') ||
      (application.status ?? '').toLowerCase().includes('review'),
    ).length;
    const durations = relatedApplications
      .map((application) => hoursBetween(application.decisionAt ?? application.updatedAt, application.submittedAt))
      .filter((value) => Number.isFinite(value));
    const stageAdvanceRate = total ? Number(((advanced / total) * 100).toFixed(1)) : 0;
    const stageRejectRate = total ? Number(((rejected / total) * 100).toFixed(1)) : 0;
    const stageHoldRate = total ? Number(((holds / total) * 100).toFixed(1)) : 0;

    const averageDurationHours = stage.averageDurationHours != null
      ? Number(stage.averageDurationHours)
      : durations.length
        ? Number(average(durations).toFixed(1))
        : null;

    const medianDecisionHours = durations.length ? Number(median(durations).toFixed(1)) : null;
    const slaHours = stage.slaHours != null ? Number(stage.slaHours) : null;
    const actualHours = averageDurationHours;
    const slaDelta = slaHours != null && actualHours != null ? Number((actualHours - slaHours).toFixed(1)) : null;

    return {
      id: stage.id,
      label: stage.name,
      orderIndex: stage.orderIndex,
      slaHours,
      averageDurationHours,
      medianDecisionHours,
      advanceRate: stageAdvanceRate,
      rejectionRate: stageRejectRate,
      holdRate: stageHoldRate,
      pendingReviews,
      throughput: total,
      progress: stageAdvanceRate,
      actualHours,
      slaDelta,
    };
  });
}

function buildApprovalSummary(workflows) {
  if (!workflows?.length) {
    return { pending: 0, overdue: 0, items: [] };
  }
  const items = workflows
    .filter((workflow) => workflow.status !== 'approved' && workflow.status !== 'rejected')
    .map((workflow) => {
      const dueAt = workflow.dueAt ?? workflow.metadata?.dueAt ?? null;
      const createdAt = workflow.createdAt ?? workflow.metadata?.createdAt ?? null;
      const isOverdue = !workflow.completedAt && dueAt != null && toTimestamp(dueAt) < Date.now();
      return {
        id: workflow.id,
        approverRole: workflow.approverRole ?? 'Approver',
        status: workflow.status ?? 'pending',
        createdAt,
        dueAt,
        isOverdue,
      };
    });
  return {
    pending: items.length,
    overdue: items.filter((item) => item.isOverdue).length,
    items: items.sort((a, b) => {
      const left = toTimestamp(a.dueAt ?? a.createdAt) ?? 0;
      const right = toTimestamp(b.dueAt ?? b.createdAt) ?? 0;
      return left - right;
    }).slice(0, 12),
  };
}

function buildCampaignInsights(campaigns) {
  if (!campaigns?.length) {
    return {
      totalSpend: 0,
      averageCostPerApplication: null,
      topChannels: [],
    };
  }
  const byChannel = new Map();
  campaigns.forEach((entry) => {
    const channelKey = entry.channel ?? 'channel';
    const stats = byChannel.get(channelKey) ?? {
      channel: channelKey,
      impressions: 0,
      clicks: 0,
      applications: 0,
      hires: 0,
      spend: 0,
    };
    stats.impressions += Number(entry.impressions ?? 0);
    stats.clicks += Number(entry.clicks ?? 0);
    stats.applications += Number(entry.applications ?? 0);
    stats.hires += Number(entry.hires ?? 0);
    stats.spend += Number(entry.spendAmount ?? 0);
    byChannel.set(channelKey, stats);
  });
  const channels = Array.from(byChannel.values()).map((channel) => {
    const conversionRate = channel.applications ? (channel.hires / channel.applications) * 100 : 0;
    return {
      channel: channel.channel,
      impressions: channel.impressions,
      clicks: channel.clicks,
      applications: channel.applications,
      hires: channel.hires,
      spend: channel.spend,
      conversionRate: Number(conversionRate.toFixed(1)),
    };
  });
  const totalSpend = channels.reduce((total, channel) => total + channel.spend, 0);
  const totalApplications = channels.reduce((total, channel) => total + channel.applications, 0);
  const averageCostPerApplication = totalApplications ? Number((totalSpend / totalApplications).toFixed(2)) : null;
  channels.sort((a, b) => (b.applications || 0) - (a.applications || 0));
  return {
    totalSpend,
    averageCostPerApplication,
    topChannels: channels.slice(0, 6),
  };
}

function buildCandidateExperience({ applications, responses, notes, jobAdverts }) {
  const npsResponses = responses
    .map((response) => {
      const score = response.metadata?.npsScore ?? response.metadata?.nps ?? null;
      return Number.isFinite(Number(score)) ? Number(score) : null;
    })
    .filter((value) => value != null);
  let promoters = 0;
  let detractors = 0;
  npsResponses.forEach((score) => {
    if (score >= 9) promoters += 1;
    else if (score <= 6) detractors += 1;
  });
  const nps = npsResponses.length ? Number((((promoters - detractors) / npsResponses.length) * 100).toFixed(1)) : null;

  const experienceScores = responses
    .map((response) => {
      const score = response.metadata?.experienceScore ?? response.metadata?.satisfactionScore ?? null;
      return Number.isFinite(Number(score)) ? Number(score) : null;
    })
    .filter((value) => value != null);

  const inclusionScores = responses
    .map((response) => {
      const score = response.metadata?.inclusionScore ?? response.metadata?.fairnessScore ?? null;
      return Number.isFinite(Number(score)) ? Number(score) : null;
    })
    .filter((value) => value != null);

  const trend = buildPipelineTrend(applications, DEFAULT_LOOKBACK_DAYS);

  const departments = jobAdverts
    .map((advert) => normaliseDepartment(advert))
    .filter(Boolean);

  const departmentStats = new Map();
  applications.forEach((application) => {
    const advert = jobAdverts.find((entry) => entry.jobId === application.jobId);
    const department = normaliseDepartment(advert) ?? 'General';
    const stats = departmentStats.get(department) ?? { department, applications: 0, hires: 0, offers: 0 };
    stats.applications += 1;
    if ((application.status ?? '').toLowerCase().includes('offer')) {
      stats.offers += 1;
    }
    if ((application.status ?? '').toLowerCase().includes('hire')) {
      stats.hires += 1;
    }
    departmentStats.set(department, stats);
  });

  const departmentSegments = Array.from(departmentStats.values()).map((entry) => {
    const score = entry.applications ? (entry.hires / entry.applications) * 100 : 0;
    const averageOffer = entry.applications ? (entry.offers / entry.applications) * 100 : 0;
    return {
      id: entry.department.toLowerCase().replace(/\s+/g, '-'),
      label: entry.department,
      score: Number(score.toFixed(1)),
      delta: Number((averageOffer - score).toFixed(1)),
      sampleSize: entry.applications,
    };
  });

  return {
    nps,
    responseCount: responses.length,
    averageScore: experienceScores.length ? Number(average(experienceScores).toFixed(1)) : null,
    inclusionScore: inclusionScores.length ? Number(average(inclusionScores).toFixed(1)) : null,
    notesCaptured: notes.length,
    trend,
    segments: { departments: departmentSegments },
    fairness: {
      score: inclusionScores.length ? Number(average(inclusionScores).toFixed(1)) : null,
      segments: departmentSegments,
    },
  };
}

function buildCandidateCare(responses, notes, jobAdverts) {
  const responseMinutes = responses
    .map((response) => response.metadata?.responseMinutes ?? response.metadata?.responseTimeMinutes)
    .filter((value) => Number.isFinite(Number(value)))
    .map((value) => Number(value));
  const escalations = responses.filter((response) => response.metadata?.escalated || response.metadata?.severity === 'high');
  const openTickets = notes.filter((note) => (note.metadata?.status ?? '').toLowerCase().includes('open'));
  const departments = Array.from(
    new Set(
      jobAdverts
        .map((advert) => normaliseDepartment(advert))
        .filter(Boolean)
        .map((department) => department.toString()),
    ),
  ).map((department) => ({
    department,
    label: department,
  }));

  return {
    averageResponseMinutes: responseMinutes.length ? Number(average(responseMinutes).toFixed(1)) : null,
    escalations: escalations.length,
    openTickets: openTickets.length,
    departments,
  };
}

function buildInterviewOperations(interviewSchedules) {
  if (!interviewSchedules?.length) {
    return {
      upcomingCount: 0,
      averageLeadTimeHours: null,
      rescheduleCount: 0,
      recruiters: [],
    };
  }
  const now = Date.now();
  const upcoming = interviewSchedules.filter((schedule) => !schedule.completedAt && toTimestamp(schedule.scheduledAt) >= now);
  const leadTimes = interviewSchedules
    .map((schedule) => hoursBetween(schedule.scheduledAt, schedule.createdAt))
    .filter((value) => Number.isFinite(value));
  const rescheduleCount = interviewSchedules.reduce((total, schedule) => total + Number(schedule.rescheduleCount ?? 0), 0);
  const recruiterStats = new Map();
  interviewSchedules.forEach((schedule) => {
    const roster = Array.isArray(schedule.interviewerRoster) ? schedule.interviewerRoster : schedule.metadata?.interviewerRoster;
    if (!Array.isArray(roster)) {
      return;
    }
    roster.forEach((recruiter) => {
      const key = recruiter?.id ?? recruiter?.email ?? recruiter;
      if (!key) {
        return;
      }
      const entry = recruiterStats.get(key) ?? {
        id: key,
        label: recruiter.name ?? recruiter.email ?? key,
        scheduled: 0,
      };
      entry.scheduled += 1;
      recruiterStats.set(key, entry);
    });
  });
  return {
    upcomingCount: upcoming.length,
    averageLeadTimeHours: leadTimes.length ? Number(average(leadTimes).toFixed(1)) : null,
    rescheduleCount,
    recruiters: Array.from(recruiterStats.values()).sort((a, b) => b.scheduled - a.scheduled).slice(0, 8),
  };
}

function buildOfferOnboarding(jobHistories, applications, jobAdverts) {
  if (!jobHistories?.length && !applications?.length) {
    return {
      approvalsPending: 0,
      backgroundChecksInProgress: 0,
      signaturesOutstanding: 0,
      averagePackageValue: null,
      upcomingStartDates: [],
      tasks: { breakdown: [] },
    };
  }
  const approvalsPending = jobHistories.filter((history) =>
    (history.changeType ?? '').includes('approval') && (history.payload?.status ?? history.metadata?.status) === 'pending',
  ).length;
  const backgroundChecks = jobHistories.filter((history) => (history.changeType ?? '').includes('background_check'));
  const signaturesOutstanding = jobHistories.filter((history) =>
    (history.changeType ?? '').includes('signature') && !(history.payload?.completedAt || history.metadata?.completedAt),
  ).length;
  const packageValues = jobHistories
    .map((history) => history.payload?.packageValue ?? history.metadata?.packageValue ?? null)
    .filter((value) => Number.isFinite(Number(value)))
    .map((value) => Number(value));
  const upcomingStartDates = jobHistories
    .filter((history) => history.payload?.startDate || history.metadata?.startDate)
    .slice(0, 10)
    .map((history) => ({
      id: history.id ?? `start-${history.jobId ?? Math.random()}`,
      candidateName: history.payload?.candidateName ?? history.metadata?.candidateName ?? 'Candidate',
      roleName: history.payload?.roleName ?? history.metadata?.roleName ?? 'Role',
      startDate: history.payload?.startDate ?? history.metadata?.startDate,
    }))
    .filter((entry) => toTimestamp(entry.startDate) != null);

  const taskCategories = new Map();
  jobHistories.forEach((history) => {
    const category = history.payload?.taskCategory ?? history.metadata?.taskCategory;
    if (!category) {
      return;
    }
    const entry = taskCategories.get(category) ?? { category, count: 0 };
    entry.count += 1;
    taskCategories.set(category, entry);
  });

  const advertCompensation = jobAdverts
    .map((advert) => advert.compensationMax ?? advert.compensationMin)
    .filter((value) => Number.isFinite(Number(value)))
    .map((value) => Number(value));

  return {
    approvalsPending,
    backgroundChecksInProgress: backgroundChecks.length,
    signaturesOutstanding,
    averagePackageValue: packageValues.length
      ? Number(average(packageValues).toFixed(0))
      : advertCompensation.length
        ? Number(average(advertCompensation).toFixed(0))
        : null,
    upcomingStartDates,
    tasks: { breakdown: Array.from(taskCategories.values()).slice(0, 6) },
  };
}

function buildEnterpriseReadiness({
  stagePerformance,
  automationCoverage,
  templateCoverage,
  approvalSummary,
  interviewOperations,
  candidateCare,
  campaignInsights,
  dataFreshnessHours,
  lookbackDays,
  candidateExperience,
}) {
  const maturityScore = Number(((automationCoverage + (templateCoverage ?? automationCoverage)) / 2).toFixed(1));
  const totalSignals = stagePerformance.length * 2;
  const measuredSignals = stagePerformance.filter((stage) => stage.throughput > 0).length * 2;
  const scoreConfidence = Math.min(100, Math.round((measuredSignals / Math.max(totalSignals, 1)) * 100));
  const dataFreshness = dataFreshnessHours;

  const automationStatus = automationCoverage >= 75 ? 'healthy' : automationCoverage >= 45 ? 'watch' : 'at_risk';
  const collaborationStatus = (templateCoverage ?? 0) >= 65 ? 'healthy' : (templateCoverage ?? 0) >= 40 ? 'watch' : 'at_risk';
  const complianceStatus = approvalSummary.overdue > 0 ? 'at_risk' : approvalSummary.pending > 3 ? 'watch' : 'healthy';

  const overallScore = [automationStatus, collaborationStatus, complianceStatus].filter((status) => status === 'at_risk').length
    ? 'at_risk'
    : [automationStatus, collaborationStatus, complianceStatus].filter((status) => status === 'watch').length
      ? 'watch'
      : 'healthy';

  const fairnessSegments = candidateExperience?.segments?.departments ?? [];
  const fairnessScores = fairnessSegments.map((segment) => segment.score).filter((score) => Number.isFinite(Number(score)));
  const fairnessAverage = fairnessScores.length ? Number(average(fairnessScores).toFixed(1)) : null;
  const maxFairness = fairnessScores.length ? Math.max(...fairnessScores) : null;
  const minFairness = fairnessScores.length ? Math.min(...fairnessScores) : null;
  const parityGap = maxFairness != null && minFairness != null ? Number(((maxFairness - minFairness) / 100).toFixed(3)) : null;
  const automationParity = templateCoverage != null ? Number(((automationCoverage - templateCoverage) / 100).toFixed(3)) : null;
  const flaggedStages = stagePerformance.filter((stage) => stage.slaDelta != null && stage.slaDelta > 4);

  return {
    enterpriseReadiness: {
      maturityScore,
      maturityTier: maturityScore >= 80 ? 'enterprise_ready' : maturityScore >= 60 ? 'scaling' : maturityScore >= 40 ? 'foundational' : 'pilot',
      scoreConfidence,
      dataFreshnessHours: dataFreshness,
      lastUpdatedAt: dataFreshness != null ? new Date(Date.now() - dataFreshness * 60 * 60 * 1000) : null,
      instrumentation: {
        measuredSignals,
        expectedSignals: totalSignals,
      },
      health: {
        overall: overallScore,
        automation: automationStatus,
        collaboration: collaborationStatus,
        compliance: complianceStatus,
      },
      automation: {
        totalStages: stagePerformance.length,
        instrumentedStages: Math.round((automationCoverage / 100) * stagePerformance.length),
        stageAutomationCoverage: automationCoverage,
      },
      collaboration: {
        templateCoverage,
        calibrationsScheduled: interviewOperations.recruiters.length,
      },
      compliance: {
        formCompletionRate: candidateCare.averageResponseMinutes
          ? Math.max(0, Math.min(100, 100 - candidateCare.averageResponseMinutes))
          : null,
        approvalsPending: approvalSummary.pending,
      },
    },
    fairness: {
      score: fairnessAverage,
      parityGap,
      automationParity,
      flaggedStages,
      segments: fairnessSegments,
      statusLabel:
        parityGap != null && Math.abs(parityGap * 100) > 10
          ? 'High disparity'
          : parityGap != null && Math.abs(parityGap * 100) > 5
            ? 'Monitor parity'
            : 'Within guardrails',
    },
    campaigns: campaignInsights,
    lookbackDays,
  };
}

function buildRecommendations({ jobLifecycle, candidateCare, fairness, interviewOperations }) {
  const recommendations = [];
  if (jobLifecycle.pendingApprovals > 5) {
    recommendations.push({
      title: 'Clear approval backlog',
      description: 'Several requisitions are awaiting manager or finance approval. Escalate pending items to keep offers on track.',
      action: 'Notify approvers',
    });
  }
  if (candidateCare.averageResponseMinutes != null && candidateCare.averageResponseMinutes > 45) {
    recommendations.push({
      title: 'Improve candidate response speed',
      description: 'Average reply times exceed 45 minutes. Rebalance recruiter workloads or enable automated nudges.',
      action: 'Activate auto-nudges',
    });
  }
  if (fairness?.parityGap != null && Math.abs(fairness.parityGap * 100) > 8) {
    recommendations.push({
      title: 'Review fairness guardrails',
      description: 'Significant parity gap detected across departments. Audit interview rubrics and automation weights.',
      action: 'Open fairness playbook',
    });
  }
  if (interviewOperations.averageLeadTimeHours != null && interviewOperations.averageLeadTimeHours > 72) {
    recommendations.push({
      title: 'Reduce interview lead time',
      description: 'Scheduling lead times exceed three days. Add interviewer capacity or enable auto-scheduling.',
      action: 'Launch scheduler automation',
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      title: 'Monitor ATS health metrics',
      description: 'All core signals are within guardrails. Continue monitoring automation and candidate experience dashboards.',
      action: 'Schedule weekly review',
    });
  }
  return recommendations.slice(0, 4);
}

function buildInterviewExperience({ interviewSchedules, stagePerformance, candidateCare, jobHistories, offerOnboarding }) {
  const upcoming = interviewSchedules
    .filter((schedule) => !schedule.completedAt)
    .slice(0, 8)
    .map((schedule) => ({
      id: schedule.id,
      scheduledAt: schedule.scheduledAt,
      videoRoomId: schedule.metadata?.videoRoomId ?? schedule.metadata?.roomId ?? null,
      title: schedule.interviewStage ?? 'Interview',
    }));

  const templateCount = stagePerformance.filter((stage) => stage.averageDurationHours != null).length;
  const evaluationEntries = jobHistories
    .filter((history) => (history.changeType ?? '').includes('evaluation'))
    .map((history) => ({
      id: history.id,
      candidateName: history.payload?.candidateName ?? history.metadata?.candidateName ?? 'Candidate',
      status: history.payload?.status ?? history.metadata?.status ?? 'pending',
      updatedAt: history.updatedAt ?? history.createdAt,
    }));

  const recommendationMix = jobHistories
    .filter((history) => (history.changeType ?? '').includes('recommendation'))
    .reduce((acc, history) => {
      const decision = history.payload?.decision ?? history.metadata?.decision ?? 'pending';
      acc[decision] = (acc[decision] ?? 0) + 1;
      return acc;
    }, {});

  const portalCounts = jobHistories
    .filter((history) => history.payload?.portalName || history.metadata?.portalName)
    .reduce((acc, history) => {
      const portal = history.payload?.portalName ?? history.metadata?.portalName;
      acc.set(portal, (acc.get(portal) ?? 0) + 1);
      return acc;
    }, new Map());

  const topPortals = Array.from(portalCounts.entries())
    .map(([name, count]) => ({ name, sessions: count }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 5);

  return {
    scheduler: {
      upcoming,
      upcomingCount: upcoming.length,
      reminderCoverage: candidateCare.averageResponseMinutes != null
        ? Math.max(0, Math.min(100, 100 - candidateCare.averageResponseMinutes))
        : null,
    },
    panelTemplates: {
      totalTemplates: templateCount,
      topTemplates: stagePerformance
        .sort((a, b) => (b.throughput || 0) - (a.throughput || 0))
        .slice(0, 4)
        .map((stage) => ({ id: stage.id, name: stage.label, throughput: stage.throughput })),
    },
    candidatePrep: {
      activePortals: topPortals.length,
      topPortals,
    },
    evaluationWorkspace: {
      evaluationsSubmitted: evaluationEntries.length,
      decisionTrackers: evaluationEntries,
      recommendationMix,
    },
    offerBridge: {
      approvalsPending: offerOnboarding.approvalsPending,
      backgroundChecksInProgress: offerOnboarding.backgroundChecksInProgress,
      signaturesOutstanding: offerOnboarding.signaturesOutstanding,
      averagePackageValue: offerOnboarding.averagePackageValue,
      upcomingStartDates: offerOnboarding.upcomingStartDates,
      tasks: offerOnboarding.tasks,
    },
    candidateCareCenter: {
      openTickets: candidateCare.openTickets,
      recentTickets: responsesToTickets(jobHistories).slice(0, 5),
    },
  };

  function responsesToTickets(histories) {
    return histories
      .filter((history) => (history.changeType ?? '').includes('ticket'))
      .map((history) => ({
        id: history.id,
        subject: history.payload?.subject ?? history.metadata?.subject ?? 'Support ticket',
        status: history.payload?.status ?? history.metadata?.status ?? 'open',
        updatedAt: history.updatedAt ?? history.createdAt,
      }));
  }
}

function buildEmployerBrandWorkforce(jobAdverts, applications, campaignInsights) {
  const attritionRiskScore = jobAdverts.length
    ? Math.min(100, Math.round((applications.length / Math.max(jobAdverts.length, 1)) * 12))
    : null;
  const activeCampaigns = campaignInsights.topChannels.filter((channel) => channel.applications > 0).length;
  const referralApplications = applications.filter((application) =>
    (application.metadata?.source ?? '').toLowerCase().includes('referral'),
  ).length;
  const referralConversionRate = applications.length
    ? Number(((referralApplications / applications.length) * 100).toFixed(1))
    : null;

  return {
    workforceAnalytics: {
      attritionRiskScore,
    },
    profileStudio: {
      campaignSummary: {
        active: activeCampaigns,
      },
    },
    internalMobility: {
      referralConversionRate,
    },
  };
}

function buildAlerts({ jobLifecycle, candidateCare, interviewOperations }) {
  const alerts = [];
  if (jobLifecycle.pendingApprovals > 5) {
    alerts.push({ id: 'approvals', severity: 'warning' });
  }
  if (candidateCare.averageResponseMinutes != null && candidateCare.averageResponseMinutes > 60) {
    alerts.push({ id: 'candidate-response', severity: 'warning' });
  }
  if (interviewOperations.averageLeadTimeHours != null && interviewOperations.averageLeadTimeHours > 72) {
    alerts.push({ id: 'interview-sla', severity: 'warning' });
  }
  return {
    open: alerts.length,
    items: alerts,
  };
}

function buildAtsMetrics(jobStages) {
  if (!jobStages.length) {
    return {
      totalStages: 0,
      instrumentedStages: 0,
      automationCoverage: 0,
      averageSlaHours: null,
      averageDurationHours: null,
    };
  }
  const instrumentedStages = jobStages.filter((stage) => Boolean(stage.guideUrl) || Boolean(stage.metadata?.playbookId)).length;
  const automationCoverage = Number(((instrumentedStages / jobStages.length) * 100).toFixed(1));
  const slaValues = jobStages
    .map((stage) => normaliseNumber(stage.slaHours))
    .filter((value) => Number.isFinite(value));
  const durationValues = jobStages
    .map((stage) => normaliseNumber(stage.averageDurationHours))
    .filter((value) => Number.isFinite(value));
  const averageSlaHours = slaValues.length
    ? Number((slaValues.reduce((total, value) => total + value, 0) / slaValues.length).toFixed(1))
    : null;
  const averageDurationHours = durationValues.length
    ? Number((durationValues.reduce((total, value) => total + value, 0) / durationValues.length).toFixed(1))
    : null;
  return {
    totalStages: jobStages.length,
    instrumentedStages,
    automationCoverage,
    averageSlaHours,
    averageDurationHours,
  };
}

function sanitizeJobPayload(payload = {}) {
  const {
    title,
    description,
    location,
    employmentType,
    geoLocation,
    status,
    openings,
    remoteType,
    currencyCode,
    compensationMin,
    compensationMax,
    hiringManagerId,
    publishedAt,
    expiresAt,
    department,
    workflow,
  } = payload;

  if (!title || !`${title}`.trim()) {
    throw new ValidationError('Title is required.');
  }
  if (!description || !`${description}`.trim()) {
    throw new ValidationError('Description is required.');
  }
  const resolvedStatus = status && JOB_STATUS_OPTIONS.find((option) => option.value === status) ? status : 'draft';
  const resolvedRemoteType = remoteType && REMOTE_TYPE_OPTIONS.find((option) => option.value === remoteType)
    ? remoteType
    : 'remote';
  const sanitized = {
    job: {
      title: `${title}`.trim(),
      description: `${description}`.trim(),
      location: location ? `${location}`.trim() : null,
      employmentType: employmentType ? `${employmentType}`.trim() : null,
      geoLocation: geoLocation ?? null,
    },
    advert: {
      status: resolvedStatus,
      openings: openings != null ? Math.max(1, Number.parseInt(openings, 10) || 1) : 1,
      remoteType: resolvedRemoteType,
      currencyCode: currencyCode ? `${currencyCode}`.trim().toUpperCase().slice(0, 3) : 'USD',
      compensationMin: compensationMin != null ? Number(compensationMin) : null,
      compensationMax: compensationMax != null ? Number(compensationMax) : null,
      hiringManagerId: hiringManagerId != null ? Number(hiringManagerId) : null,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: {
        department: department ? `${department}`.trim() : null,
        workflow: workflow ?? null,
      },
    },
  };
  return sanitized;
}

async function findJobAdvert(jobId, workspaceId, { transaction } = {}) {
  const advert = await JobAdvert.findOne({
    where: { jobId, workspaceId },
    include: [{ model: Job, as: 'job' }],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!advert) {
    throw new NotFoundError('Job advert not found for workspace.');
  }
  return advert;
}

function sanitizeKeywords(keywords) {
  if (!Array.isArray(keywords)) {
    throw new ValidationError('keywords must be an array.');
  }
  const unique = new Map();
  keywords
    .map((entry) => {
      if (typeof entry === 'string') {
        return { keyword: entry.trim(), weight: 1 };
      }
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      return {
        keyword: `${entry.keyword ?? ''}`.trim(),
        weight: entry.weight != null ? Number(entry.weight) : 1,
      };
    })
    .filter((entry) => entry && entry.keyword)
    .forEach((entry) => {
      const key = entry.keyword.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, { keyword: entry.keyword, weight: Number.isFinite(entry.weight) ? entry.weight : 1 });
      }
    });
  return Array.from(unique.values()).slice(0, 25);
}

function sanitizeNotePayload(payload = {}) {
  const { summary, stage, sentiment, nextSteps, attachments } = payload;
  if (!summary || !`${summary}`.trim()) {
    throw new ValidationError('Summary is required.');
  }
  const allowedSentiments = ['positive', 'neutral', 'concern'];
  const resolvedSentiment = allowedSentiments.includes(sentiment) ? sentiment : 'neutral';
  return {
    summary: `${summary}`.trim().slice(0, 255),
    stage: stage ? `${stage}`.trim().slice(0, 120) : null,
    sentiment: resolvedSentiment,
    nextSteps: nextSteps ? `${nextSteps}`.trim() : null,
    attachments: Array.isArray(attachments) ? attachments.slice(0, 10) : null,
  };
}

function sanitizeResponsePayload(payload = {}) {
  const { channel, direction, message, respondentId, respondentName, sentAt, metadata } = payload;
  if (!message || !`${message}`.trim()) {
    throw new ValidationError('Message body is required.');
  }
  const resolvedDirection = direction === 'outbound' ? 'outbound' : 'inbound';
  return {
    channel: channel ? `${channel}`.trim().slice(0, 60) : 'message',
    direction: resolvedDirection,
    message: `${message}`.trim(),
    respondentId: respondentId != null ? Number(respondentId) : null,
    respondentName: respondentName ? `${respondentName}`.trim().slice(0, 255) : null,
    sentAt: sentAt ? new Date(sentAt) : new Date(),
    metadata: metadata && typeof metadata === 'object' ? metadata : null,
  };
}

export async function getCompanyJobOperations({ workspaceId, workspaceSlug, lookbackDays } = {}) {
  const selector = parseWorkspaceSelector({ workspaceId, workspaceSlug });
  const lookback = clamp(lookbackDays, {
    min: MIN_LOOKBACK_DAYS,
    max: MAX_LOOKBACK_DAYS,
    fallback: DEFAULT_LOOKBACK_DAYS,
  });
  const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000);

  const workspace = await fetchWorkspace(selector);
  const availableWorkspaces = await listAvailableWorkspaces();

  const jobAdverts = await JobAdvert.findAll({
    where: { workspaceId: workspace.id },
    include: [
      { model: Job, as: 'job' },
      {
        model: JobKeyword,
        as: 'keywords',
        attributes: ['id', 'keyword', 'weight', 'createdAt'],
        order: [['weight', 'DESC']],
      },
      {
        model: JobFavorite,
        as: 'favorites',
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  const jobIds = jobAdverts.map((advert) => advert.jobId);

  const [
    applications,
    interviewSchedules,
    jobHistories,
    jobResponses,
    jobNotes,
    jobStages,
    approvalWorkflows,
    campaignPerformance,
  ] = await Promise.all([
    jobIds.length
      ? Application.findAll({
          where: {
            targetType: 'job',
            targetId: { [Op.in]: jobIds },
          },
          include: [
            {
              model: User,
              as: 'applicant',
              attributes: ['id', 'firstName', 'lastName', 'email'],
              include: [{ model: Profile, as: 'Profile', attributes: ['id', 'headline', 'bio', 'skills'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        })
      : [],
    jobIds.length
      ? InterviewSchedule.findAll({
          where: {
            workspaceId: workspace.id,
            scheduledAt: { [Op.gte]: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
          },
          include: [
            {
              model: Application,
              as: 'application',
              include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] }],
            },
          ],
          order: [['scheduledAt', 'ASC']],
        })
      : [],
    jobIds.length
      ? JobAdvertHistory.findAll({
          where: { workspaceId: workspace.id, jobId: { [Op.in]: jobIds } },
          include: [{ model: User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email'] }],
          order: [['createdAt', 'DESC']],
          limit: 200,
        })
      : [],
    jobIds.length
      ? JobCandidateResponse.findAll({
          where: {
            workspaceId: workspace.id,
            jobId: { [Op.in]: jobIds },
            sentAt: { [Op.gte]: since },
          },
          include: [
            { model: User, as: 'respondent', attributes: ['id', 'firstName', 'lastName', 'email'] },
            {
              model: Application,
              as: 'application',
              include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] }],
            },
          ],
          order: [['sentAt', 'DESC']],
        })
      : [],
    jobIds.length
      ? JobCandidateNote.findAll({
          where: { workspaceId: workspace.id, jobId: { [Op.in]: jobIds } },
          include: [
            { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] },
            {
              model: Application,
              as: 'application',
              include: [{ model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] }],
            },
          ],
          order: [['createdAt', 'DESC']],
        })
      : [],
    JobStage.findAll({
      where: { workspaceId: workspace.id },
      order: [['jobId', 'ASC'], ['orderIndex', 'ASC']],
    }),
    JobApprovalWorkflow.findAll({
      where: {
        workspaceId: workspace.id,
        ...(jobIds.length ? { jobId: { [Op.in]: jobIds } } : {}),
      },
      order: [['createdAt', 'DESC']],
    }),
    JobCampaignPerformance.findAll({
      where: {
        workspaceId: workspace.id,
        reportingDate: { [Op.gte]: since },
        ...(jobIds.length ? { jobId: { [Op.in]: jobIds } } : {}),
      },
      order: [['reportingDate', 'DESC']],
    }),
  ]);

  const jobMap = new Map(jobAdverts.map((advert) => [advert.jobId, toPlain(advert)]));
  const historyByJob = jobHistories.reduce((acc, record) => {
    const plain = toPlain(record);
    const list = acc.get(plain.jobId) ?? [];
    list.push(plain);
    acc.set(plain.jobId, list);
    return acc;
  }, new Map());
  const responsesByJob = jobResponses.reduce((acc, record) => {
    const plain = toPlain(record);
    const list = acc.get(plain.jobId) ?? [];
    list.push(plain);
    acc.set(plain.jobId, list);
    return acc;
  }, new Map());
  const notesByJob = jobNotes.reduce((acc, record) => {
    const plain = toPlain(record);
    const list = acc.get(plain.jobId) ?? [];
    list.push(plain);
    acc.set(plain.jobId, list);
    return acc;
  }, new Map());

  const applicationsByJob = applications.reduce((acc, application) => {
    const plain = toPlain(application);
    const list = acc.get(plain.targetId) ?? [];
    list.push(plain);
    acc.set(plain.targetId, list);
    return acc;
  }, new Map());

  const interviewRecords = interviewSchedules.map((schedule) => {
    const plain = toPlain(schedule);
    const jobId = plain.application?.targetId ?? plain.application?.jobId ?? null;
    return { ...plain, jobId };
  });

  const interviewsByApplication = interviewRecords.reduce((acc, schedule) => {
    const list = acc.get(schedule.applicationId) ?? [];
    list.push(schedule);
    acc.set(schedule.applicationId, list);
    return acc;
  }, new Map());

  const notesByApplication = jobNotes.reduce((acc, note) => {
    const plain = toPlain(note);
    const list = acc.get(plain.applicationId) ?? [];
    list.push(plain);
    acc.set(plain.applicationId, list);
    return acc;
  }, new Map());

  const responsesByApplication = jobResponses.reduce((acc, response) => {
    const plain = toPlain(response);
    const list = acc.get(plain.applicationId) ?? [];
    list.push(plain);
    acc.set(plain.applicationId, list);
    return acc;
  }, new Map());

  const stageByJob = jobStages.reduce((acc, stage) => {
    const plain = toPlain(stage);
    const list = acc.get(plain.jobId) ?? [];
    list.push(plain);
    acc.set(plain.jobId, list);
    return acc;
  }, new Map());

  const jobAdvertsPayload = jobAdverts.map((advert) => {
    const plain = toPlain(advert);
    const jobApplications = applicationsByJob.get(plain.jobId) ?? [];
    const jobHistory = historyByJob.get(plain.jobId) ?? [];
    const jobResponsesList = responsesByJob.get(plain.jobId) ?? [];
    const jobNotesList = notesByJob.get(plain.jobId) ?? [];
    const jobStagesList = stageByJob.get(plain.jobId) ?? [];
    const keywordMatches = buildKeywordMatches(plain.keywords, jobApplications);
    const applicationSummaries = jobApplications.map((application) => ({
      id: application.id,
      status: application.status,
      submittedAt: application.submittedAt ?? application.createdAt ?? null,
      candidateName:
        [application.applicant?.firstName, application.applicant?.lastName]
          .filter(Boolean)
          .join(' ') || application.applicant?.email,
      interviews: interviewsByApplication.get(application.id) ?? [],
      notes: notesByApplication.get(application.id) ?? [],
      responses: responsesByApplication.get(application.id) ?? [],
    }));
    return {
      ...plain,
      applicants: applicationSummaries,
      history: jobHistory,
      candidateResponses: jobResponsesList,
      candidateNotes: jobNotesList,
      stages: jobStagesList,
      keywordMatches,
    };
  });

  const jobHistoriesPlain = jobHistories.map((record) => toPlain(record));
  const jobResponsesPlain = jobResponses.map((record) => toPlain(record));
  const jobNotesPlain = jobNotes.map((record) => toPlain(record));
  const jobStagesPlain = jobStages.map((record) => toPlain(record));
  const approvalWorkflowsPlain = approvalWorkflows.map((record) => toPlain(record));
  const campaignPerformancePlain = campaignPerformance.map((record) => toPlain(record));

  const summary = {
    totalJobs: jobAdvertsPayload.length,
    openJobs: jobAdvertsPayload.filter((advert) => advert.status === 'open').length,
    totalCandidates: applications.length,
    favourites: jobAdvertsPayload.reduce((total, advert) => total + (advert.favorites?.length ?? 0), 0),
    upcomingInterviews: interviewSchedules.filter((schedule) => !schedule.completedAt && new Date(schedule.scheduledAt) >= new Date()).length,
  };

  const candidateList = applications.map((application) => {
    const plain = toPlain(application);
    const applicant = plain.applicant ?? {};
    return {
      id: plain.id,
      jobId: plain.targetId,
      status: plain.status,
      submittedAt: plain.submittedAt ?? plain.createdAt ?? null,
      decisionAt: plain.decisionAt ?? null,
      candidate: {
        id: applicant.id ?? null,
        name: [applicant.firstName, applicant.lastName].filter(Boolean).join(' ') || applicant.email,
        email: applicant.email ?? null,
        headline: applicant.Profile?.headline ?? null,
      },
      notes: notesByApplication.get(plain.id) ?? [],
      interviews: interviewsByApplication.get(plain.id) ?? [],
      responses: responsesByApplication.get(plain.id) ?? [],
    };
  });

  const atsMetrics = buildAtsMetrics(jobStagesPlain);

  const pipelineTrend = buildPipelineTrend(candidateList, lookback);
  const stagePerformance = buildStagePerformance(jobStagesPlain, candidateList);
  const templateStageCount = jobStagesPlain.filter((stage) =>
    Boolean(stage.metadata?.templateId || stage.metadata?.templateKey || stage.metadata?.template || stage.guideUrl),
  ).length;
  const templateCoverage = jobStagesPlain.length
    ? Number(((templateStageCount / jobStagesPlain.length) * 100).toFixed(1))
    : null;
  const approvalSummary = buildApprovalSummary(approvalWorkflowsPlain);
  const campaignInsights = buildCampaignInsights(campaignPerformancePlain);
  const candidateExperience = buildCandidateExperience({
    applications: candidateList,
    responses: jobResponsesPlain,
    notes: jobNotesPlain,
    jobAdverts: jobAdvertsPayload,
  });
  const candidateCare = buildCandidateCare(jobResponsesPlain, jobNotesPlain, jobAdvertsPayload);
  const interviewOperations = buildInterviewOperations(interviewRecords);
  const offerOnboarding = buildOfferOnboarding(jobHistoriesPlain, candidateList, jobAdvertsPayload);
  const freshestTimestamp = Math.max(
    0,
    ...jobAdvertsPayload.map((advert) => toTimestamp(advert.updatedAt ?? advert.createdAt) ?? 0),
    ...jobHistoriesPlain.map((history) => toTimestamp(history.updatedAt ?? history.createdAt) ?? 0),
    ...jobResponsesPlain.map((response) => toTimestamp(response.sentAt ?? response.createdAt) ?? 0),
    ...jobNotesPlain.map((note) => toTimestamp(note.updatedAt ?? note.createdAt) ?? 0),
    ...interviewRecords.map((schedule) => toTimestamp(schedule.updatedAt ?? schedule.scheduledAt) ?? 0),
  );
  const dataFreshnessHours = freshestTimestamp
    ? Number(((Date.now() - freshestTimestamp) / (1000 * 60 * 60)).toFixed(1))
    : null;
  const enterprise = buildEnterpriseReadiness({
    stagePerformance,
    automationCoverage: atsMetrics.automationCoverage ?? 0,
    templateCoverage: templateCoverage ?? 0,
    approvalSummary,
    interviewOperations,
    candidateCare,
    campaignInsights,
    dataFreshnessHours,
    lookbackDays: lookback,
    candidateExperience,
  });
  const enterpriseReadiness = enterprise.enterpriseReadiness;
  const fairness = enterprise.fairness;
  const funnel = buildFunnel(candidateList);

  const decisionHours = candidateList
    .map((application) => hoursBetween(application.decisionAt ?? application.updatedAt, application.submittedAt))
    .filter((value) => Number.isFinite(value));
  const averageDaysToDecision = decisionHours.length
    ? Number((average(decisionHours) / 24).toFixed(1))
    : null;

  const hiresCount = candidateList.filter((application) =>
    (application.status ?? '').toLowerCase().includes('hire'),
  ).length;
  const offersCount = candidateList.filter((application) =>
    (application.status ?? '').toLowerCase().includes('offer'),
  ).length;

  const jobLifecycle = {
    atsHealth: {
      activeRequisitions: jobAdvertsPayload.filter((advert) => advert.status === 'open').length,
      maturityScore: enterpriseReadiness.maturityScore,
      readinessTier: enterpriseReadiness.maturityTier,
      automationCoverage: atsMetrics.automationCoverage,
      templateCoverage,
      dataFreshnessHours: enterpriseReadiness.dataFreshnessHours,
      lastUpdatedAt: enterpriseReadiness.lastUpdatedAt,
      upcomingInterviews: interviewOperations.upcomingCount,
      rescheduleCount: interviewOperations.rescheduleCount,
      velocity: {
        averageDaysToDecision,
      },
    },
    stagePerformance,
    pendingApprovals: approvalSummary.pending,
    overdueApprovals: approvalSummary.overdue,
    approvalQueue: approvalSummary,
    campaigns: campaignInsights,
    funnel,
    fairness,
    enterpriseReadiness,
    trend: pipelineTrend,
    recentActivity: {
      approvalsCompleted: jobHistoriesPlain.filter((history) =>
        (history.changeType ?? '').includes('approval') &&
        (history.payload?.status ?? history.metadata?.status) === 'approved',
      ).length,
      campaignsTracked: campaignPerformancePlain.length,
      interviewsScheduled: interviewRecords.length,
    },
  };

  const recommendations = buildRecommendations({ jobLifecycle, candidateCare, fairness, interviewOperations });
  const employerBrandWorkforce = buildEmployerBrandWorkforce(jobAdvertsPayload, candidateList, campaignInsights);
  const alerts = buildAlerts({ jobLifecycle, candidateCare, interviewOperations });

  const pipelineSummary = {
    totals: {
      applications: candidateList.length,
      hires: hiresCount,
    },
    velocity: {
      averageDaysToDecision,
    },
  };

  const offers = {
    total: offersCount,
    winRate: offersCount ? Number(((hiresCount / offersCount) * 100).toFixed(1)) : null,
  };

  const memberSummary = {
    active: workspace.members?.length ?? 0,
    invited: 0,
    inactive: 0,
  };

  const partnerships = {
    headhunterProgram: {
      briefs: {
        active: Math.max(0, jobAdvertsPayload.length - summary.openJobs),
      },
    },
    talentPools: {
      totals: {
        hiresFromPools: hiresCount,
      },
    },
  };

  const payload = {
    meta: {
      lookbackDays: lookback,
      selectedWorkspaceId: workspace.id,
      availableWorkspaces,
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
    },
    summary,
    jobAdverts: jobAdvertsPayload,
    applications: candidateList,
    interviews: interviewRecords,
    responses: jobResponsesPlain,
    notes: jobNotesPlain,
    kanban: buildKanbanColumns(candidateList, jobMap),
    ats: {
      stages: jobStagesPlain,
      metrics: atsMetrics,
    },
    lookups: {
      jobStatuses: JOB_STATUS_OPTIONS,
      remoteTypes: REMOTE_TYPE_OPTIONS,
      applicationStatuses: APPLICATION_STATUS_OPTIONS,
    },
    pipelineSummary,
    memberSummary,
    offers,
    jobLifecycle,
    candidateExperience,
    candidateCare,
    interviewOperations,
    offerOnboarding,
    recommendations,
    alerts,
    employerBrandWorkforce,
    partnerships,
    profile: {
      companyName: workspace.name,
    },
  };

  return payload;
}

export async function createJobPosting({ workspaceId, payload, actorId }) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  const workspace = await fetchWorkspace({ id: workspaceId });
  const sanitized = sanitizeJobPayload(payload);
  return sequelize.transaction(async (transaction) => {
    const job = await Job.create(sanitized.job, { transaction });
    const advert = await JobAdvert.create(
      {
        ...sanitized.advert,
        jobId: job.id,
        workspaceId: workspace.id,
        metadata: {
          ...(sanitized.advert.metadata ?? {}),
          createdById: actorId ?? null,
        },
      },
      { transaction },
    );
    await JobAdvertHistory.create(
      {
        workspaceId: workspace.id,
        jobId: job.id,
        actorId: actorId ?? null,
        changeType: 'created',
        summary: 'Job advert created',
        payload: {
          status: advert.status,
          openings: advert.openings,
        },
      },
      { transaction },
    );
    return {
      job: toPlain(job),
      advert: toPlain(advert),
    };
  });
}

export async function updateJobPosting({ workspaceId, jobId, payload, actorId }) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  if (!jobId) {
    throw new ValidationError('jobId is required.');
  }
  const sanitized = sanitizeJobPayload(payload);
  return sequelize.transaction(async (transaction) => {
    const advert = await findJobAdvert(jobId, workspaceId, { transaction });
    await advert.job.update(sanitized.job, { transaction });
    await advert.update(
      {
        ...sanitized.advert,
        metadata: {
          ...(advert.metadata ?? {}),
          ...(sanitized.advert.metadata ?? {}),
          updatedById: actorId ?? null,
        },
      },
      { transaction },
    );
    await JobAdvertHistory.create(
      {
        workspaceId,
        jobId,
        actorId: actorId ?? null,
        changeType: 'updated',
        summary: 'Job advert updated',
        payload: sanitized,
      },
      { transaction },
    );
    return {
      job: toPlain(advert.job),
      advert: toPlain(advert),
    };
  });
}

export async function updateJobKeywords({ workspaceId, jobId, keywords, actorId }) {
  if (!workspaceId) {
    throw new ValidationError('workspaceId is required.');
  }
  if (!jobId) {
    throw new ValidationError('jobId is required.');
  }
  const sanitized = sanitizeKeywords(keywords);
  return sequelize.transaction(async (transaction) => {
    await findJobAdvert(jobId, workspaceId, { transaction });
    await JobKeyword.destroy({ where: { jobId }, transaction });
    if (sanitized.length) {
      await JobKeyword.bulkCreate(
        sanitized.map((entry) => ({ jobId, keyword: entry.keyword, weight: entry.weight })),
        { transaction },
      );
    }
    await JobAdvertHistory.create(
      {
        workspaceId,
        jobId,
        actorId: actorId ?? null,
        changeType: 'keywords_updated',
        summary: 'Job keywords updated',
        payload: { keywords: sanitized },
      },
      { transaction },
    );
    return sanitized;
  });
}

export async function createJobFavorite({ workspaceId, jobId, userId, notes, actorId }) {
  if (!workspaceId || !jobId) {
    throw new ValidationError('workspaceId and jobId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const [favorite] = await JobFavorite.findOrCreate({
    where: { workspaceId, jobId, userId: userId ?? null },
    defaults: {
      workspaceId,
      jobId,
      userId: userId ?? null,
      notes: notes ? `${notes}`.trim() : null,
      createdById: actorId ?? null,
    },
  });
  return toPlain(favorite);
}

export async function removeJobFavorite({ workspaceId, jobId, favoriteId }) {
  if (!workspaceId || !jobId || !favoriteId) {
    throw new ValidationError('workspaceId, jobId, and favoriteId are required.');
  }
  const favorite = await JobFavorite.findOne({
    where: { id: favoriteId, workspaceId, jobId },
  });
  if (!favorite) {
    throw new NotFoundError('Favorite not found.');
  }
  await favorite.destroy();
  return { success: true };
}

export async function createJobApplication({ workspaceId, jobId, applicantId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !applicantId) {
    throw new ValidationError('workspaceId, jobId, and applicantId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const application = await Application.create({
    applicantId,
    targetType: 'job',
    targetId: jobId,
    status: APPLICATION_STATUSES.includes(payload.status) ? payload.status : 'submitted',
    sourceChannel: payload.sourceChannel && `${payload.sourceChannel}`.trim().length ? `${payload.sourceChannel}`.trim() : 'web',
    coverLetter: payload.coverLetter ? `${payload.coverLetter}`.trim() : null,
    attachments: Array.isArray(payload.attachments) ? payload.attachments.slice(0, 10) : null,
    rateExpectation: payload.rateExpectation != null ? Number(payload.rateExpectation) : null,
    currencyCode: payload.currencyCode ? `${payload.currencyCode}`.trim().toUpperCase().slice(0, 3) : null,
    availabilityDate: payload.availabilityDate ? new Date(payload.availabilityDate) : null,
    submittedAt: payload.submittedAt ? new Date(payload.submittedAt) : new Date(),
    metadata: {
      ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
      workspaceId,
      createdById: actorId ?? null,
    },
  });
  return toPlain(application);
}

export async function updateJobApplication({ workspaceId, jobId, applicationId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !applicationId) {
    throw new ValidationError('workspaceId, jobId, and applicationId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const application = await Application.findOne({
    where: { id: applicationId, targetType: 'job', targetId: jobId },
  });
  if (!application) {
    throw new NotFoundError('Application not found.');
  }
  const updates = {};
  if (payload.status && APPLICATION_STATUSES.includes(payload.status)) {
    updates.status = payload.status;
  }
  if (payload.decisionAt) {
    updates.decisionAt = new Date(payload.decisionAt);
  }
  if (payload.coverLetter != null) {
    updates.coverLetter = `${payload.coverLetter}`.trim();
  }
  if (payload.rateExpectation != null) {
    updates.rateExpectation = Number(payload.rateExpectation);
  }
  if (payload.currencyCode != null) {
    updates.currencyCode = `${payload.currencyCode}`.trim().toUpperCase().slice(0, 3);
  }
  if (payload.availabilityDate) {
    updates.availabilityDate = new Date(payload.availabilityDate);
  }
  updates.metadata = {
    ...(application.metadata ?? {}),
    ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
    updatedById: actorId ?? null,
  };
  await application.update(updates);
  await JobAdvertHistory.create({
    workspaceId,
    jobId,
    actorId: actorId ?? null,
    changeType: 'application_updated',
    summary: 'Application updated',
    payload: { applicationId, updates },
  });
  return toPlain(application);
}

export async function scheduleInterview({ workspaceId, jobId, applicationId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !applicationId) {
    throw new ValidationError('workspaceId, jobId, and applicationId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const interview = await InterviewSchedule.create({
    workspaceId,
    applicationId,
    interviewStage: payload.interviewStage ? `${payload.interviewStage}`.trim().slice(0, 120) : 'Interview',
    scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : new Date(),
    durationMinutes: payload.durationMinutes != null ? Number(payload.durationMinutes) : null,
    rescheduleCount: payload.rescheduleCount != null ? Number(payload.rescheduleCount) : 0,
    interviewerRoster: Array.isArray(payload.interviewerRoster) ? payload.interviewerRoster.slice(0, 10) : null,
    metadata: {
      ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
      createdById: actorId ?? null,
      jobId,
    },
  });
  return toPlain(interview);
}

export async function updateInterview({ workspaceId, jobId, interviewId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !interviewId) {
    throw new ValidationError('workspaceId, jobId, and interviewId are required.');
  }
  const interview = await InterviewSchedule.findOne({
    where: { id: interviewId, workspaceId },
  });
  if (!interview) {
    throw new NotFoundError('Interview schedule not found.');
  }
  const updates = {};
  if (payload.interviewStage) {
    updates.interviewStage = `${payload.interviewStage}`.trim().slice(0, 120);
  }
  if (payload.scheduledAt) {
    updates.scheduledAt = new Date(payload.scheduledAt);
  }
  if (payload.completedAt) {
    updates.completedAt = new Date(payload.completedAt);
  }
  if (payload.durationMinutes != null) {
    updates.durationMinutes = Number(payload.durationMinutes);
  }
  if (payload.rescheduleCount != null) {
    updates.rescheduleCount = Number(payload.rescheduleCount);
  }
  if (payload.interviewerRoster) {
    updates.interviewerRoster = Array.isArray(payload.interviewerRoster) ? payload.interviewerRoster.slice(0, 10) : null;
  }
  updates.metadata = {
    ...(interview.metadata ?? {}),
    ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
    updatedById: actorId ?? null,
  };
  await interview.update(updates);
  return toPlain(interview);
}

export async function recordCandidateResponse({ workspaceId, jobId, applicationId, payload = {}, actorId }) {
  if (!workspaceId || !jobId) {
    throw new ValidationError('workspaceId and jobId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const sanitized = sanitizeResponsePayload(payload);
  const response = await JobCandidateResponse.create({
    workspaceId,
    jobId,
    applicationId: applicationId ?? null,
    respondentId: sanitized.respondentId ?? actorId ?? null,
    respondentName: sanitized.respondentName ?? null,
    channel: sanitized.channel,
    direction: sanitized.direction,
    message: sanitized.message,
    sentAt: sanitized.sentAt,
    metadata: sanitized.metadata,
  });
  return toPlain(response);
}

export async function addCandidateNote({ workspaceId, jobId, applicationId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !applicationId) {
    throw new ValidationError('workspaceId, jobId, and applicationId are required.');
  }
  await findJobAdvert(jobId, workspaceId);
  const sanitized = sanitizeNotePayload(payload);
  const note = await JobCandidateNote.create({
    workspaceId,
    jobId,
    applicationId,
    authorId: actorId ?? null,
    stage: sanitized.stage,
    sentiment: sanitized.sentiment,
    summary: sanitized.summary,
    nextSteps: sanitized.nextSteps,
    attachments: sanitized.attachments,
  });
  return toPlain(note);
}

export async function updateCandidateNote({ workspaceId, jobId, noteId, payload = {}, actorId }) {
  if (!workspaceId || !jobId || !noteId) {
    throw new ValidationError('workspaceId, jobId, and noteId are required.');
  }
  const note = await JobCandidateNote.findOne({
    where: { id: noteId, workspaceId, jobId },
  });
  if (!note) {
    throw new NotFoundError('Candidate note not found.');
  }
  const sanitized = sanitizeNotePayload(payload);
  await note.update({
    ...sanitized,
    authorId: note.authorId ?? actorId ?? null,
  });
  return toPlain(note);
}

export default {
  getCompanyJobOperations,
  createJobPosting,
  updateJobPosting,
  updateJobKeywords,
  createJobFavorite,
  removeJobFavorite,
  createJobApplication,
  updateJobApplication,
  scheduleInterview,
  updateInterview,
  recordCandidateResponse,
  addCandidateNote,
  updateCandidateNote,
};
