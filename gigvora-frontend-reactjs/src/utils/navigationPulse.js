const COMPACT_NUMBER_FORMATTER =
  typeof Intl !== 'undefined'
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
    : null;

function formatCompactNumber(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (COMPACT_NUMBER_FORMATTER) {
      return COMPACT_NUMBER_FORMATTER.format(value);
    }
    if (value >= 1000) {
      return `${Math.round(value / 100) / 10}K`;
    }
    return String(Math.round(value));
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function formatPercentage(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ratio = value <= 1 ? value * 100 : value;
    const rounded = Math.round(ratio * 10) / 10;
    return `${rounded % 1 === 0 ? Math.round(rounded) : rounded}%`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function formatDelta(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value}`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function safeArray(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  return input;
}

export function deriveNavigationPulse(session, marketingNavigation, primaryNavigation) {
  const marketingMenus = safeArray(marketingNavigation);
  const primaryNavItems = safeArray(primaryNavigation);

  const networkStats =
    session?.insights?.network ??
    session?.networkPulse ??
    session?.metrics?.network ??
    session?.network ??
    {};

  const pipelineStats =
    session?.insights?.pipeline ??
    session?.metrics?.pipeline ??
    session?.pipeline ??
    {};

  const messagingStats =
    session?.insights?.messaging ??
    session?.metrics?.messaging ??
    session?.messaging ??
    {};

  const fallbackConnections = marketingMenus.reduce((total, menu) => {
    const sectionCount = safeArray(menu.sections).reduce(
      (sectionTotal, section) => sectionTotal + safeArray(section.items).length,
      0,
    );
    return total + sectionCount * 120;
  }, 1200);

  const fallbackProjects = primaryNavItems.length * 6 || 24;

  return [
    {
      id: 'connections',
      label: 'Connections',
      value: formatCompactNumber(
        networkStats.total ??
          networkStats.count ??
          networkStats.connections ??
          session?.connectionsTotal ??
          fallbackConnections,
        '2.4K',
      ),
      delta: formatDelta(
        networkStats.delta ?? networkStats.weeklyChange ?? networkStats.trend ?? networkStats.change,
        '+18% WoW',
      ),
      hint: 'Network reach this week',
    },
    {
      id: 'projects',
      label: 'Active projects',
      value: formatCompactNumber(
        pipelineStats.active ??
          pipelineStats.totalActive ??
          pipelineStats.pipeline ??
          session?.activeProjects ??
          fallbackProjects,
        '38',
      ),
      delta: formatDelta(
        pipelineStats.delta ?? pipelineStats.addedThisWeek ?? pipelineStats.wins ?? pipelineStats.change,
        '4 new this week',
      ),
      hint: 'Live engagements across teams',
    },
    {
      id: 'response',
      label: 'Response rate',
      value: formatPercentage(
        messagingStats.responseRate ??
          messagingStats.rate ??
          messagingStats.value ??
          session?.communication?.responseRate ??
          0.92,
        '92%',
      ),
      delta: formatDelta(
        messagingStats.delta ??
          messagingStats.sla ??
          messagingStats.avgReplyTime ??
          messagingStats.speed ??
          'Avg 2m reply',
        'Avg 2m reply',
      ),
      hint: 'Engagement health today',
    },
  ];
}

export function deriveNavigationTrending(menus, limit = 4) {
  const aggregated = [];
  safeArray(menus).forEach((menu) => {
    safeArray(menu.sections).forEach((section) => {
      safeArray(section.items).forEach((item) => {
        aggregated.push({
          id: `${menu.id}-${section.title}-${item.name}`,
          label: item.name,
          description: item.description,
          to: item.to,
        });
      });
    });
  });

  return aggregated.slice(0, Math.max(limit, 0));
}

export function normaliseTrendingEntries(entries, searchConfig) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const basePath = searchConfig?.to ?? '/search';

  return entries.map((entry, index) => {
    if (typeof entry === 'string') {
      const query = entry.trim();
      return {
        id: `search-trending-${index}`,
        label: query,
        to: `${basePath}?q=${encodeURIComponent(query)}`,
      };
    }

    const query = entry.query ?? entry.label ?? entry.name ?? '';
    const to = entry.to ?? (query ? `${basePath}?q=${encodeURIComponent(query)}` : basePath);

    const resolvedLabel = entry.label ?? entry.name ?? query;

    return {
      id: entry.id ?? `search-trending-${index}`,
      label: resolvedLabel || 'Trending',
      description: entry.description ?? entry.helperText ?? '',
      to,
    };
  });
}

export default deriveNavigationPulse;
