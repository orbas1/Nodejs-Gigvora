import {
  User,
  Profile,
  FreelancerProfile,
  FreelancerAssignmentMetric,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { listFreelancerGigs } from './gigService.js';

const DEFAULT_GIG_BLUEPRINT = {
  title: 'Brand Identity Accelerator',
  tagline: 'Launch-ready visual systems in ten days',
  category: 'Branding & Identity',
  niche: 'Venture-backed startups',
  deliveryModel: 'Hybrid sprint with async reviews',
  outcomePromise: 'Investor-ready identity kit, launch assets, and usage playbook.',
  heroAccent: '#4f46e5',
  targetMetric: 12,
  packages: [
    {
      key: 'starter',
      name: 'Launch Lite',
      priceAmount: 450,
      priceCurrency: 'USD',
      deliveryDays: 5,
      revisionLimit: 1,
      highlights: ['Discovery workshop', 'Two identity concepts', 'Primary logo lockup'],
      recommendedFor: 'First-time founders preparing for launch',
      isPopular: false,
    },
    {
      key: 'growth',
      name: 'Growth Lab',
      priceAmount: 780,
      priceCurrency: 'USD',
      deliveryDays: 8,
      revisionLimit: 2,
      highlights: ['Logo suite & icon set', 'Color & typography system', 'Brand voice guardrails'],
      recommendedFor: 'Seed to Series A teams needing polish',
      isPopular: true,
    },
    {
      key: 'elite',
      name: 'Elite Experience',
      priceAmount: 1280,
      priceCurrency: 'USD',
      deliveryDays: 12,
      revisionLimit: 3,
      highlights: ['Brand guidelines', 'Social & deck templates', 'Motion starter kit'],
      recommendedFor: 'Scale-ups and venture studios',
      isPopular: false,
    },
  ],
  addOns: [
    {
      key: 'social-kit',
      name: 'Social story kit',
      priceAmount: 220,
      priceCurrency: 'USD',
      description: 'Ten editable launch templates for Instagram, LinkedIn, and TikTok.',
      isActive: true,
    },
    {
      key: 'landing-page',
      name: 'Landing page handoff',
      priceAmount: 320,
      priceCurrency: 'USD',
      description: 'Hero, pricing, and product sections prepped for Webflow or Framer.',
      isActive: true,
    },
  ],
  availability: {
    timezone: 'America/New_York',
    leadTimeDays: 2,
    slots: [],
  },
  banner: {
    headline: 'Standout branding in 10 days',
    subheadline: 'Signature identities for venture-backed founders',
    callToAction: 'Book discovery call',
    badge: 'Gigvora Elite',
    accentColor: '#4f46e5',
    backgroundStyle: 'aurora',
    testimonial: '“Riley helped us close our seed round with a pitch-perfect identity.”',
    testimonialAuthor: 'Nova Chen, Lumen Labs',
    waitlistEnabled: true,
  },
};

function normalizeFreelancerId(freelancerId) {
  if (freelancerId == null || freelancerId === '') {
    throw new ValidationError('freelancerId is required.');
  }
  const parsed = Number.parseInt(freelancerId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('freelancerId must be a positive integer.');
  }
  return parsed;
}

function buildMenuSections() {
  return [
    {
      label: 'Gig publishing',
      items: [
        {
          name: 'Post a gig',
          description: 'Launch new services with pricing matrices, calendars, and marketing banners.',
          href: '#gig-publisher',
        },
        {
          name: 'Pricing matrix',
          description: 'Design compelling tiered packages with highlights and delivery windows.',
          href: '#pricing-matrix',
        },
        {
          name: 'Availability calendar',
          description: 'Control your booking windows and readiness buffer in one place.',
          href: '#availability-calendar',
        },
        {
          name: 'Marketing banner',
          description: 'Craft a premium hero banner with call-to-action and social proof.',
          href: '#marketing-banner',
        },
      ],
    },
    {
      label: 'Growth levers',
      items: [
        {
          name: 'Conversion analytics',
          description: 'Track views-to-bookings and refine messaging in real time.',
        },
        {
          name: 'Client onboarding',
          description: 'Automate questionnaires, resource drops, and kickoff readiness checks.',
        },
      ],
    },
  ];
}

function buildProfileCard(user, profile, assignmentMetric) {
  const initials = `${(user.firstName || 'F')[0]}${(user.lastName || 'L')[0]}`.toUpperCase();
  const availabilityStatus = profile?.availabilityStatus ?? 'limited';
  const availabilityLabel = availabilityStatus.replace(/_/g, ' ');
  const metrics = [];

  if (assignmentMetric) {
    metrics.push({ label: 'Lifetime value', value: `$${Number(assignmentMetric.lifetimeCompletedValue || 0).toLocaleString()}` });
    metrics.push({ label: 'Completion rate', value: `${Math.round(Number(assignmentMetric.completionRate || 0) * 100) / 100}%` });
  }

  return {
    userId: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: profile?.headline || 'Independent specialist',
    initials,
    status: `Availability: ${availabilityLabel}`,
    badges: ['Marketplace ready', 'Verified identity'],
    metrics,
  };
}

function computePricingInsights(gigs) {
  if (!gigs.length) {
    return {
      totalGigs: 0,
      publishedCount: 0,
      draftCount: 0,
      averagePackagePrice: 0,
      addOnAttachRate: 0,
    };
  }

  const totalGigs = gigs.length;
  const publishedCount = gigs.filter((gig) => gig.status === 'published').length;
  const draftCount = gigs.filter((gig) => gig.status !== 'published').length;

  const packagePrices = gigs.flatMap((gig) => gig.packages.map((pkg) => pkg.priceAmount));
  const averagePackagePrice = packagePrices.length
    ? Math.round((packagePrices.reduce((sum, price) => sum + Number(price || 0), 0) / packagePrices.length) * 100) /
      100
    : 0;

  const addOns = gigs.flatMap((gig) => gig.addOns);
  const addOnAttachRate = gigs.length
    ? Math.round(((addOns.filter((addon) => addon.isActive).length / Math.max(addOns.length, 1)) || 0) * 100)
    : 0;

  return {
    totalGigs,
    publishedCount,
    draftCount,
    averagePackagePrice,
    addOnAttachRate,
  };
}

function computeNextAvailability(activeGig) {
  if (!activeGig) {
    return null;
  }
  const nextSlot = activeGig.availabilitySlots
    .filter((slot) => slot.isBookable)
    .map((slot) => ({ ...slot, dateTime: new Date(`${slot.date}T${slot.startTime}:00Z`) }))
    .sort((a, b) => a.dateTime - b.dateTime)[0];
  return nextSlot ? { date: nextSlot.date, startTime: nextSlot.startTime } : null;
}

function computeGigHealth(gig) {
  if (!gig) {
    return {
      readinessScore: 25,
      missing: ['Add your first gig to unlock publishing insights.'],
    };
  }

  let score = 30;
  const missing = [];

  if (gig.packages.length >= 3) {
    score += 25;
  } else {
    missing.push('Add at least three pricing packages.');
  }

  if (gig.addOns.length >= 1) {
    score += 10;
  } else {
    missing.push('Offer an add-on to increase booking value.');
  }

  if (gig.bannerSettings?.headline && gig.bannerSettings?.callToAction) {
    score += 10;
  } else {
    missing.push('Complete your marketing banner headline and call-to-action.');
  }

  if (gig.availabilitySlots.length >= 4) {
    score += 15;
  } else {
    missing.push('Schedule at least four availability windows.');
  }

  if (gig.status === 'published') {
    score += 10;
  } else {
    missing.push('Publish the gig to appear in marketplace search.');
  }

  return {
    readinessScore: Math.min(100, score),
    missing,
  };
}

export async function getFreelancerDashboard({ freelancerId, limitGigs = 10 } = {}) {
  const normalizedId = normalizeFreelancerId(freelancerId);

  const freelancer = await User.findByPk(normalizedId, {
    include: [
      { model: Profile },
      { model: FreelancerProfile },
      { association: 'assignmentMetric' },
    ],
  });

  if (!freelancer) {
    throw new NotFoundError('Freelancer profile could not be found.');
  }

  const gigs = await listFreelancerGigs(normalizedId, { limit: limitGigs });
  const activeGig = gigs[0] ?? null;
  const pricingInsights = computePricingInsights(gigs);
  const nextAvailability = computeNextAvailability(activeGig);
  const gigHealth = computeGigHealth(activeGig);

  const recentActivities = gigs.slice(0, 3).map((gig) => ({
    id: gig.id,
    title: gig.title,
    status: gig.status,
    updatedAt: gig.updatedAt,
    publishedAt: gig.publishedAt,
    readinessScore: computeGigHealth(gig).readinessScore,
  }));

  const profileCard = buildProfileCard(
    freelancer,
    freelancer.profile ?? freelancer.Profile ?? null,
    freelancer.assignmentMetric ?? null,
  );

  return {
    profile: profileCard,
    menuSections: buildMenuSections(),
    gigComposer: {
      defaults: DEFAULT_GIG_BLUEPRINT,
      gigs,
      activeGig,
      metrics: {
        ...pricingInsights,
        nextAvailability,
      },
      health: gigHealth,
      recentActivities,
    },
  };
}

export default {
  getFreelancerDashboard,
};
