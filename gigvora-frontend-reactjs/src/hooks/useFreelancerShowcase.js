import { useCallback, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchFreelancerShowcase,
  updateFreelancerShowcaseModule,
  reorderFreelancerShowcaseModules,
  updateFreelancerShowcaseHero,
} from '../services/freelancerShowcase.js';

const FALLBACK_SHOWCASE = Object.freeze({
  hero: {
    headline: 'Bring enterprise clarity to every engagement.',
    subheadline: 'A multimedia introduction tailored for strategic operators and growth partners.',
    ctaLabel: 'View portfolio',
    ctaUrl: 'https://app.gigvora.com/freelancers/demo/portfolio',
    published: true,
    mediaUrl: 'https://images.gigvora.com/demo/hero-cover.jpg',
  },
  modules: [
    {
      id: 'module-spotlight',
      type: 'spotlight',
      title: 'Spotlight: Lumina Health transformation',
      summary: 'Scaled customer operations across 12 markets with a blended onshore / offshore model.',
      published: true,
      metrics: [
        { label: 'NPS uplift', value: '+38' },
        { label: 'Launch velocity', value: '8 weeks' },
      ],
    },
    {
      id: 'module-gallery',
      type: 'gallery',
      title: 'Gallery: Delivery artefacts',
      summary: 'Annotated artefacts from discovery sprints and service blueprinting sessions.',
      published: true,
      assets: 6,
    },
    {
      id: 'module-reel',
      type: 'video',
      title: 'Operations keynote reel',
      summary: 'Conference talks and webinars on resilient service design.',
      published: false,
      duration: '12m',
    },
  ],
  feed: {
    posts: [
      {
        id: 'post-1',
        title: 'Template drop: Customer stability cockpit',
        publishedAt: new Date().toISOString(),
      },
      {
        id: 'post-2',
        title: 'Case study: Payments risk remediation',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
    ],
  },
  recommendations: [
    { id: 'profile-noah', name: 'Noah Kim', role: 'AI Product Strategist' },
    { id: 'profile-priya', name: 'Priya Desai', role: 'Service Design Lead' },
    { id: 'profile-gina', name: 'Gina Rodriguez', role: 'Growth Marketing Architect' },
  ],
});

export default function useFreelancerShowcase({ freelancerId, enabled = true } = {}) {
  const [updatingModuleId, setUpdatingModuleId] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [updatingHero, setUpdatingHero] = useState(false);

  const safeId = freelancerId ?? 'demo-showcase';

  const fetcher = useCallback(
    ({ signal, force } = {}) => {
      if (!freelancerId || !enabled) {
        return Promise.resolve(FALLBACK_SHOWCASE);
      }
      return fetchFreelancerShowcase(freelancerId, { signal, fresh: Boolean(force) });
    },
    [enabled, freelancerId],
  );

  const resource = useCachedResource(`freelancer:showcase:${safeId}`, fetcher, {
    enabled,
    dependencies: [safeId],
    ttl: 1000 * 60,
  });

  const showcase = resource.data ?? FALLBACK_SHOWCASE;

  const refresh = useCallback((options) => resource.refresh(options), [resource]);

  const updateModule = useCallback(
    async (moduleId, payload = {}) => {
      if (!freelancerId) {
        return { fallback: true };
      }
      setUpdatingModuleId(moduleId);
      try {
        const result = await updateFreelancerShowcaseModule(freelancerId, moduleId, payload);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setUpdatingModuleId(null);
      }
    },
    [freelancerId, refresh],
  );

  const reorderModules = useCallback(
    async (order) => {
      if (!freelancerId) {
        return { fallback: true };
      }
      setReordering(true);
      try {
        const result = await reorderFreelancerShowcaseModules(freelancerId, order);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setReordering(false);
      }
    },
    [freelancerId, refresh],
  );

  const updateHero = useCallback(
    async (payload = {}) => {
      if (!freelancerId) {
        return { fallback: true };
      }
      setUpdatingHero(true);
      try {
        const result = await updateFreelancerShowcaseHero(freelancerId, payload);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setUpdatingHero(false);
      }
    },
    [freelancerId, refresh],
  );

  return useMemo(
    () => ({
      ...resource,
      showcase,
      modules: showcase.modules ?? [],
      hero: showcase.hero ?? null,
      feed: showcase.feed ?? { posts: [] },
      recommendations: showcase.recommendations ?? [],
      updateModule,
      reorderModules,
      updateHero,
      updatingModuleId,
      reordering,
      updatingHero,
      refresh,
    }),
    [resource, showcase, updateModule, reorderModules, updateHero, updatingModuleId, reordering, updatingHero, refresh],
  );
}
