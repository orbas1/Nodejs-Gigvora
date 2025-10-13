import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  SparklesIcon,
  GlobeAltIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import PartnershipsSourcingSection from '../../components/dashboard/PartnershipsSourcingSection.jsx';
import JobLifecycleSection from '../../components/company/JobLifecycleSection.jsx';
import { useCompanyDashboard } from '../../hooks/useCompanyDashboard.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import InterviewExperienceSection from '../../components/dashboard/InterviewExperienceSection.jsx';

const menuSections = [
  {
    label: 'Talent acquisition',
    items: [
      {
        name: 'Hiring overview',
        description: 'Pipeline health, hiring velocity, diversity metrics, and alerts.',
      },
      {
        name: 'Job lifecycle & ATS intelligence',
        description:
          'Run a modern applicant tracking system with collaborative job creation, smart sourcing, and full-funnel insights.',
        tags: ['ATS'],
      },
      {
        name: 'Interview excellence & candidate experience',
        description: 'Structured guides, scheduling automation, and feedback collaboration for every interview panel.',
      },
      {
        name: 'Offer & onboarding bridge',
        description: 'Generate offers, track approvals, manage background checks, and orchestrate onboarding tasks.',
      },
      {
        name: 'Candidate care center',
        description: 'Monitor response times, candidate NPS, and inclusion metrics to deliver a world-class experience.',
      },
    ],
  },
  {
    label: 'Design & sourcing',
    items: [
      {
        name: 'Job design studio',
        description: 'Craft requisitions with intake surveys, leveling frameworks, compensation guidelines, and approvals.',
      },
      {
        name: 'Multi-channel sourcing',
        description:
          'Publish to Gigvora, job boards, employee referrals, and talent pools with personalized landing pages and reporting.',
      },
      {
        name: 'Applicant relationship manager',
        description: 'Segment candidates, send nurture campaigns, and manage compliance across GDPR, CCPA, and internal policies.',
      },
    ],
  },
  {
    label: 'Networking & community',
    items: [
      {
        name: 'Networking sessions',
        description: 'Launch and monitor speed networking programs with configurable rotations and join limits.',
        sectionId: 'networking-sessions',
        href: '/dashboard/company/networking',
      },
      {
        name: 'Attendee experience',
        description: 'Digital business cards, profile sharing, and chat tools keep every connection actionable.',
        sectionId: 'networking-attendee-experience',
        href: '/dashboard/company/networking',
      },
      {
        name: 'Attendance controls',
        description: 'Automate penalties for repeated no-shows and manage eligibility for future sessions.',
        sectionId: 'networking-sessions',
        href: '/dashboard/company/networking',
      },
    ],
  },
  {
    label: 'Analytics & planning',
    items: [
      {
        name: 'Analytics & forecasting',
        description: 'Predict time-to-fill, offer acceptance, and pipeline conversion to forecast headcount.',
      },
      {
        name: 'Workforce analytics',
        description: 'Blend hiring and HRIS data to uncover attrition risks, mobility opportunities, and skill gaps.',
      },
      {
        name: 'Scenario planning',
        description: 'Model hiring freezes or acceleration plans with interactive dashboards by department, level, or location.',
      },
    ],
  },
  {
    label: 'Partnerships & sourcing',
    items: [
      {
        name: 'Headhunter program',
        description: 'Invite headhunters, share briefs, score performance, and manage commissions.',
        sectionId: 'partnerships-headhunter-program',
      },
      {
        name: 'Talent pools',
        description: 'Maintain silver medalists, alumni, referrals, and campus relationships.',
        sectionId: 'partnerships-talent-pools',
      },
      {
        name: 'Agency collaboration',
        description: 'Coordinate with partner agencies on SLAs, billing, and compliance.',
        sectionId: 'partnerships-agency-collaboration',
      },
      {
        name: 'Partner performance manager',
        description: 'Compare agencies, headhunters, and recruiters with leaderboards, SLAs, and ROI analytics.',
      },
    ],
  },
  {
    label: 'Brand & people',
    items: [
      {
        name: 'Employer brand & workforce intelligence',
        description:
          'Promote your culture, understand workforce trends, and connect hiring with employee experience data.',
      },
      {
        name: 'Employer brand studio',
        description: 'Company profile, culture stories, benefits, and employer marketing assets.',
        sectionId: 'employer-brand-studio',
      },
      {
        name: 'Employee journeys',
        description: 'Onboarding, internal mobility, and performance snapshots for HR teams.',
        sectionId: 'employee-journeys',
      },
      {
        name: 'Settings & governance',
        description: 'Calendar sync, permissions, integrations, compliance, and approvals.',
        sectionId: 'settings-governance',
      },
    ],
  },
  {
    label: 'Operations & governance',
    items: [
      {
        name: 'Calendar & communications',
        description: 'Sync recruiting calendars, digests, integrations, and cross-functional updates.',
      },
      {
        name: 'Settings & governance',
        description: 'Permissions, integrations, compliance, and approval workflows.',
      },
      {
        name: 'Governance & compliance',
        description: 'Maintain GDPR/CCPA compliance, accessibility standards, and equitable hiring policies.',
      },
    ],
  },
];

const availableDashboards = ['company', 'headhunter', 'user', 'agency'];
const LOOKBACK_OPTIONS = [30, 60, 90, 120];
const SUMMARY_ICONS = [
  BriefcaseIcon,
  UsersIcon,
  ClockIcon,
  EnvelopeOpenIcon,
  SparklesIcon,
  GlobeAltIcon,
  ClipboardDocumentCheckIcon,
];

