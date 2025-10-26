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

function normaliseMetricValue(metricValue, fallbackFormatter) {
  if (metricValue == null) {
    return fallbackFormatter();
  }

  if (typeof metricValue === 'object') {
    if (metricValue.formatted) {
      return metricValue.formatted;
    }
    if (typeof metricValue.raw === 'number') {
      return fallbackFormatter(metricValue.raw);
    }
  }

  if (typeof metricValue === 'number') {
    return fallbackFormatter(metricValue);
  }

  if (typeof metricValue === 'string') {
    return metricValue;
  }

  return fallbackFormatter();
}

function normaliseMetricDelta(metricDelta, fallback) {
  if (!metricDelta && metricDelta !== 0) {
    return fallback;
  }
  if (typeof metricDelta === 'object') {
    if (metricDelta.formatted) {
      return metricDelta.formatted;
    }
    if (typeof metricDelta.raw === 'number' && !Number.isNaN(metricDelta.raw)) {
      return fallback;
    }
  }
  if (typeof metricDelta === 'string') {
    return metricDelta;
  }
  return fallback;
}

export function deriveNavigationPulse(session, marketingNavigation, primaryNavigation, remotePulse) {
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

  const fallbackPulse = [
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

  if (Array.isArray(remotePulse) && remotePulse.length > 0) {
    return remotePulse.map((metric, index) => {
      const fallback = fallbackPulse.find((entry) => entry.id === metric.id) ?? fallbackPulse[index];
      const valueFormatter = (rawValue) => formatCompactNumber(rawValue, fallback?.value ?? '0');
      const value = normaliseMetricValue(metric.value, valueFormatter);
      const delta = normaliseMetricDelta(metric.delta, fallback?.delta ?? '');
      return {
        id: metric.id ?? fallback?.id ?? `pulse-${index}`,
        label: metric.label ?? fallback?.label ?? 'Insight',
        value,
        delta,
        hint: metric.hint ?? fallback?.hint ?? '',
      };
    });
  }

  return fallbackPulse;
}

export function deriveNavigationTrending(menus, limit = 4, remoteEntries) {
  if (Array.isArray(remoteEntries) && remoteEntries.length > 0) {
    return remoteEntries.slice(0, Math.max(limit, 0)).map((entry, index) => ({
      id: entry.id ?? `trending-${index}`,
      label: entry.label ?? entry.topic ?? entry.name ?? 'Trending',
      description: entry.description ?? entry.summary ?? entry.helperText ?? '',
      to: entry.to ?? entry.href ?? '/search',
    }));
  }

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
