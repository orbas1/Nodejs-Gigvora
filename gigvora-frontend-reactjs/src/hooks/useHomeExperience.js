import { useEffect, useMemo, useState } from 'react';
import { fetchSiteSettings, fetchSitePage } from '../services/publicSite.js';
import { listCreationStudioItems } from '../services/creationStudio.js';

function buildFallback() {
  return {
    settings: {
      heroHeadline: 'Build momentum with people who deliver.',
      heroSubheading:
        'Gigvora unites clients, teams, and independent talent inside one calm workspace so every initiative moves forward with confidence.',
      communityStats: [
        { label: 'Global specialists', value: '12,400+' },
        { label: 'Average NPS', value: '68' },
        { label: 'Completion rate', value: '97%' },
      ],
    },
    pageContent: null,
    creations: [],
    operationsSummary: {
      escrowHealth: {
        value: '99.2% uptime',
        change: '+1.4%',
        trend: [74, 82, 88, 91, 95, 98, 99],
      },
      disputeVelocity: {
        value: '3.2 hrs median',
        change: '-22%',
        trend: [18, 16, 14, 12, 9, 7, 6],
      },
      evidencePipelines: {
        value: '87% automated',
        change: '+9%',
        trend: [45, 48, 56, 62, 70, 78, 84],
      },
    },
    marketing: {},
  };
}

export default function useHomeExperience({ enabled = true, limit = 6 } = {}) {
  const [state, setState] = useState({
    loading: Boolean(enabled),
    error: null,
    data: buildFallback(),
    fromCache: false,
    lastUpdated: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState((current) => ({
        ...current,
        loading: false,
      }));
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const [settingsResult, pageResult, creationsResult] = await Promise.allSettled([
          fetchSiteSettings({ signal: controller.signal }),
          fetchSitePage('home', {}, { signal: controller.signal }).catch((error) => {
            if (error?.name === 'AbortError') {
              throw error;
            }
            return null;
          }),
          listCreationStudioItems(
            {
              status: 'published',
              limit,
              sort: '-publishedAt',
            },
            { signal: controller.signal },
          ),
        ]);

        if (!active) {
          return;
        }

        const settings =
          settingsResult.status === 'fulfilled' && settingsResult.value
            ? {
                heroHeadline: settingsResult.value?.heroHeadline ?? settingsResult.value?.hero?.headline,
                heroSubheading:
                  settingsResult.value?.heroSubheading ?? settingsResult.value?.hero?.subheading ?? undefined,
                communityStats: settingsResult.value?.communityStats ?? [],
                ...settingsResult.value,
              }
            : buildFallback().settings;

        const pageContent = pageResult.status === 'fulfilled' ? pageResult.value : null;

        const creations =
          creationsResult.status === 'fulfilled'
            ? creationsResult.value?.items ?? creationsResult.value ?? []
            : [];

        const operationsSummary =
          (settingsResult.status === 'fulfilled' && settingsResult.value?.operationsSummary) || buildFallback().operationsSummary;

        setState({
          loading: false,
          error: null,
          data: {
            settings,
            pageContent,
            creations,
            operationsSummary,
            marketing: settingsResult.status === 'fulfilled' ? settingsResult.value?.marketing ?? {} : {},
          },
          fromCache: false,
          lastUpdated: new Date(),
        });
      } catch (err) {
        if (!active && err?.name === 'AbortError') {
          return;
        }
        setState({
          loading: false,
          error: err,
          data: buildFallback(),
          fromCache: true,
          lastUpdated: new Date(),
        });
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, limit]);

  const data = useMemo(() => state.data ?? buildFallback(), [state.data]);

  const refresh = async () => {
    setState((current) => ({ ...current, loading: true }));
    const controller = new AbortController();
    try {
      const [settings, page, creations] = await Promise.all([
        fetchSiteSettings({ signal: controller.signal }),
        fetchSitePage('home', {}, { signal: controller.signal }).catch(() => null),
        listCreationStudioItems(
          {
            status: 'published',
            limit,
            sort: '-publishedAt',
          },
          { signal: controller.signal },
        ),
      ]);
      setState({
        loading: false,
        error: null,
        data: {
          settings: {
            heroHeadline: settings?.heroHeadline ?? settings?.hero?.headline ?? data.settings.heroHeadline,
            heroSubheading:
              settings?.heroSubheading ?? settings?.hero?.subheading ?? data.settings.heroSubheading,
            communityStats: settings?.communityStats ?? data.settings.communityStats,
            ...settings,
          },
          pageContent: page,
          creations: creations?.items ?? creations ?? [],
          operationsSummary: settings?.operationsSummary ?? data.operationsSummary ?? buildFallback().operationsSummary,
          marketing: settings?.marketing ?? data.marketing ?? {},
        },
        fromCache: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error,
        fromCache: true,
        lastUpdated: new Date(),
      }));
      throw error;
    }
  };

  return {
    loading: state.loading,
    error: state.error,
    data,
    fromCache: state.fromCache,
    lastUpdated: state.lastUpdated,
    refresh,
  };
}
