import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchFreelancerPortfolio,
  createFreelancerPortfolioItem,
  updateFreelancerPortfolioItem,
  deleteFreelancerPortfolioItem,
  createFreelancerPortfolioAsset,
  updateFreelancerPortfolioAsset,
  deleteFreelancerPortfolioAsset,
  updateFreelancerPortfolioSettings,
} from '../services/freelancerPortfolio.js';
import apiClient from '../services/apiClient.js';

const FALLBACK_PORTFOLIO = Object.freeze({
  items: [
    {
      id: 'demo-1',
      title: 'Transformation roadmap for Lumina Health',
      slug: 'transformation-roadmap-lumina-health',
      tagline: 'Enterprise service redesign across 12 workflows.',
      clientName: 'Lumina Health',
      clientIndustry: 'Healthcare',
      role: 'Fractional product strategy lead',
      summary:
        'Orchestrated an enterprise-wide service redesign, aligning clinical, billing, and digital touchpoints with measurable adoption KPIs.',
      impactMetrics: [
        { label: 'Launch velocity', value: '8 weeks', tone: 'positive' },
        { label: 'CSAT', value: '4.9 / 5', tone: 'positive' },
        { label: 'Operational savings', value: '$2.3M annually', tone: 'positive' },
      ],
      tags: ['Service design', 'Product operations'],
      industries: ['Healthcare'],
      services: ['Strategy', 'Research', 'Enablement'],
      technologies: ['Notion', 'Figma', 'Amplitude'],
      status: 'published',
      visibility: 'public',
      isFeatured: true,
      assets: [
        {
          id: 'asset-demo-1',
          label: 'Before / after journey map',
          url: 'https://example.com/assets/journey-map.png',
          assetType: 'image',
          sortOrder: 0,
          isPrimary: true,
        },
      ],
      previewUrl: 'https://app.gigvora.com/freelancers/demo/portfolio/transformation-roadmap-lumina-health',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
  settings: {
    heroHeadline: 'Designing resilient products and services for regulated industries.',
    heroSubheadline: 'Case studies and delivery playbooks from strategic product leadership engagements.',
    defaultVisibility: 'public',
    allowPublicDownload: false,
    autoShareToFeed: true,
    showMetrics: true,
    showTestimonials: true,
    showContactButton: true,
    contactEmail: 'hello@example.com',
    schedulingLink: 'https://cal.com/demo',
    brandAccentColor: '#1f2937',
    previewBasePath: '/freelancers/demo/portfolio',
    customDomain: null,
  },
  summary: {
    total: 1,
    published: 1,
    drafts: 0,
    archived: 0,
    featured: 1,
    assetCount: 1,
    networkVisible: 1,
    previewBaseUrl: 'https://app.gigvora.com/freelancers/demo/portfolio',
    lastUpdatedAt: new Date(),
  },
});

export default function useFreelancerPortfolio({ freelancerId, enabled = true } = {}) {
  const safeId = freelancerId ? String(freelancerId) : 'demo';
  const canRequest = Boolean(freelancerId) && enabled;

  const fetcher = useCallback(
    async ({ signal, force } = {}) => {
      if (!canRequest) {
        return FALLBACK_PORTFOLIO;
      }
      const data = await fetchFreelancerPortfolio(freelancerId, { signal, fresh: Boolean(force) });
      return data ?? FALLBACK_PORTFOLIO;
    },
    [canRequest, freelancerId],
  );

  const resource = useCachedResource(`freelancer:portfolio:${safeId}`, fetcher, {
    enabled,
    dependencies: [safeId],
    ttl: 1000 * 60,
  });

  const invalidate = useCallback(() => {
    apiClient.removeCache(`freelancer:portfolio:${safeId}`);
  }, [safeId]);

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      const result = await resource.refresh({ force });
      return result;
    },
    [resource],
  );

  const withRefresh = useCallback(
    async (operation) => {
      const result = await operation();
      invalidate();
      await refresh({ force: true });
      return result;
    },
    [invalidate, refresh],
  );

  const actions = useMemo(() => {
    if (!freelancerId) {
      return {
        async createItem() {
          throw new Error('Freelancer ID is required to create a portfolio item.');
        },
        async updateItem() {
          throw new Error('Freelancer ID is required to update a portfolio item.');
        },
        async deleteItem() {
          throw new Error('Freelancer ID is required to delete a portfolio item.');
        },
        async createAsset() {
          throw new Error('Freelancer ID is required to create a portfolio asset.');
        },
        async updateAsset() {
          throw new Error('Freelancer ID is required to update a portfolio asset.');
        },
        async deleteAsset() {
          throw new Error('Freelancer ID is required to delete a portfolio asset.');
        },
        async updateSettings() {
          throw new Error('Freelancer ID is required to update portfolio settings.');
        },
      };
    }

    return {
      createItem: (payload) =>
        withRefresh(() => createFreelancerPortfolioItem(freelancerId, payload ?? {})),
      updateItem: (portfolioId, payload) =>
        withRefresh(() => updateFreelancerPortfolioItem(freelancerId, portfolioId, payload ?? {})),
      deleteItem: (portfolioId) => withRefresh(() => deleteFreelancerPortfolioItem(freelancerId, portfolioId)),
      createAsset: (portfolioId, payload) =>
        withRefresh(() => createFreelancerPortfolioAsset(freelancerId, portfolioId, payload ?? {})),
      updateAsset: (portfolioId, assetId, payload) =>
        withRefresh(() => updateFreelancerPortfolioAsset(freelancerId, portfolioId, assetId, payload ?? {})),
      deleteAsset: (portfolioId, assetId) =>
        withRefresh(() => deleteFreelancerPortfolioAsset(freelancerId, portfolioId, assetId)),
      updateSettings: (payload) =>
        withRefresh(() => updateFreelancerPortfolioSettings(freelancerId, payload ?? {})),
    };
  }, [freelancerId, withRefresh]);

  return useMemo(
    () => ({
      ...resource,
      refresh,
      actions,
      data: resource.data ?? FALLBACK_PORTFOLIO,
    }),
    [actions, refresh, resource],
  );
}