function slugify(value) {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function formatNumber(value, { fallback = '—', suffix = '' } = {}) {
  if (value == null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${value}${suffix}`;
  }
  return `${numeric.toLocaleString()}${suffix}`;
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  const options = { minimumFractionDigits: 0, maximumFractionDigits: numeric % 1 === 0 ? 0 : 2 };
  return `$${numeric.toLocaleString(undefined, options)}`;
function formatCurrency(amount, currency = 'USD') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }
  const numeric = Number(amount);
  return `${currency} ${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
function slugify(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildSections(data) {
  if (!data) {
    return [];
  }

  const {
    pipelineSummary,
    diversity,
    alerts,
    jobDesign,
    sourcing,
    applicantRelationshipManager,
    analyticsForecasting,
    interviewOperations,
    interviewExperience,
    candidateExperience,
    offerOnboarding,
    candidateCare,
    partnerCollaboration,
    brandIntelligence,
    governance,
    calendar,
    jobSummary,
    projectSummary,
    recommendations,
    employerBrandWorkforce,
  } = data;

  const statusEntries = Object.entries(pipelineSummary?.byStatus ?? {});
  const statusBulletPoints = statusEntries.length
    ? statusEntries
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([status, count]) => `${status.replace(/_/g, ' ')} — ${formatNumber(count)}`)
    : ['No application activity recorded in this window.'];

  const diversityBreakdown = diversity?.breakdowns?.gender ?? [];
  const diversityPoints = diversityBreakdown.length
    ? [
        `Representation index: ${diversity?.representationIndex != null ? diversity.representationIndex.toFixed(2) : '—'}`,
        `Responses captured: ${formatNumber(diversity?.total)}`,
        ...diversityBreakdown.slice(0, 3).map((item) => `${item.label}: ${formatPercent(item.percentage)}`),
      ]
    : ['Capture optional demographic surveys to unlock representation reporting.'];

  const alertPoints = alerts?.items?.length
    ? [
        `Open alerts: ${formatNumber(alerts.open ?? 0)}`,
        `Critical issues: ${formatNumber(alerts.bySeverity?.critical ?? 0)}`,
        alerts.latestDetection ? `Latest detected: ${formatRelativeTime(alerts.latestDetection)}` : 'No recent alerts detected.',
      ]
    : ['No active alerts in this lookback window.'];

  const jobDesignPoints = jobDesign
    ? [
        `Approvals in flight: ${formatNumber(jobDesign.approvalsInFlight)}`,
        `Co-author sessions: ${formatNumber(jobDesign.coAuthorSessions)}`,
        `Structured stages: ${formatNumber(jobDesign.structuredStages)}`,
        `Compliance alerts: ${formatNumber(jobDesign.complianceAlerts)}`,
      ]
    : ['Track job approvals and compliance to surface design insights.'];

  const sourcingSources = sourcing?.sources?.length
    ? sourcing.sources.slice(0, 4).map((entry) => `${entry.source}: ${formatNumber(entry.count)} (${formatPercent(entry.percentage)})`)
    : ['No candidate source data captured in this window.'];

  const sourcingTotals = sourcing
    ? [
        `Campaign applications: ${formatNumber(sourcing.campaignTotals?.applications)}`,
        `Campaign hires: ${formatNumber(sourcing.campaignTotals?.hires)}`,
        `Average CPA: ${
          sourcing.averageCostPerApplication != null
            ? `$${Number(sourcing.averageCostPerApplication).toFixed(2)}`
            : '—'
        }`,
        `Hire contribution rate: ${formatPercent(sourcing.hireContributionRate)}`,
      ]
    : ['Activate campaign tracking to monitor sourcing ROI.'];

  const armPoints = applicantRelationshipManager
    ? [
        `Active candidates: ${formatNumber(applicantRelationshipManager.totalActiveCandidates)}`,
        `Nurture campaigns logged: ${formatNumber(applicantRelationshipManager.nurtureCampaigns)}`,
        `Follow-ups scheduled: ${formatNumber(applicantRelationshipManager.followUpsScheduled)}`,
        `Compliance reviews: ${formatNumber(applicantRelationshipManager.complianceReviews)}`,
      ]
    : ['Log nurture campaigns to power the applicant relationship manager.'];

  const forecastingPoints = analyticsForecasting
    ? [
        `Projected hires: ${formatNumber(analyticsForecasting.projectedHires)}`,
        `Estimated backlog: ${formatNumber(analyticsForecasting.backlog)}`,
        `Average time to fill: ${formatNumber(analyticsForecasting.timeToFillDays, { suffix: ' days' })}`,
        `Projects at risk: ${formatNumber(analyticsForecasting.atRiskProjects)}`,
      ]
    : ['Forecast models will appear once enough activity is captured.'];

  const schedulerMetrics = interviewExperience?.scheduler ?? {};
  const offerBridgeMetrics = interviewExperience?.offerBridge ?? {};
  const candidateCareCenterMetrics = interviewExperience?.candidateCareCenter ?? {};

  const interviewPoints = [
    `Upcoming interviews: ${formatNumber(
      schedulerMetrics.upcomingCount ?? interviewOperations?.upcomingCount,
    )}`,
    `Reminder coverage: ${formatPercent(schedulerMetrics.reminderCoverage)}`,
    `Availability coverage: ${formatPercent(schedulerMetrics.availabilityCoverage)}`,
    `Feedback logged: ${formatNumber(interviewOperations?.feedbackLogged)}`,
  ];

  const candidateExperiencePoints = [
    `Survey responses: ${formatNumber(candidateExperience?.responseCount)}`,
    `Avg satisfaction: ${formatNumber(candidateExperience?.averageScore)}`,
    `Candidate NPS: ${
      candidateExperience?.nps != null && Number.isFinite(Number(candidateExperience.nps))
        ? `${Number(candidateExperience.nps).toFixed(1)}`
        : '—'
    }`,
    `Follow-ups pending: ${formatNumber(candidateExperience?.followUpsPending)}`,
  ];

  const offerPoints = [
    `Open offers: ${formatNumber(offerOnboarding?.openOffers)}`,
    `Acceptance rate: ${formatPercent(offerOnboarding?.acceptanceRate)}`,
    `Approvals pending: ${formatNumber(offerBridgeMetrics.approvalsPending)}`,
    `Average days to start: ${formatNumber(offerOnboarding?.averageDaysToStart)}`,
  ];

  const carePoints = [
    `Satisfaction score: ${formatNumber(candidateCare?.satisfaction)}`,
    `Candidate NPS: ${
      candidateCare?.nps != null && Number.isFinite(Number(candidateCare.nps))
        ? `${Number(candidateCare.nps).toFixed(1)}`
        : '—'
    }`,
    `Follow-ups pending: ${formatNumber(candidateCare?.followUpsPending)}`,
    `Escalations: ${formatNumber(candidateCare?.escalations)}`,
  ];

  const headhunterDashboard = partnerCollaboration?.headhunterDashboard ?? null;
  const partnerPerformance = partnerCollaboration?.partnerPerformanceManager ?? null;
  const collaborationSuite = partnerCollaboration?.collaborationSuite ?? null;
  const partnerCalendarComms = partnerCollaboration?.calendarCommunications ?? null;

  const headhunterPoints = headhunterDashboard
    ? [
        `Open briefs shared: ${formatNumber(headhunterDashboard.stats?.openBriefs)}`,
        `Active submissions: ${formatNumber(headhunterDashboard.stats?.activeSubmissions)}`,
        `Interviews scheduled: ${formatNumber(headhunterDashboard.stats?.interviewsScheduled)}`,
        `Commission pipeline: ${formatCurrency(headhunterDashboard.stats?.totalCommissionValue)}`,
      ]
    : ['Share job briefs with headhunters to surface external recruiting analytics.'];

  const partnerPerformancePoints = partnerPerformance
    ? [
        partnerPerformance.leaderboard?.[0]
          ? `Top partner: ${partnerPerformance.leaderboard[0].name} (${formatPercent(partnerPerformance.leaderboard[0].conversionRate)})`
          : 'Activate performance tracking to populate leaderboards.',
        partnerPerformance.sla?.averages?.submissionToInterviewHours != null
          ? `Submission→interview SLA: ${formatNumber(partnerPerformance.sla.averages.submissionToInterviewHours, { suffix: ' hrs' })}`
          : 'Capture SLA snapshots to benchmark responsiveness.',
        `Commission liability: ${formatCurrency(partnerPerformance.roi?.totalCommission)}`,
        `Renewals this quarter: ${formatNumber(partnerPerformance.agreements?.renewals?.length ?? 0)}`,
      ]
    : ['Monitor partner SLAs and ROI once collaboration begins.'];

  const collaborationSuitePoints = collaborationSuite
    ? [
        `Active partner threads: ${formatNumber(collaborationSuite.activeThreads)}`,
        `Files shared: ${formatNumber(collaborationSuite.filesShared)}`,
        `Open escalations: ${formatNumber(collaborationSuite.escalationsOpen)}`,
        collaborationSuite.latestActivity?.[0]
          ? `Latest activity: ${collaborationSuite.latestActivity[0].eventType} • ${formatRelativeTime(collaborationSuite.latestActivity[0].occurredAt)}`
          : 'No recent partner activity logged.',
      ]
    : ['Enable partner messaging and audit trails to see collaboration insights.'];

  const partnerCalendarPoints = partnerCalendarComms
    ? [
        `Events this week: ${formatNumber(partnerCalendarComms.eventsThisWeek)}`,
        partnerCalendarComms.interviewLoad?.length
          ? `Next peak load: ${partnerCalendarComms.interviewLoad[0].date} (${formatNumber(partnerCalendarComms.interviewLoad[0].interviews)} interviews)`
          : 'No partner interviews scheduled in the next 7 days.',
        `Pending escalations: ${formatNumber(partnerCalendarComms.pendingEscalations)}`,
        partnerCalendarComms.weeklyDigest?.highlights?.[0] ?? 'Weekly digest will populate after first sync.',
      ]
    : ['Connect recruiting calendars and integrations to orchestrate partner communications.'];

  const calendarPoints = calendar?.upcoming?.length
    ? calendar.upcoming.slice(0, 3).map((event) => `${event.eventType} • ${formatAbsolute(event.startsAt)}`)
    : ['Connect your recruiting calendar to see upcoming events.'];

  const networking = data?.networking ?? {};
  const networkingSessions = networking.sessions ?? {};
  const networkingScheduling = networking.scheduling ?? {};
  const networkingMonetization = networking.monetization ?? {};
  const networkingPenalties = networking.penalties ?? {};
  const networkingAttendeeExperience = networking.attendeeExperience ?? {};
  const networkingCards = networking.digitalBusinessCards ?? {};
  const networkingVideo = networking.video ?? {};

  const hasSessionMetrics = Object.values(networkingSessions).some((value) => value != null);
  const rotationMinutes =
    networkingSessions.rotationDurationMinutes ?? networkingSessions.averageSlotMinutes ?? null;
  const networkingSessionPoints = hasSessionMetrics
    ? [
        `Active sessions: ${formatNumber(networkingSessions.active)}`,
        `Upcoming sessions: ${formatNumber(networkingSessions.upcoming)}`,
        `Default join limit: ${formatNumber(networkingSessions.defaultJoinLimit ?? networkingSessions.joinLimit)}`,
        rotationMinutes != null
          ? `Rotation cadence: ${formatNumber(rotationMinutes, { suffix: ' min slots' })}`
          : 'Rotation cadence: Configure 2 or 5 minute slots for every pairing.',
      ]
    : [
        'Create speed networking sessions with configurable join limits and pair rotations.',
        'Pick 2 or 5 minute slot lengths so each attendee gets equal time to pitch.',
        'Auto-shuffle matches until the host-defined session end time is reached.',
      ];

  const hasSchedulingData =
    Object.values(networkingScheduling).some((value) => value != null) ||
    Object.values(networkingMonetization).some((value) => value != null);
  const networkingSchedulingPoints = hasSchedulingData
    ? [
        `Pre-registrations confirmed: ${formatNumber(
          networkingScheduling.preRegistrations ?? networkingSessions.registered,
        )}`,
        `Waitlist size: ${formatNumber(networkingScheduling.waitlist ?? networkingSessions.waitlist)}`,
        `Paid vs free: ${formatNumber(networkingMonetization.paid)} paid • ${formatNumber(networkingMonetization.free)} free`,
        networkingScheduling.searches != null
          ? `Session searches this week: ${formatNumber(networkingScheduling.searches)}`
          : 'Search and filter upcoming sessions right after login.',
      ]
    : [
        'Schedule networking programs in advance with attendee pre-signups and automatic reminders.',
        'Choose whether a session is free or paid before seats open up.',
        'Let companies search the session directory to invite the right audiences.',
      ];

  const hasPenaltyData = Object.values(networkingPenalties).some((value) => value != null);
  const networkingPenaltyPoints = hasPenaltyData
    ? [
        `No-show rate: ${formatPercent(networkingPenalties.noShowRate)}`,
        `Active penalties: ${formatNumber(networkingPenalties.activePenalties)}`,
        `Restricted attendees: ${formatNumber(networkingPenalties.restrictedParticipants)}`,
        networkingPenalties.cooldownDays != null
          ? `Standard cooldown: ${formatNumber(networkingPenalties.cooldownDays, { suffix: ' days' })}`
          : 'Cooldown windows configured per workspace.',
      ]
    : [
        'Automatically flag no-shows and apply cooldown periods after repeated misses.',
        'Track penalty history before approving new sign-ups.',
        'Restrict networking access for attendees who exceed the no-show threshold.',
      ];

  const hasAttendeeCardData = Object.values(networkingCards).some((value) => value != null);
  const networkingDigitalCardPoints = hasAttendeeCardData
    ? [
        `Digital cards created: ${formatNumber(networkingCards.created)}`,
        `Updated this week: ${formatNumber(networkingCards.updatedThisWeek)}`,
        `Shared in session: ${formatNumber(networkingCards.sharedInSession)}`,
        networkingCards.templates != null
          ? `Available templates: ${formatNumber(networkingCards.templates)}`
          : 'Templates tailored for roles, industries, and partnership goals.',
      ]
    : [
        'Attendees design digital business cards before the session starts.',
        'Cards include contact details, elevator pitches, and optional attachments ready to share.',
        'One-click sharing delivers cards to current matches and post-session downloads.',
      ];

  const hasAttendeeExperienceData = Object.values(networkingAttendeeExperience).some((value) => value != null);
  const networkingConnectionPoints = hasAttendeeExperienceData
    ? [
        `Profiles shared: ${formatNumber(networkingAttendeeExperience.profilesShared)}`,
        `Connections saved: ${formatNumber(networkingAttendeeExperience.connectionsSaved)}`,
        `Chats sent per session: ${formatNumber(networkingAttendeeExperience.averageMessagesPerSession)}`,
        networkingAttendeeExperience.followUpsScheduled != null
          ? `Follow-ups scheduled: ${formatNumber(networkingAttendeeExperience.followUpsScheduled)}`
          : 'Encourage quick follow-ups with automated reminders.',
      ]
    : [
        'Share Gigvora profiles and digital cards directly within the networking room.',
        'Real-time chat lets attendees swap links, notes, and contact details.',
        'Save promising matches to revisit after the session wraps up.',
      ];

  const hasVideoData = Object.values(networkingVideo).some((value) => value != null);
  const networkingVideoPoints = hasVideoData
    ? [
        `Average call quality: ${formatPercent(networkingVideo.averageQualityScore)}`,
        `Browser load handled client-side: ${formatPercent(networkingVideo.browserLoadShare)}`,
        `Announcements broadcast: ${formatNumber(networkingVideo.hostAnnouncements)}`,
        networkingVideo.failoverRate != null
          ? `Failover rate: ${formatPercent(networkingVideo.failoverRate)}`
          : 'Failover protections keep rotations running smoothly.',
      ]
    : [
        'Browser-based video keeps networking lightweight with no downloads required.',
        'Hosts can broadcast announcements without interrupting rotations.',
        'Client-side load balancing maintains smooth connections even at scale.',
      ];

  const networkingAttendeeDetails = [
    {
      subtitle: 'Pre-session prep',
      title: 'Digital business cards',
      items: [
        'Collect preferred pronouns, focus areas, and goals for every attendee.',
        'Allow imports from existing Gigvora profiles or manual entry in minutes.',
        'Share cards instantly with matches or export to CRM tools after the event.',
      ],
    },
    {
      subtitle: 'Live collaboration',
      title: 'Chat & profile sharing',
      items: [
        'Drop Gigvora profiles or pitch decks into the chat without leaving the session.',
        'Balance speaking time automatically so each attendee gets half of the rotation.',
        'Hosts can pin prompts or resources to keep conversations focused.',
      ],
    },
    {
      subtitle: 'Video experience',
      title: 'Lightweight browser video',
      items: [
        'Our video service runs primarily in the browser to minimize infrastructure load.',
        'Automatic shuffling moves attendees to the next pairing when timers expire.',
        'Support for 2 or 5 minute slots keeps speed networking snappy and consistent.',
      ],
    },
  ];

  const brandStudio = data?.brandAndPeople?.employerBrandStudio;
  const journeysSummary = data?.brandAndPeople?.employeeJourneys;
  const settingsGovernance = data?.brandAndPeople?.settingsGovernance;

  const brandStudioPoints = brandStudio
    ? [
        `Profile completeness: ${formatPercent(brandStudio.profileCompleteness)}`,
        `Published assets live: ${formatNumber(brandStudio.publishedAssets)}`,
        brandStudio?.stories?.topStories?.[0]
          ? `Top story: ${brandStudio.stories.topStories[0].title}`
          : 'Publish a culture story to spotlight your team.',
        brandStudio?.benefits?.categories?.length
          ? `${formatNumber(brandStudio.benefits.categories.length)} benefit categories documented`
          : 'Document benefits to enrich offer packs.',
      ]
    : ['Publish culture stories and benefits to unlock brand analytics.'];

  const journeyPoints = journeysSummary
    ? [
        `Active programs: ${formatNumber(journeysSummary.totalPrograms)}`,
        `Employees in flight: ${formatNumber(journeysSummary.activeEmployees)}`,
        `Avg completion: ${formatPercent(journeysSummary.averageCompletionRate)}`,
        journeysSummary.programsAtRisk
          ? `${formatNumber(journeysSummary.programsAtRisk)} program(s) flagged for follow-up`
          : 'All journeys currently on track.',
      ]
    : ['Launch onboarding and mobility journeys to monitor employee progress.'];

  const settingsGovernancePoints = settingsGovernance
    ? [
        `Calendar sync: ${formatNumber(settingsGovernance.calendar?.connected ?? 0)} active / ${formatNumber(
          settingsGovernance.calendar?.totalConnections ?? 0,
        )} connected`,
        `Integrations live: ${formatNumber(settingsGovernance.integrations?.connected ?? 0)} of ${formatNumber(
          settingsGovernance.integrations?.total ?? 0,
        )}`,
        `Pending invites: ${formatNumber(settingsGovernance.permissions?.pendingInvites ?? 0)}`,
        settingsGovernance.compliance?.criticalAlerts
          ? `${formatNumber(settingsGovernance.compliance.criticalAlerts)} critical compliance alert(s)`
          : 'No critical compliance alerts.',
      ]
    : ['Connect integrations and calendar syncs to populate governance metrics.'];

  const brandWorkforce = employerBrandWorkforce ?? {};
  const profileStudio = brandWorkforce.profileStudio ?? {};
  const profileStudioCounts = profileStudio.counts ?? {};
  const profileStudioCampaigns = profileStudio.campaignSummary ?? {};
  const workforceAnalytics = brandWorkforce.workforceAnalytics ?? {};
  const mobilityProgram = brandWorkforce.internalMobility ?? {};
  const governanceCompliance = brandWorkforce.governanceCompliance ?? {};
  const governanceAccessibility = governanceCompliance.accessibility ?? {};

  const varianceValue =
    workforceAnalytics.planAlignment?.variance != null
      ? Number(workforceAnalytics.planAlignment.variance).toFixed(1)
      : null;

  const profileStudioPoints = [
    `Culture videos published: ${formatNumber(profileStudioCounts.cultureVideos)}`,
    `Team spotlights live: ${formatNumber(profileStudioCounts.teamSpotlights)}`,
    `Offices featured: ${formatNumber(profileStudioCounts.offices)}`,
    `Active campaigns: ${formatNumber(profileStudioCampaigns.active)}`,
  ];

  const workforceAnalyticsPoints = [
    `Attrition risk: ${formatPercent(workforceAnalytics.attritionRiskScore)}`,
    `Mobility opportunities: ${formatNumber(workforceAnalytics.mobilityOpportunities)}`,
    `Skill gap alerts: ${formatNumber(workforceAnalytics.skillGapAlerts)}`,
    `Headcount variance: ${
      varianceValue != null
        ? `${Number(varianceValue) >= 0 ? '+' : ''}${varianceValue} FTE`
        : '—'
    }`,
  ];

  const mobilityPoints = [
    `Open internal roles: ${formatNumber(mobilityProgram.openRoles)}`,
    `Internal applications: ${formatNumber(mobilityProgram.internalApplications)}`,
    `Referral conversion: ${formatPercent(mobilityProgram.referralConversionRate)}`,
    `Rewards issued: ${formatCurrency(mobilityProgram.rewardBudgetUsed)}`,
  ];

  const governanceCompliancePoints = [
    `Active policies: ${formatNumber(governanceCompliance.activePolicies)}`,
    `Regions covered: ${formatNumber(Object.keys(governanceCompliance.policiesByRegion ?? {}).length)}`,
    `Audits open: ${formatNumber(governanceCompliance.auditsOpen)}`,
    `Accessibility score: ${
      governanceAccessibility.averageScore != null ? `${governanceAccessibility.averageScore}/100` : '—'
    }`,
  ];

  const storytellingItems = profileStudio.featuredSections?.length
    ? profileStudio.featuredSections
        .slice(0, 5)
        .map((section) => `${section.typeLabel ?? 'Story'} — ${section.title}`)
    : ['Add featured sections to spotlight your teams, offices, and leadership stories.'];

  const campaignItems = profileStudioCampaigns.byChannel?.length
    ? profileStudioCampaigns.byChannel
        .slice(0, 5)
        .map(
          (entry) =>
            `${entry.channel} — ${formatCurrency(entry.spend)} • ${formatNumber(entry.hires)} hires • ${formatNumber(
              entry.applications,
            )} applications`,
        )
    : ['Track campaign performance across your paid, referral, and owned channels to see ROI.'];

  const cohortItems = workforceAnalytics.cohortComparisons?.length
    ? workforceAnalytics.cohortComparisons
        .slice(0, 5)
        .map((cohort) => {
          const retention = cohort.retentionRate != null ? formatPercent(cohort.retentionRate) : '—';
          const promotions = cohort.promotionRate != null ? formatPercent(cohort.promotionRate) : '—';
          return `${cohort.label} — Retention ${retention} • Promotions ${promotions}`;
        })
    : ['Connect HRIS cohort data to compare retention, performance, and promotion trends.'];

  const referralItems = mobilityProgram.leaderboard?.length
    ? mobilityProgram.leaderboard
        .slice(0, 5)
        .map(
          (referrer) =>
            `${referrer.name} — ${formatNumber(referrer.referrals)} referrals • ${formatNumber(
              referrer.rewardPoints,
            )} pts • ${formatCurrency(referrer.rewardAmount)}`,
        )
    : ['Launch referral challenges to unlock gamified leaderboards and payouts.'];

  const careerItems = mobilityProgram.careerProgress?.length
    ? mobilityProgram.careerProgress
        .slice(0, 5)
        .map((plan) => {
          const progressLabel =
            plan.progressPercent != null ? `${Number(plan.progressPercent).toFixed(0)}% complete` : 'In planning';
          return `${plan.employeeName} — ${plan.currentRole ?? 'Current role'} → ${plan.targetRole ?? 'Growth path'} (${progressLabel})`;
        })
    : ['Activate career pathing plans to personalise mobility journeys and learning recommendations.'];

  const learningItems = mobilityProgram.learningRecommendations?.length
    ? mobilityProgram.learningRecommendations.map((item) => `Learning: ${item}`)
    : [];

  const complianceItems = governanceCompliance.recentAudits?.length
    ? governanceCompliance.recentAudits
        .slice(0, 5)
        .map((audit) => {
          const findings = audit.findingsCount != null ? `${formatNumber(audit.findingsCount)} findings` : 'No findings logged';
          const statusLabel = audit.status ? audit.status.replace(/_/g, ' ') : 'Unknown';
          const formattedStatus = `${statusLabel.charAt(0).toUpperCase()}${statusLabel.slice(1)}`;
          return `${audit.auditType}${audit.region ? ` (${audit.region})` : ''} — ${formattedStatus} • ${findings}`;
        })
    : ['Document policy reviews and audit outcomes to maintain regional compliance coverage.'];

  const accessibilityItems = governanceAccessibility.recommendations?.length
    ? governanceAccessibility.recommendations.slice(0, 4).map((recommendation) => `Accessibility: ${recommendation}`)
    : [];

  const employerBrandDetailCards = [
    {
      title: 'Storytelling highlights',
      subtitle: 'Featured teams, offices & leaders',
      items: storytellingItems,
    },
    {
      title: 'Talent marketing performance',
      subtitle: 'Campaign ROI by channel',
      items: campaignItems,
    },
    {
      title: 'Cohort comparisons',
      subtitle: 'Retention & promotion benchmarks',
      items: cohortItems,
    },
    {
      title: 'Referral leaderboard',
      subtitle: 'Gamified progress & rewards',
      items: referralItems,
    },
    {
      title: 'Career pathing journeys',
      subtitle: 'Internal mobility & learning plans',
      items: [...careerItems.slice(0, 4), ...learningItems.slice(0, Math.max(0, 4 - careerItems.length))],
    },
    {
      title: 'Compliance & accessibility',
      subtitle: 'Audits, policies & remediation',
      items: [...complianceItems.slice(0, 4), ...accessibilityItems.slice(0, Math.max(0, 4 - complianceItems.length))],
    },
  ];

  const governancePoints = governance
    ? [
        `Pending approvals: ${formatNumber(governance.pendingApprovals)}`,
        `Critical alerts: ${formatNumber(governance.criticalAlerts)}`,
        `Workspace active: ${governance.workspaceActive ? 'Yes' : 'No'}`,
        governance.timezone ? `Primary timezone: ${governance.timezone}` : 'Set a default timezone for scheduling.',
      ]
    : ['Governance metrics appear once approvals and alerts are captured.'];

  const recommendationPoints = Array.isArray(recommendations) && recommendations.length
    ? recommendations.map((item) => item.title)
    : ['Keep capturing activity to surface recommended actions.'];

  const sections = [
    {
      title: 'Hiring overview',
      description: 'Pipeline health, hiring velocity, diversity metrics, and alerts.',
      features: [
        { name: 'Pipeline health', description: 'Stage distribution across the hiring funnel.', bulletPoints: statusBulletPoints },
        {
          name: 'Velocity & conversion',
          description: 'Measure time-to-hire and conversion rates across stages.',
          bulletPoints: [
            `Average days to decision: ${formatNumber(pipelineSummary?.velocity?.averageDaysToDecision)}`,
            `Median days to interview: ${formatNumber(pipelineSummary?.velocity?.medianDaysToInterview)}`,
            `Interview rate: ${formatPercent(pipelineSummary?.conversionRates?.interviewRate)}`,
            `Offer-to-hire: ${formatPercent(pipelineSummary?.conversionRates?.hireRate)}`,
          ],
        },
        {
          name: 'Diversity & inclusion',
          description: 'Monitor representation across self-reported demographics.',
          bulletPoints: diversityPoints,
        },
        {
          name: 'Alerts & risk',
          description: 'Track SLA breaches, compliance flags, and emerging issues.',
          bulletPoints: alertPoints,
        },
      ],
    },
    {
      title: 'Job design studio',
      description: 'Craft requisitions with collaborative approvals and compliance controls.',
      features: [
        {
          name: 'Design throughput',
          description: 'Keep requisitions flowing with cross-functional co-authoring.',
          bulletPoints: jobDesignPoints,
        },
        {
          name: 'Jobs management',
          description: 'Inventory of open jobs and gigs promoted to the market.',
          bulletPoints: [
            `Total roles: ${formatNumber(jobSummary?.total)}`,
            `Jobs vs gigs: ${formatNumber(jobSummary?.byType?.jobs)} jobs • ${formatNumber(jobSummary?.byType?.gigs)} gigs`,
            ...(jobSummary?.topLocations?.slice?.(0, 3).map((item) => `${item.location} — ${formatNumber(item.count)} openings`) ?? []),
          ],
        },
      ],
    },
    {
      title: 'Multi-channel sourcing',
      description: 'Publish requisitions across campaigns, referrals, and targeted pools.',
      features: [
        {
          name: 'Source mix',
          description: 'Top channels contributing applicants this period.',
          bulletPoints: sourcingSources,
        },
        {
          name: 'Campaign ROI',
          description: 'Spend, applications, and hires generated by tracked campaigns.',
          bulletPoints: sourcingTotals,
        },
      ],
    },
    {
      title: 'Applicant relationship manager',
      description: 'Nurture candidates, manage follow-ups, and stay compliant.',
      features: [
        {
          name: 'Pipeline engagement',
          description: 'Track nurture sequences and compliance tasks.',
          bulletPoints: armPoints,
        },
      ],
    },
    {
      title: 'Analytics & forecasting',
      description: 'Model hiring plans, forecast headcount, and spot delivery risks.',
      features: [
        {
          name: 'Planning insights',
          description: 'Forward-looking metrics for leadership reviews.',
          bulletPoints: forecastingPoints,
        },
        {
          name: 'Delivery readiness',
          description: 'Link project signals to hiring capacity.',
          bulletPoints: [
            `Projects active: ${formatNumber(projectSummary?.totals?.active)}`,
            `Planning pipeline: ${formatNumber(projectSummary?.totals?.planning)}`,
            `At-risk delivery: ${formatNumber(projectSummary?.totals?.atRisk)}`,
            `Automation-enabled: ${formatNumber(projectSummary?.automation?.automationEnabled)}`,
          ],
        },
      ],
    },
    {
      title: 'Interview excellence & candidate experience',
      description: 'Enable consistent, inclusive interviews with rich feedback loops.',
      component: {
        Component: InterviewExperienceSection,
        props: {
          data: interviewExperience,
          interviewOperations,
          candidateExperience,
          offerOnboarding,
        },
      },
      features: [
        {
          name: 'Interview operations',
          description: 'Scheduling health and interviewer readiness.',
          bulletPoints: interviewPoints,
        },
        {
          name: 'Experience insights',
          description: 'Candidate feedback and sentiment trends.',
          bulletPoints: candidateExperiencePoints,
        },
      ],
    },
    {
      title: 'Offer & onboarding bridge',
      description: 'Close candidates confidently and orchestrate day-one readiness.',
      features: [
        {
          name: 'Offer pipeline',
          description: 'Conversion, follow-ups, and start-date readiness.',
          bulletPoints: offerPoints,
        },
      ],
    },
    {
      title: 'Candidate care center',
      description: 'Deliver responsive, inclusive experiences throughout the journey.',
      features: [
        {
          name: 'Experience health',
          description: 'Satisfaction, NPS, and escalations in one view.',
          bulletPoints: carePoints,
        },
      ],
    },
    {
      id: 'networking-sessions',
      title: 'Networking sessions',
      description: 'Launch company-hosted speed networking with configurable rotations, monetization, and attendance controls.',
      features: [
        {
          name: 'Session builder',
          description: 'Design video-first networking programs with rotation timers and join limits tuned to your goals.',
          bulletPoints: networkingSessionPoints,
        },
        {
          name: 'Scheduling & monetization',
          description: 'Publish discoverable sessions, manage pre-registrations, and choose between free or paid access.',
          bulletPoints: networkingSchedulingPoints,
        },
        {
          name: 'Attendance controls',
          description: 'Capture check-ins, track penalties, and enforce cooldowns for repeat no-shows.',
          bulletPoints: networkingPenaltyPoints,
        },
      ],
    },
    {
      id: 'networking-attendee-experience',
      title: 'Networking attendee experience',
      description:
        'Equip every participant with digital business cards, lightweight browser video, and chat-powered follow-ups.',
      features: [
        {
          name: 'Digital business cards',
          description: 'Let attendees prepare shareable cards and pitches ahead of the networking session.',
          bulletPoints: networkingDigitalCardPoints,
        },
        {
          name: 'Connections & chat',
          description: 'Real-time chat, profile sharing, and saved connections keep momentum after each rotation.',
          bulletPoints: networkingConnectionPoints,
        },
        {
          name: 'Browser-based video',
          description: 'Gigvora’s client-side video service powers fast rotations without heavy infrastructure load.',
          bulletPoints: networkingVideoPoints,
        },
      ],
      details: networkingAttendeeDetails,
    },
    {
      title: 'Employer brand & workforce intelligence',
      description:
        'Promote your culture, understand workforce trends, and connect hiring with employee experience data.',
      features: [
        {
          name: 'Company profile studio',
          description:
            'Design immersive employer profiles with culture videos, benefits, DEI commitments, and team spotlights.',
          bulletPoints: profileStudioPoints,
        },
        {
          name: 'Workforce analytics',
          description: 'Blend hiring and HRIS data to uncover attrition risks, mobility opportunities, and skill gaps.',
          bulletPoints: workforceAnalyticsPoints,
        },
        {
          name: 'Internal mobility & referrals',
          description: 'Promote jobs internally, reward referrals, and manage career pathing across departments.',
          bulletPoints: mobilityPoints,
        },
        {
          name: 'Governance & compliance',
          description:
            'Maintain GDPR/CCPA compliance, accessibility standards, and equitable hiring policies across every region.',
          bulletPoints: governanceCompliancePoints,
        },
      ],
      details: employerBrandDetailCards,
    },
    {
      title: 'Headhunter & partner collaboration',
      description: 'Empower agencies and headhunters with shared accountability.',
      features: [
        {
          name: 'Headhunter dashboard',
          description: 'Job briefs, submissions, interviews, and commission visibility for external recruiters.',
          bulletPoints: headhunterPoints,
        },
        {
          name: 'Partner performance manager',
          description: 'Leaderboards, SLAs, ROI analytics, and renewal tracking across agencies and headhunters.',
          bulletPoints: partnerPerformancePoints,
        },
        {
          name: 'Collaboration suite',
          description: 'Secure messaging, file sharing, and decision threads with approvals and audit trails.',
          bulletPoints: collaborationSuitePoints,
        },
        {
          name: 'Calendar & communications',
          description: 'Shared recruiting calendar, integrations, and executive digests for partner programs.',
          bulletPoints: partnerCalendarPoints,
        },
      ],
    },
    {
      title: 'Calendar & communications',
      description: 'Coordinate interviews, events, and executive reviews.',
      features: [
        {
          name: 'Upcoming events',
          description: 'Recruiting calendar highlights and digests.',
          bulletPoints: calendarPoints,
        },
      ],
    },
    {
      id: 'brand-and-people-overview',
      title: 'Brand & people programs',
      description: 'Promote culture narratives, guide employee journeys, and keep governance healthy.',
      features: [
        {
          name: 'Employer brand studio',
          description: 'Manage culture stories, benefits, and employer assets in one workspace.',
          bulletPoints: brandStudioPoints,
        },
        {
          name: 'Employee journeys',
          description: 'Track onboarding, mobility, and performance snapshots for your workforce.',
          bulletPoints: journeyPoints,
        },
        {
          name: 'Settings & governance',
          description: 'Monitor calendar syncs, permissions, and integrations across the workspace.',
          bulletPoints: settingsGovernancePoints,
        },
      ],
    },
    {
      title: 'Governance & compliance',
      description: 'Stay audit-ready with approvals, policies, and accessibility checks.',
      features: [
        {
          name: 'Policy health',
          description: 'Ensure approvals, alerts, and workspace controls are on track.',
          bulletPoints: governancePoints,
        },
      ],
    },
  ];

  return sections.map((section) => ({
    ...section,
    id: section.id ?? slugify(section.title),
  }));
}

function buildProfile(data, summaryCards) {
  if (!data?.workspace) {
    return {
      name: 'Atlas Robotics',
      role: 'Global Talent Acquisition Team',
      initials: 'AR',
      status: 'Hiring across multiple regions',
      badges: ['Employer of choice', 'Diversity champion'],
      metrics: summaryCards.slice(0, 4).map((card) => ({ label: card.label, value: `${card.value}` })),
    };
  }

  const workspace = data.workspace;
  const profile = data.profile ?? {};
  const displayName = profile.companyName ?? workspace.name ?? 'Company';
  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 3)
    .toUpperCase();

  return {
    name: displayName,
    role: 'Talent acquisition workspace',
    initials,
    status: workspace.health?.badges?.[0] ?? 'Monitoring hiring performance',
    badges: workspace.health?.badges ?? [],
    metrics: summaryCards.slice(0, 4).map((card) => ({ label: card.label, value: `${card.value}` })),
  };
}

function MembershipList({ memberships }) {
  if (!memberships?.length) {
    return (
      <p className="text-sm text-blue-700">Enable additional workspace memberships to collaborate across programs.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {memberships.map((membership) => (
        <div
          key={membership.name}
          className="min-w-[200px] flex-1 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-blue-900">{membership.name}</p>
          <p className="mt-2 text-xs text-blue-700">{membership.description}</p>
          <div className="mt-3 flex items-center text-xs font-semibold">
            <span
              className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${membership.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
            />
            <span className={membership.active ? 'text-emerald-600' : 'text-slate-500'}>
              {membership.active ? 'Active membership' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentNotes({ items }) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">No partner notes captured in this window. Encourage your team to log updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.subject ? `${item.subject.firstName} ${item.subject.lastName}` : 'Contact update'}</p>
              <p className="mt-1 text-sm text-slate-600">{item.note}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-blue-600">
              {item.visibility}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{item.author ? `By ${item.author.firstName} ${item.author.lastName}` : 'System'}</span>
            <span aria-hidden="true">•</span>
            <span title={formatAbsolute(item.createdAt)}>{formatRelativeTime(item.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BrandAndPeopleSection({ data }) {
  if (!data) {
    return null;
  }

  const employerBrandStudio = data.employerBrandStudio ?? null;
  const employeeJourneys = data.employeeJourneys ?? null;
  const settingsGovernance = data.settingsGovernance ?? null;
  const pageWorkspace = employerBrandStudio?.pages ?? data.pageWorkspace ?? null;

  if (!employerBrandStudio && !employeeJourneys && !settingsGovernance) {
    return null;
  }

  const brandMetrics = [
    {
      label: 'Profile completeness',
      value: formatPercent(employerBrandStudio?.profileCompleteness),
    },
    {
      label: 'Published assets',
      value: formatNumber(employerBrandStudio?.publishedAssets),
    },
    {
      label: 'Avg asset engagement',
      value: formatNumber(employerBrandStudio?.averageAssetEngagement),
    },
    {
      label: 'Stories live',
      value: formatNumber(employerBrandStudio?.stories?.published),
    },
  ];

  const journeyMetrics = [
    {
      label: 'Active programs',
      value: formatNumber(employeeJourneys?.totalPrograms),
    },
    {
      label: 'Employees enrolled',
      value: formatNumber(employeeJourneys?.activeEmployees),
    },
    {
      label: 'Avg completion',
      value: formatPercent(employeeJourneys?.averageCompletionRate),
    },
    {
      label: 'Programs at risk',
      value: formatNumber(employeeJourneys?.programsAtRisk),
    },
  ];

  const governanceMetrics = [
    {
      label: 'Calendar connections',
      value: `${formatNumber(settingsGovernance?.calendar?.connected)} / ${formatNumber(
        settingsGovernance?.calendar?.totalConnections,
      )}`,
      helper: 'Active / total connections',
    },
    {
      label: 'Integrations live',
      value: `${formatNumber(settingsGovernance?.integrations?.connected)} / ${formatNumber(
        settingsGovernance?.integrations?.total,
      )}`,
      helper: 'Connected integrations',
    },
    {
      label: 'Pending invites',
      value: formatNumber(settingsGovernance?.permissions?.pendingInvites),
    },
    {
      label: 'Critical alerts',
      value: formatNumber(settingsGovernance?.compliance?.criticalAlerts),
    },
  ];

  const healthBadgeStyles = {
    on_track: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    at_risk: 'bg-amber-50 text-amber-600 border border-amber-200',
    needs_attention: 'bg-orange-50 text-orange-600 border border-orange-200',
    off_track: 'bg-rose-50 text-rose-600 border border-rose-200',
  };

  const pageMetrics = [
    {
      label: 'Pages live',
      value: formatNumber(pageWorkspace?.live ?? pageWorkspace?.published ?? 0),
      helper: 'Publicly available',
    },
    {
      label: 'Drafts in review',
      value: formatNumber(pageWorkspace?.inReview ?? pageWorkspace?.drafts ?? 0),
      helper: 'Awaiting approvals',
    },
    {
      label: 'Avg conversion',
      value: formatPercent(pageWorkspace?.averageConversionRate ?? pageWorkspace?.conversionRate ?? 0),
      helper: 'Explorer to lead',
    },
    {
      label: 'Follower reach',
      value: formatNumber(pageWorkspace?.totalFollowers ?? pageWorkspace?.followers ?? 0),
      helper: 'Across all pages',
    },
  ];

  const upcomingPageLaunches = pageWorkspace?.upcomingLaunches ?? pageWorkspace?.upcoming ?? [];
  const governanceSignals = pageWorkspace?.governance ?? {};

  return (
    <section
      id="brand-and-people"
      className="space-y-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Brand &amp; people</h2>
          <p className="mt-1 text-sm text-slate-600">
            Showcase your employer brand, orchestrate employee journeys, and keep governance signals in one place.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
          Workspace programs
        </span>
      </div>

      <div id="employer-brand-studio" className="space-y-4 rounded-3xl border border-blue-100 bg-blue-50/40 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-blue-900">Employer brand studio</h3>
            <p className="text-sm text-blue-700">
              Publish culture stories, benefits, and assets to elevate your employer reputation.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {brandMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-blue-900">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Top culture stories</h4>
            {employerBrandStudio?.stories?.topStories?.length ? (
              <ul className="mt-3 space-y-3">
                {employerBrandStudio.stories.topStories.map((story) => (
                  <li key={story.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-blue-900">{story.title}</p>
                      {story.engagementScore != null ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          {formatNumber(story.engagementScore)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-blue-700">
                      {story.authorName ? `By ${story.authorName}` : 'Team submission'} •{' '}
                      {story.publishedAt ? formatRelativeTime(story.publishedAt) : 'Unscheduled'}
                    </p>
                    {story.summary ? <p className="mt-2 text-sm text-blue-800">{story.summary}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-blue-700">
                Share your first culture story to engage candidates and employees.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Benefits spotlight</h4>
            {employerBrandStudio?.benefits?.categories?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {employerBrandStudio.benefits.categories.map((category) => (
                  <span
                    key={category.category}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-800"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {category.category} · {formatNumber(category.count)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-blue-700">Document benefits to share with candidates and employees.</p>
            )}

            {employerBrandStudio?.benefits?.featured?.length ? (
              <div className="mt-4 space-y-2">
                {employerBrandStudio.benefits.featured.map((benefit) => (
                  <div key={benefit.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-sm font-semibold text-blue-900">{benefit.title}</p>
                    <p className="text-xs text-blue-700">{benefit.category}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {employerBrandStudio?.highlights?.length ? (
              <ul className="mt-4 space-y-1 text-sm text-blue-800">
                {employerBrandStudio.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
      </div>
    </div>

      <div id="brand-pages" className="space-y-4 rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-indigo-900">Public pages studio</h3>
            <p className="text-sm text-indigo-700">
              Publish high-converting company and program destinations with approval workflows and analytics baked in.
            </p>
            {pageWorkspace?.lastPublishedAt ? (
              <p className="mt-1 text-xs text-indigo-600">
                Last launch {formatRelativeTime(pageWorkspace.lastPublishedAt)}
              </p>
            ) : null}
          </div>
          <Link
            to="/pages"
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-400 hover:text-indigo-900"
          >
            Open page studio
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pageMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-indigo-900">{metric.value}</p>
              <p className="mt-1 text-xs text-indigo-600">{metric.helper}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Upcoming launches</h4>
            <ul className="mt-3 space-y-3 text-sm text-indigo-800">
              {upcomingPageLaunches.slice(0, 4).map((item, index) => (
                <li key={item.id ?? item.slug ?? index} className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3">
                  <p className="text-sm font-semibold text-indigo-900">{item.title ?? item.name ?? 'Launch'}</p>
                  <p className="mt-1 text-xs text-indigo-600">
                    {item.launchDate ? `Launch ${formatAbsolute(item.launchDate)}` : 'Scheduling in progress'}
                    {item.owner ? ` • Owner ${item.owner}` : ''}
                  </p>
                  {item.status ? (
                    <span className="mt-2 inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  ) : null}
                </li>
              ))}
              {!upcomingPageLaunches.length ? (
                <li className="rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4 text-xs text-indigo-600">
                  No launches queued—create a page to start capturing demand.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Governance guardrails</h4>
            <ul className="mt-3 space-y-2 text-sm text-indigo-700">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Brand compliance status: {governanceSignals.brand ?? 'Aligned'}
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Accessibility automation: {governanceSignals.accessibility ?? 'AA contrast checks active'}
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Privacy reviews pending: {formatNumber(governanceSignals.privacyPending ?? 0)}
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Approvers assigned: {formatNumber(governanceSignals.approvers ?? governanceSignals.reviewers ?? 0)}
              </li>
            </ul>
            <p className="mt-3 text-xs text-indigo-600">
              Guardrails sync with Trust Centre policies and automatically enforce on every publish.
            </p>
          </div>
        </div>
      </div>

      <div id="employee-journeys" className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-emerald-900">Employee journeys</h3>
            <p className="text-sm text-emerald-700">
              Monitor onboarding, mobility, and performance programs for your workforce.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journeyMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-emerald-900">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Programs spotlight</h4>
          {employeeJourneys?.spotlightPrograms?.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-emerald-900">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-emerald-600">
                    <th className="px-3 py-2">Program</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Health</th>
                    <th className="px-3 py-2">Active</th>
                    <th className="px-3 py-2">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeJourneys.spotlightPrograms.map((program) => (
                    <tr key={program.id} className="border-t border-emerald-100">
                      <td className="px-3 py-2">
                        <p className="font-semibold">{program.title}</p>
                        <p className="text-xs text-emerald-600">{program.ownerName ?? 'No owner assigned'}</p>
                      </td>
                      <td className="px-3 py-2 capitalize">{program.programType?.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            healthBadgeStyles[program.healthStatus] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {program.healthStatus?.replace(/_/g, ' ') ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatNumber(program.activeEmployees)}</td>
                      <td className="px-3 py-2">{formatPercent(program.completionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-emerald-700">
              Activate onboarding or mobility journeys to track progress and surface insights.
            </p>
          )}

          {employeeJourneys?.highlights?.length ? (
            <ul className="mt-4 space-y-1 text-sm text-emerald-800">
              {employeeJourneys.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div id="settings-governance" className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Settings &amp; governance</h3>
            <p className="text-sm text-slate-600">
              Keep integrations healthy, calendar syncs current, and permissions aligned with policy.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {governanceMetrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{metric.value}</p>
              {metric.helper ? <p className="mt-1 text-xs text-slate-500">{metric.helper}</p> : null}
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Calendar sync</h4>
            <p className="mt-1 text-sm text-slate-600">
              Last synced {settingsGovernance?.calendar?.lastSyncedAt ? formatRelativeTime(settingsGovernance.calendar.lastSyncedAt) : '—'}
            </p>
            {settingsGovernance?.calendar?.primaryCalendars?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {settingsGovernance.calendar.primaryCalendars.map((calendar) => (
                  <li key={`${calendar.providerKey}-${calendar.primaryCalendar}`} className="flex flex-col rounded-xl bg-slate-50 p-3">
                    <span className="font-semibold">{calendar.primaryCalendar}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">{calendar.providerKey}</span>
                    <span className="mt-1 text-xs text-slate-500">Status: {calendar.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Connect a recruiting calendar to surface interview visibility.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Integrations</h4>
            {settingsGovernance?.integrations?.categories?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {settingsGovernance.integrations.categories.map((category) => (
                  <li key={category.category} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <span className="capitalize">{category.category.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-semibold text-slate-900">{formatNumber(category.count)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Connect HRIS, communication, and ATS integrations to streamline automation.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Highlights</h4>
            {settingsGovernance?.highlights?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {settingsGovernance.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Add integrations and finalize approvals to surface governance insights.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CompanyDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const workspaceSlugParam = searchParams.get('workspaceSlug');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Math.max(Number.parseInt(lookbackParam, 10) || 30, 7) : 30;

  const { data, error, loading, refresh, fromCache, lastUpdated, summaryCards } = useCompanyDashboard({
    workspaceId: workspaceIdParam,
    workspaceSlug: workspaceSlugParam,
    lookbackDays,
  });

  useEffect(() => {
    if (!workspaceIdParam && data?.meta?.selectedWorkspaceId) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', `${data.meta.selectedWorkspaceId}`);
        return next;
      }, { replace: true });
    }
  }, [workspaceIdParam, data?.meta?.selectedWorkspaceId, setSearchParams]);

  const sections = useMemo(() => buildSections(data), [data]);
  const profile = useMemo(() => buildProfile(data, summaryCards), [data, summaryCards]);
  const workspaceOptions = data?.meta?.availableWorkspaces ?? [];
  const memberships = data?.memberships ?? data?.meta?.memberships ?? [];
  const brandAndPeople = data?.brandAndPeople ?? null;

  const handleWorkspaceChange = (event) => {
    const nextWorkspaceId = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextWorkspaceId) {
      next.set('workspaceId', nextWorkspaceId);
      next.delete('workspaceSlug');
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next);
  };

  const handleLookbackChange = (event) => {
    const nextLookback = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextLookback) {
      next.set('lookbackDays', nextLookback);
    } else {
      next.delete('lookbackDays');
    }
    setSearchParams(next);
  };

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Company Talent Acquisition Hub"
      subtitle="Integrated ATS & partnerships"
      description="Everything hiring teams need to design jobs, run interviews, collaborate with headhunters, and promote a magnetic employer brand on Gigvora."
      menuSections={menuSections}
      profile={profile}
      availableDashboards={availableDashboards}
    >
      <div className="space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="workspace-select">
              Workspace
            </label>
            <select
              id="workspace-select"
              value={data?.meta?.selectedWorkspaceId ?? workspaceIdParam ?? ''}
              onChange={handleWorkspaceChange}
              className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select workspace</option>
              {workspaceOptions.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="lookback-select">
              Lookback window
            </label>
            <select
              id="lookback-select"
              value={lookbackDays}
              onChange={handleLookbackChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {LOOKBACK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option} days
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={() => refresh({ force: true })} />

        {error ? (
          <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error.message || 'Unable to load company dashboard data.'}
          </p>
        ) : null}

        <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-800">Your memberships</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Workspace access</span>
          </div>
          <div className="mt-4">
            <MembershipList memberships={memberships} />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card, index) => {
            const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length] ?? ClipboardDocumentCheckIcon;
            return (
              <div
                key={card.label}
                className="flex items-center justify-between rounded-3xl border border-blue-100 bg-white px-4 py-5 shadow-sm"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            );
          })}
        </div>

        <PartnershipsSourcingSection data={data?.partnerships} />
        {sections.map((section) => {
          const SectionComponent = section.component?.Component ?? null;
          return (
            <section
              key={section.title}
              id={section.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
                  {section.description ? (
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p>
                  ) : null}
                </div>
        <BrandAndPeopleSection data={brandAndPeople} />
        {data ? (
          <JobLifecycleSection
            jobLifecycle={data.jobLifecycle}
            recommendations={data.recommendations}
            lookbackDays={data?.meta?.lookbackDays ?? lookbackDays}
          />
        ) : null}

        {sections.map((section) => (
          <section
            key={section.title}
            id={section.id ?? slugify(section.title)}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(30,64,175,0.35)] sm:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{section.title}</h2>
                {section.description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{section.description}</p> : null}
              </div>

              {SectionComponent ? (
                <div className="mt-6">
                  <SectionComponent {...section.component.props} />
                </div>
              ))}
            </div>
            {section.details?.length ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.details.map((detail) => (
                  <div
                    key={detail.title}
                    className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div>
                      {detail.subtitle ? (
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{detail.subtitle}</p>
                      ) : null}
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{detail.title}</h3>
                      {detail.items?.length ? (
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {detail.items.map((item, index) => (
                            <li key={`${item}-${index}`} className="flex gap-2">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ))}
              ) : null}

              {section.features?.length ? (
                <div className={`mt-6 grid gap-4 ${section.features.length > 1 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
                  {section.features.map((feature) => (
                    <div
                      key={feature.name}
                      className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{feature.name}</h3>
                        {feature.description ? (
                          <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                        ) : null}
                        {feature.bulletPoints?.length ? (
                          <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            {feature.bulletPoints.map((point) => (
                              <li key={point} className="flex gap-2">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Partner timeline</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              Recent activity
            </span>
          </div>
          <RecentNotes items={data?.recentNotes ?? []} />
        </section>
      </div>
    </DashboardLayout>
  );
}

