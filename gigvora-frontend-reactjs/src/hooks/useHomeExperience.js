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
      heroPersonaChips: [
        'Founders orchestrating cross-functional squads',
        'Agencies scaling delivery pods with trust guardrails',
        'Mentors, operators, and advisors guiding cohorts',
        'Recruiters and talent leads hiring with real-time telemetry',
      ],
      heroInsightStats: [
        {
          id: 'global-network',
          label: 'Global network',
          value: '7,800+ mentors & specialists',
          helper: 'Curated pods across 60+ countries keep every launch moving.',
        },
        {
          id: 'cycle-time',
          label: 'Cycle-time gains',
          value: '38% faster programme launches',
          helper: 'Unified rituals and playbooks streamline every mission.',
        },
        {
          id: 'trust-score',
          label: 'Enterprise trust',
          value: '99.95% uptime · SOC2 monitored',
          helper: 'Treasury, legal, and risk automation built into every workflow.',
        },
      ],
      heroValuePillars: [
        {
          id: 'command-centre',
          title: 'One command centre for every mission',
          description:
            'Run launches, mentoring, and operations from a single glassmorphic HQ with telemetry every stakeholder trusts.',
          highlights: [
            'Real-time launchpad, finance, and compliance visibility for every persona',
            'Async rituals, pulse digests, and AI nudges keep crews accountable across timezones',
          ],
          metric: { label: 'Operational clarity', value: '8.6/10 team confidence score' },
          icon: 'SparklesIcon',
          action: { id: 'command-centre', label: 'Explore HQ playbook', href: '/platform/command-centre' },
        },
        {
          id: 'compliance-trust',
          title: 'Enterprise trust without slowdowns',
          description:
            'Treasury, legal, and risk automation wire into every engagement so finance and compliance teams ship with confidence.',
          highlights: [
            'Role-aware access, SOC 2 audits, and escrow guardrails in one shared ledger',
            'Regulated payouts, renewals, and invoicing run through a verified treasury spine',
          ],
          metric: { label: 'Trust signals', value: '99.95% uptime · SOC 2 monitored' },
          icon: 'ShieldCheckIcon',
          action: { id: 'trust-centre', label: 'Review trust centre', href: '/trust-center' },
        },
        {
          id: 'talent-network',
          title: 'Curated network activated in days',
          description:
            'Mentor guilds, specialists, and community pods assemble instantly with readiness scores and engagement insights.',
          highlights: [
            'AI matching, guild programming, and readiness scoring surface the right crew instantly',
            'Live NPS, utilisation, and sentiment analytics keep teams tuned to outcomes',
          ],
          metric: { label: 'Network activation', value: '7,800+ mentors & specialists' },
          icon: 'ChartBarIcon',
          action: { id: 'talent-network', label: 'Meet the network', href: '/network' },
        },
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
                heroInsightStats:
                  settingsResult.value?.heroInsightStats ??
                  settingsResult.value?.hero?.insightStats ??
                  settingsResult.value?.hero?.stats ??
                  [],
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
