function daysFromNow(days) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now.toISOString();
}

function buildStageMetrics() {
  return {
    ready: {
      count: 2,
      pipelineValue: 18000,
      aiCue: 'Two fresh leads are waiting for profile confirmation and pricing review.',
    },
    applied: {
      count: 3,
      pipelineValue: 32000,
      aiCue: 'Send tailored follow-ups for three recent applications to stay top of mind.',
    },
    interviewing: {
      count: 2,
      pipelineValue: 26000,
      aiCue: 'Prep interview briefs so panels understand your delivery approach.',
    },
    offer: {
      count: 1,
      pipelineValue: 18000,
      aiCue: 'Coordinate with your talent partner on the open offer and confirm legal review.',
    },
    kickoff: {
      count: 1,
      pipelineValue: 24000,
      aiCue: 'Share the kickoff checklist and align on milestone owners before day one.',
    },
  };
}

export function buildFreelancerPipelineSample() {
  const stageMetrics = buildStageMetrics();

  const deals = [
    {
      id: 'deal-ready-1',
      title: 'Climate analytics retainer',
      company: 'Aurora Labs',
      pipelineValue: 9000,
      probability: 0.25,
      stageId: 'ready',
      nextFollowUpAt: daysFromNow(2),
      expectedCloseDate: daysFromNow(21),
      notes: 'Talent partner requested updated climate case study.',
    },
    {
      id: 'deal-ready-2',
      title: 'Creator automation sprint',
      company: 'Northshore Collective',
      pipelineValue: 9000,
      probability: 0.2,
      stageId: 'ready',
      nextFollowUpAt: daysFromNow(4),
      expectedCloseDate: daysFromNow(25),
      notes: 'Waiting on updated scope from marketing lead.',
    },
    {
      id: 'deal-applied-1',
      title: 'Product marketing revamp',
      company: 'Helios Mobility',
      pipelineValue: 11000,
      probability: 0.35,
      stageId: 'applied',
      nextFollowUpAt: daysFromNow(1),
      expectedCloseDate: daysFromNow(18),
      notes: 'Share Loom walkthrough with success metrics by Tuesday.',
    },
    {
      id: 'deal-applied-2',
      title: 'Lifecycle automation program',
      company: 'Voyage Fintech',
      pipelineValue: 12000,
      probability: 0.45,
      stageId: 'applied',
      nextFollowUpAt: daysFromNow(3),
      expectedCloseDate: daysFromNow(28),
      notes: 'Finance requested revised pricing tiers before procurement review.',
    },
    {
      id: 'deal-applied-3',
      title: 'Community growth accelerator',
      company: 'Beacon Retail',
      pipelineValue: 9000,
      probability: 0.4,
      stageId: 'applied',
      nextFollowUpAt: daysFromNow(5),
      expectedCloseDate: daysFromNow(30),
      notes: 'Send updated testimonial deck after upcoming livestream.',
    },
    {
      id: 'deal-interview-1',
      title: 'Brand growth partnership',
      company: 'Polaris Ventures',
      pipelineValue: 14000,
      probability: 0.6,
      stageId: 'interviewing',
      nextFollowUpAt: daysFromNow(0),
      expectedCloseDate: daysFromNow(14),
      notes: 'Panel wants deeper dive on analytics roadmap—prep slides.',
    },
    {
      id: 'deal-interview-2',
      title: 'Demand gen experiment pod',
      company: 'Atlas Systems',
      pipelineValue: 12000,
      probability: 0.55,
      stageId: 'interviewing',
      nextFollowUpAt: daysFromNow(2),
      expectedCloseDate: daysFromNow(16),
      notes: 'Coach requests case study on account-based marketing uplift.',
    },
    {
      id: 'deal-offer-1',
      title: 'Growth advisory retainer',
      company: 'Summit Health',
      pipelineValue: 18000,
      probability: 0.75,
      stageId: 'offer',
      nextFollowUpAt: daysFromNow(1),
      expectedCloseDate: daysFromNow(7),
      notes: 'Legal review in progress—talent partner drafting counters.',
    },
    {
      id: 'deal-kickoff-1',
      title: 'Experience redesign sprint',
      company: 'Beacon Retail',
      pipelineValue: 24000,
      probability: 0.95,
      stageId: 'kickoff',
      nextFollowUpAt: daysFromNow(-1),
      expectedCloseDate: daysFromNow(3),
      notes: 'Kickoff deck ready—confirm analytics owner before meeting.',
    },
  ];

  const followUps = [
    {
      id: 'follow-hel',
      dealId: 'deal-applied-1',
      stageId: 'applied',
      subject: 'Send Loom walkthrough and ROI dashboard',
      dueAt: daysFromNow(1),
      channel: 'email',
      link: '/inbox?compose=helio',
    },
    {
      id: 'follow-pol',
      dealId: 'deal-interview-1',
      stageId: 'interviewing',
      subject: 'Upload analytics roadmap slides before panel',
      dueAt: daysFromNow(0),
      channel: 'document',
      link: '/dashboard/freelancer/projects?view=briefs',
    },
    {
      id: 'follow-sum',
      dealId: 'deal-offer-1',
      stageId: 'offer',
      subject: 'Coordinate counterproposal with talent partner',
      dueAt: daysFromNow(1),
      channel: 'call',
      link: '/inbox?thread=summit-offer',
    },
    {
      id: 'follow-bea',
      dealId: 'deal-kickoff-1',
      stageId: 'kickoff',
      subject: 'Confirm kickoff agenda and milestone owners',
      dueAt: daysFromNow(-1),
      channel: 'meeting',
      link: '/calendar',
    },
  ];

  return {
    summary: {
      openDeals: 8,
      offers: 1,
      wonThisQuarter: 3,
      pipelineValue: 118000,
      weightedPipelineValue: 81200,
      followUpsDue: followUps.filter((item) => new Date(item.dueAt) <= new Date(daysFromNow(2))).length,
      interviewsScheduled: stageMetrics.interviewing.count,
    },
    stageMetrics,
    deals,
    followUps,
    analytics: {
      winRate: 48,
      velocityDays: 19,
      conversionTrend: 6,
      activeCampaigns: 3,
    },
  };
}

export default buildFreelancerPipelineSample;
