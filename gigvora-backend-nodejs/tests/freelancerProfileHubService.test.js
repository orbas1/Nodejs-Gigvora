import { beforeEach, describe, expect, it } from '@jest/globals';
import freelancerProfileHubService from '../src/services/freelancerProfileHubService.js';
import {
  Profile,
  FreelancerProfile,
  FreelancerExpertiseArea,
  FreelancerSuccessMetric,
  FreelancerTestimonial,
  FreelancerHeroBanner,
} from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

describe('freelancerProfileHubService', () => {
  let user;
  let profile;
  let expertiseLive;
  let metricRetainers;
  let testimonialPublished;
  let heroBannerLive;

  beforeEach(async () => {
    user = await createUser({
      userType: 'freelancer',
      firstName: 'Riley',
      lastName: 'Morgan',
    });

    profile = await Profile.create({
      userId: user.id,
      headline: 'Lead Brand Designer',
      availabilityStatus: 'available',
      statusFlags: ['gigvora_elite', 'verified_pro'],
      launchpadEligibility: { status: 'eligible' },
      availabilityNotes: 'Books discovery calls on Tuesdays and Thursdays.',
    });

    await FreelancerProfile.create({
      userId: user.id,
      title: 'Lead Brand & Product Designer',
      hourlyRate: 140,
      availability: 'limited',
    });

    expertiseLive = await FreelancerExpertiseArea.create({
      profileId: profile.id,
      slug: 'signature-service',
      title: 'Signature service pillars',
      description: 'Core differentiators positioned for algorithm placement and client matching.',
      status: 'live',
      tags: ['Brand strategy', 'Product systems'],
      recommendations: ['Record hero demo'],
      tractionSnapshot: [
        { label: 'Weekly profile visits', value: '1800', tone: 'positive' },
      ],
      displayOrder: 0,
    });

    await FreelancerExpertiseArea.create({
      profileId: profile.id,
      slug: 'emerging-capabilities',
      title: 'Emerging capabilities',
      description: 'New skills under validation awaiting proof points.',
      status: 'in_progress',
      tags: ['Design ops audits'],
      recommendations: ['Publish case snippet'],
      tractionSnapshot: [
        { label: 'Brief requests', value: '6', tone: 'neutral' },
      ],
      displayOrder: 1,
    });

    metricRetainers = await FreelancerSuccessMetric.create({
      profileId: profile.id,
      metricKey: 'active_retainers',
      label: 'Active retainers',
      value: '4',
      numericValue: 4,
      deltaLabel: '+1 new partner',
      targetLabel: 'Target ≥ 3',
      trendDirection: 'up',
      breakdown: [{ label: 'Design ops pods', value: '2' }],
      displayOrder: 0,
    });

    await FreelancerSuccessMetric.create({
      profileId: profile.id,
      metricKey: 'launchpad_gigs',
      label: 'Launchpad gigs',
      value: '12',
      numericValue: 12,
      deltaLabel: '+3 vs last quarter',
      targetLabel: 'Target ≥ 10',
      trendDirection: 'up',
      breakdown: [{ label: 'Product orgs', value: '8' }],
      displayOrder: 1,
    });

    await FreelancerSuccessMetric.create({
      profileId: profile.id,
      metricKey: 'avg_csat',
      label: 'Avg. CSAT',
      value: '4.9/5',
      numericValue: 4.9,
      deltaLabel: '+0.2 rolling 90d',
      targetLabel: 'Target ≥ 4.8',
      trendDirection: 'steady',
      breakdown: [{ label: 'Promoters', value: '86%' }],
      displayOrder: 2,
    });

    await FreelancerSuccessMetric.create({
      profileId: profile.id,
      metricKey: 'revenue_90d',
      label: 'Net-new revenue (90d)',
      value: '$54.2k',
      numericValue: 54200,
      deltaLabel: '+18% vs prior period',
      targetLabel: 'Target ≥ $45k',
      trendDirection: 'up',
      breakdown: [{ label: 'Retainers', value: '$32k' }],
      displayOrder: 3,
    });

    testimonialPublished = await FreelancerTestimonial.create({
      profileId: profile.id,
      testimonialKey: 'summitops',
      clientName: 'Noah Patel',
      clientRole: 'Founder',
      clientCompany: 'SummitOps',
      projectName: 'B2B SaaS brand overhaul',
      quote:
        'Riley translated dense technical value props into a storytelling system that lifted conversions by 37%.',
      status: 'published',
      isFeatured: true,
      metrics: [
        { label: 'Featured on', value: 'Gigvora hero' },
      ],
      requestedAt: new Date('2024-06-01T12:00:00Z'),
      publishedAt: new Date('2024-07-01T12:00:00Z'),
      displayOrder: 0,
    });

    await FreelancerTestimonial.create({
      profileId: profile.id,
      testimonialKey: 'nova-commerce',
      clientName: 'Lena Ortiz',
      clientRole: 'COO',
      clientCompany: 'Nova Commerce',
      projectName: 'Product design ops accelerator',
      quote: 'Their sprint rituals unlocked a repeatable experimentation cadence for our team.',
      status: 'scheduled',
      metrics: [{ label: 'Delivery ETA', value: 'Due Aug 12' }],
      requestedAt: new Date('2024-08-12T15:00:00Z'),
      displayOrder: 1,
    });

    heroBannerLive = await FreelancerHeroBanner.create({
      profileId: profile.id,
      bannerKey: 'saas-launch-accelerator',
      title: 'SaaS launch accelerator',
      headline: 'Design systems that speed up product-market fit',
      audience: 'High-growth tech founders',
      callToActionLabel: 'Book strategy intensive',
      callToActionUrl: 'https://gigvora.example.com/cta',
      status: 'live',
      gradient: 'from-blue-500 via-indigo-500 to-violet-500',
      metrics: [
        { label: 'Monthly views', value: '6200' },
      ],
      lastLaunchedAt: new Date('2024-07-15T09:00:00Z'),
      displayOrder: 0,
    });

    await FreelancerHeroBanner.create({
      profileId: profile.id,
      bannerKey: 'healthcare-experience-lab',
      title: 'Healthcare experience lab',
      headline: 'Build trust-first patient portals & care journeys',
      audience: 'Healthcare scale-ups',
      callToActionLabel: 'Schedule discovery call',
      status: 'testing',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      metrics: [{ label: 'CTR', value: '3.1%' }],
      displayOrder: 1,
    });
  });

  it('returns aggregated profile data with derived summary metrics', async () => {
    const hub = await freelancerProfileHubService.getFreelancerProfileHub(user.id);

    expect(hub.sidebarProfile.name).toBe('Riley Morgan');
    expect(hub.sidebarProfile.metrics[0]).toMatchObject({ label: 'Active retainers', value: '4' });
    expect(hub.summary.heroBannersLive).toBe(1);
    expect(hub.summary.testimonialsPublished).toBe(1);
    expect(hub.expertiseAreas).toHaveLength(2);
    expect(hub.successMetrics).toHaveLength(4);
    expect(hub.testimonials[0].client).toBe('Noah Patel');
    expect(hub.heroBanners[0].title).toBe('SaaS launch accelerator');
    expect(hub.summary.nextTestimonialDueAt).toBe('2024-08-12T15:00:00.000Z');
  });

  it('updates collections with sanitisation, replacing missing records', async () => {
    const update = await freelancerProfileHubService.updateFreelancerProfileHub(user.id, {
      expertiseAreas: [
        {
          id: expertiseLive.id,
          title: 'Signature service pillars',
          description: 'Refined positioning for strategic retainers.',
          status: 'in_progress',
          tags: ['Brand strategy', 'Journey mapping'],
          recommendations: ['Publish new hero video'],
          traction: expertiseLive.tractionSnapshot,
          displayOrder: 0,
        },
        {
          title: 'AI enablement labs',
          description: 'Cross-functional pods focused on AI-assisted experimentation.',
          status: 'live',
          tags: ['AI design'],
          recommendations: ['Bundle with strategy workshops'],
          traction: [{ label: 'Pilot waitlist', value: '48 teams', tone: 'positive' }],
          displayOrder: 1,
        },
      ],
      successMetrics: [
        {
          id: metricRetainers.id,
          metricKey: 'active_retainers',
          label: 'Active retainers',
          value: '5',
          numericValue: 5,
          delta: '+2 contracts this month',
          target: 'Target ≥ 4',
          trend: 'up',
          breakdown: metricRetainers.breakdown,
          displayOrder: 0,
        },
      ],
      testimonials: [
        {
          id: testimonialPublished.id,
          testimonialKey: testimonialPublished.testimonialKey,
          client: testimonialPublished.clientName,
          role: testimonialPublished.clientRole,
          company: testimonialPublished.clientCompany,
          project: testimonialPublished.projectName,
          quote: testimonialPublished.quote,
          status: 'published',
          metrics: testimonialPublished.metrics,
          isFeatured: true,
          displayOrder: 0,
        },
        {
          client: 'Mira Chen',
          company: 'Brightline Health',
          role: 'Head of Marketing',
          project: 'Launchpad growth partnership',
          quote: 'Riley pairs design excellence with GTM empathy to ship data-backed narratives.',
          status: 'draft',
          metrics: [{ label: 'Next step', value: 'Record video snippet' }],
          displayOrder: 1,
        },
      ],
      heroBanners: [
        {
          id: heroBannerLive.id,
          bannerKey: heroBannerLive.bannerKey,
          title: heroBannerLive.title,
          headline: heroBannerLive.headline,
          audience: heroBannerLive.audience,
          status: 'testing',
          cta: {
            label: 'Book intensive',
            url: heroBannerLive.callToActionUrl,
          },
          gradient: heroBannerLive.gradient,
          metrics: heroBannerLive.metrics,
          displayOrder: 0,
        },
      ],
    });

    expect(update.expertiseAreas).toHaveLength(2);
    expect(update.expertiseAreas[0].status).toBe('in_progress');
    expect(update.successMetrics[0].value).toBe('5');
    expect(update.testimonials).toHaveLength(2);
    expect(update.heroBanners[0].status).toBe('testing');

    const expertiseCount = await FreelancerExpertiseArea.count({ where: { profileId: profile.id } });
    expect(expertiseCount).toBe(2);
    const heroCount = await FreelancerHeroBanner.count({ where: { profileId: profile.id } });
    expect(heroCount).toBe(1);
  });

  it('rejects unsupported statuses with validation errors', async () => {
    await expect(
      freelancerProfileHubService.updateFreelancerProfileHub(user.id, {
        expertiseAreas: [
          {
            title: 'Invalid status example',
            status: 'unknown',
            tags: [],
          },
        ],
      }),
    ).rejects.toThrow('Expertise area status must be one of');
  });
});
