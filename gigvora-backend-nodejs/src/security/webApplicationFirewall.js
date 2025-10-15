import crypto from 'node:crypto';

import logger from '../utils/logger.js';

const DEFAULT_BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /acunetix/i,
  /nikto/i,
  /netsparker/i,
  /wpscan/i,
  /fimap/i,
  /burpsuite/i,
];

const DEFAULT_SUSPICIOUS_RULES = [
  {
    id: 'sql.union-select',
    description: 'SQL injection attempt containing UNION SELECT.',
    pattern: /union\s+select/i,
  },
  {
    id: 'sql.boolean-operator',
    description: 'Boolean based SQL injection attempt.',
    pattern: /(?:['"%][^a-zA-Z0-9]*)?(?:or|and)\s+['"%]?\d+['"%]?\s*=\s*['"%]?\d+/i,
  },
  {
    id: 'sql.comment',
    description: 'SQL comment based injection payload.',
    pattern: /(?:--|#|\/\*)\s*[^\n]*$/m,
  },
  {
    id: 'sql.sleep',
    description: 'Time based SQL injection attempt.',
    pattern: /sleep\s*\(\s*\d+\s*\)/i,
  },
  {
    id: 'nosql.operator',
    description: 'MongoDB style operator injection.',
    pattern: /\$where\s*:/i,
  },
  {
    id: 'xss.script-tag',
    description: 'Inline script tag detected.',
    pattern: /<\s*script[\s>]/i,
  },
  {
    id: 'xss.event-handler',
    description: 'Suspicious DOM event handler attribute.',
    pattern: /on(load|error|mouseover|focus|click)\s*=\s*/i,
  },
  {
    id: 'rce.command-chain',
    description: 'Command injection attempt using shell operators.',
    pattern: /(;|&&|\|\|)\s*(?:cat|wget|curl|powershell|bash|sh|python|perl)\b/i,
  },
  {
    id: 'traversal.dotdot',
    description: 'Directory traversal attempt.',
    pattern: /\.\.(?:\/|\\)/,
  },
  {
    id: 'traversal.sensitive-file',
    description: 'Attempt to access sensitive system files.',
    pattern: /(etc\/passwd|windows\\system32)/i,
  },
  {
    id: 'deserialisation.gadget',
    description: 'Java deserialisation gadget reference detected.',
    pattern: /java\.lang\.runtime/i,
  },
  {
    id: 'http.smuggling',
    description: 'Suspicious HTTP header abuse pattern.',
    pattern: /\btransfer-encoding\s*:\s*chunked/i,
  },
];

function parseBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const candidate = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(candidate)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(candidate)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function parseInteger(value, fallback, { min, max } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  let resolved = Math.trunc(numeric);
  if (typeof min === 'number' && resolved < min) {
    resolved = min;
  }
  if (typeof max === 'number' && resolved > max) {
    resolved = max;
  }
  return resolved;
}

const wafState = {
  config: {
    disabled: false,
    blockedIps: new Set(),
    trustedIps: new Set(),
    blockedUserAgents: DEFAULT_BLOCKED_USER_AGENTS.slice(),
    rules: DEFAULT_SUSPICIOUS_RULES.slice(),
    autoBlock: {
      enabled: true,
      threshold: 8,
      windowSeconds: 300,
      ttlSeconds: 900,
    },
  },
  metrics: {
    evaluatedRequests: 0,
    blockedRequests: 0,
    blockedByRule: new Map(),
    blockedIps: new Map(),
    blockedAgents: new Map(),
    lastBlockedAt: null,
    recentBlocks: [],
    maxRecentBlocks: 25,
    autoBlockEvents: 0,
    activeAutoBlocks: new Map(),
    lastAutoBlock: null,
  },
  dynamicBlocks: new Map(),
  offenderTracker: new Map(),
};

function splitList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  return String(value)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseRegex(value) {
  try {
    if (value.startsWith('/') && value.lastIndexOf('/') > 0) {
      const lastSlash = value.lastIndexOf('/');
      const pattern = value.slice(1, lastSlash);
      const flags = value.slice(lastSlash + 1);
      return new RegExp(pattern, flags);
    }
    return new RegExp(value, 'i');
  } catch (error) {
    logger.warn({ err: error, pattern: value }, 'Failed to parse WAF custom regex pattern');
    return null;
  }
}

function addMetricCounter(map, key) {
  if (!key) {
    return;
  }
  const next = (map.get(key) ?? 0) + 1;
  map.set(key, next);
}

function serialiseRecentBlock(entry) {
  const reference = entry.referenceId ?? crypto.randomUUID();
  return {
    referenceId: reference,
    ip: entry.ip ?? null,
    origin: entry.origin ?? null,
    path: entry.path,
    method: entry.method,
    reason: entry.reason,
    matchedRules: entry.matchedRules,
    detectedAt: entry.detectedAt,
    userAgent: entry.userAgent ?? null,
  };
}

export function configureWebApplicationFirewall({ env = process.env } = {}) {
  const disabled = `${env.WAF_DISABLED ?? env.DISABLE_WAF ?? 'false'}`.toLowerCase() === 'true';
  const blockedIps = new Set(splitList(env.WAF_BLOCKED_IPS).map((value) => value.toLowerCase()));
  const trustedIps = new Set(splitList(env.WAF_TRUSTED_IPS).map((value) => value.toLowerCase()));
  const blockedAgents = splitList(env.WAF_BLOCKED_AGENTS)
    .map((candidate) => parseRegex(candidate))
    .filter(Boolean);

  const autoBlockEnabled = parseBoolean(env.WAF_AUTO_BLOCK_ENABLED, true);
  const autoBlockDisabled = parseBoolean(env.WAF_AUTO_BLOCK_DISABLED, false);
  const resolvedAutoBlockEnabled = autoBlockDisabled ? false : autoBlockEnabled;
  const autoBlockThreshold = parseInteger(env.WAF_AUTO_BLOCK_THRESHOLD, 8, { min: 1, max: 10_000 });
  const autoBlockWindowSeconds = parseInteger(env.WAF_AUTO_BLOCK_WINDOW_SECONDS, 300, {
    min: 30,
    max: 86_400,
  });
  const ttlMinutes = env.WAF_AUTO_BLOCK_TTL_MINUTES;
  const ttlSecondsCandidate =
    env.WAF_AUTO_BLOCK_TTL_SECONDS ?? (ttlMinutes != null ? Number(ttlMinutes) * 60 : undefined);
  const autoBlockTtlSeconds = parseInteger(ttlSecondsCandidate, 900, {
    min: 60,
    max: 172_800,
  });

  let customRules = [];
  const customRulesPayload = env.WAF_CUSTOM_RULES;
  if (customRulesPayload) {
    try {
      const parsed = JSON.parse(customRulesPayload);
      if (Array.isArray(parsed)) {
        customRules = parsed
          .map((rule) => {
            if (!rule || typeof rule !== 'object') {
              return null;
            }
            const expression = typeof rule.pattern === 'string' ? parseRegex(rule.pattern) : null;
            if (!expression) {
              return null;
            }
            return {
              id: rule.id ?? `custom-${crypto.randomUUID()}`,
              description: rule.description ?? 'Custom firewall rule',
              pattern: expression,
            };
          })
          .filter(Boolean);
      }
    } catch (error) {
      logger.warn({ err: error }, 'Failed to parse WAF_CUSTOM_RULES');
    }
  }

  wafState.config = {
    disabled,
    blockedIps,
    trustedIps,
    blockedUserAgents: blockedAgents.length > 0 ? blockedAgents : DEFAULT_BLOCKED_USER_AGENTS.slice(),
    rules: [...DEFAULT_SUSPICIOUS_RULES, ...customRules],
    autoBlock: {
      enabled: resolvedAutoBlockEnabled,
      threshold: autoBlockThreshold,
      windowSeconds: autoBlockWindowSeconds,
      ttlSeconds: autoBlockTtlSeconds,
    },
  };

  pruneExpiredAutoBlocks();

  return wafState.config;
}

configureWebApplicationFirewall();

function normaliseIp(ip) {
  if (!ip) {
    return null;
  }
  return String(ip).trim().toLowerCase();
}

function pruneExpiredAutoBlocks(now = Date.now()) {
  const { dynamicBlocks, metrics } = wafState;
  for (const [ip, entry] of dynamicBlocks.entries()) {
    if (!entry) {
      dynamicBlocks.delete(ip);
      metrics.activeAutoBlocks.delete(ip);
      continue;
    }
    if (entry.expiresAt <= now) {
      dynamicBlocks.delete(ip);
      metrics.activeAutoBlocks.delete(ip);
    }
  }
}

function normaliseRuleSummaries(rules = []) {
  if (!Array.isArray(rules)) {
    return [];
  }
  return rules.map((rule) => ({ id: rule.id ?? null, description: rule.description ?? null }));
}

function trackOffence(ip, timestamp, windowSeconds) {
  const { offenderTracker } = wafState;
  const now = timestamp ?? Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = offenderTracker.get(ip) ?? [];
  const filtered = existing.filter((value) => value >= now - windowMs);
  filtered.push(now);
  offenderTracker.set(ip, filtered);
  return filtered;
}

function maybeCreateAutoBlock(event, recordedRules) {
  const { config, dynamicBlocks, metrics } = wafState;
  const { autoBlock } = config;
  if (!autoBlock?.enabled || !event.ip) {
    return null;
  }

  const now = Date.now();
  pruneExpiredAutoBlocks(now);

  const offences = trackOffence(event.ip, now, autoBlock.windowSeconds);
  if (offences.length < autoBlock.threshold) {
    return null;
  }

  const blockedAt = now;
  const expiresAt = now + autoBlock.ttlSeconds * 1000;
  const ruleSummaries = normaliseRuleSummaries(recordedRules);

  const entry = {
    blockedAt,
    expiresAt,
    hits: offences.length,
    lastMatchedRules: ruleSummaries,
  };
  dynamicBlocks.set(event.ip, entry);
  metrics.activeAutoBlocks.set(event.ip, entry);
  metrics.autoBlockEvents += 1;
  metrics.lastAutoBlock = {
    ip: event.ip,
    blockedAt,
    expiresAt,
    hits: offences.length,
    matchedRules: ruleSummaries,
  };

  return {
    triggered: true,
    ip: event.ip,
    blockedAt: new Date(blockedAt).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    hits: offences.length,
    threshold: autoBlock.threshold,
    windowSeconds: autoBlock.windowSeconds,
  };
}

function getActiveAutoBlock(ip) {
  if (!ip) {
    return null;
  }
  pruneExpiredAutoBlocks();
  const { dynamicBlocks, config } = wafState;
  const entry = dynamicBlocks.get(ip);
  if (!entry) {
    return null;
  }
  return {
    triggered: false,
    ip,
    blockedAt: new Date(entry.blockedAt).toISOString(),
    expiresAt: new Date(entry.expiresAt).toISOString(),
    hits: entry.hits,
    threshold: config.autoBlock?.threshold ?? null,
    windowSeconds: config.autoBlock?.windowSeconds ?? null,
    matchedRules: entry.lastMatchedRules ?? [],
  };
}

function evaluateRules(candidate, rules) {
  const matches = [];
  if (!candidate) {
    return matches;
  }
  for (const rule of rules) {
    try {
      if (rule.pattern.test(candidate)) {
        matches.push({ id: rule.id, description: rule.description });
      }
    } catch (error) {
      logger.warn({ err: error, ruleId: rule.id }, 'WAF rule evaluation failed');
    }
  }
  return matches;
}

function collectRequestSurface(req) {
  const path = req.originalUrl || req.url || req.path || '/';
  let bodyString = '';
  if (req.body) {
    if (typeof req.body === 'string') {
      bodyString = req.body;
    } else {
      try {
        bodyString = JSON.stringify(req.body);
      } catch (error) {
        bodyString = '[unserialisable-body]';
      }
    }
  }
  const headerValues = Object.values(req.headers || {})
    .filter((value) => typeof value === 'string')
    .join('\n');

  return {
    ip: normaliseIp(req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress),
    method: (req.method || 'GET').toUpperCase(),
    path,
    query: req.originalUrl && req.originalUrl.includes('?') ? req.originalUrl.split('?')[1] : '',
    body: bodyString,
    headers: headerValues,
    userAgent: typeof req.get === 'function' ? req.get('user-agent') : req.headers?.['user-agent'],
    origin: typeof req.get === 'function' ? req.get('origin') : req.headers?.origin,
  };
}

export function evaluateRequest(req) {
  const { config, metrics } = wafState;
  metrics.evaluatedRequests += 1;

  if (config.disabled) {
    return { allowed: true, reason: 'disabled' };
  }

  const surface = collectRequestSurface(req);
  const autoBlock = getActiveAutoBlock(surface.ip);
  if (autoBlock) {
    const result = {
      allowed: false,
      reason: 'auto-block',
      matchedRules: autoBlock.matchedRules,
      ip: surface.ip,
      method: surface.method,
      path: surface.path,
      origin: surface.origin,
      userAgent: surface.userAgent,
    };
    const { entry } = registerBlock(result);
    return {
      ...result,
      detectedAt: entry.detectedAt,
      referenceId: entry.referenceId,
      autoBlock,
    };
  }

  if (surface.ip && config.trustedIps.has(surface.ip)) {
    return { allowed: true, reason: 'trusted-ip' };
  }

  if (surface.ip && config.blockedIps.has(surface.ip)) {
    const result = {
      allowed: false,
      reason: 'ip-blocked',
      matchedRules: [],
      ip: surface.ip,
      method: surface.method,
      path: surface.path,
      origin: surface.origin,
      userAgent: surface.userAgent,
    };
    const { entry } = registerBlock(result);
    return { ...result, detectedAt: entry.detectedAt, referenceId: entry.referenceId };
  }

  const matchedRules = [
    ...evaluateRules(surface.path, config.rules),
    ...evaluateRules(surface.query, config.rules),
    ...evaluateRules(surface.body, config.rules),
    ...evaluateRules(surface.headers, config.rules),
  ];

  if (surface.userAgent) {
    const agentMatches = config.blockedUserAgents.filter((expression) => expression.test(surface.userAgent));
    if (agentMatches.length > 0) {
      matchedRules.push({
        id: 'agent.blocked',
        description: 'User agent blocked by security policy.',
      });
    }
  }

  if (matchedRules.length > 0) {
    const result = {
      allowed: false,
      reason: 'rule-match',
      matchedRules,
      ip: surface.ip,
      method: surface.method,
      path: surface.path,
      origin: surface.origin,
      userAgent: surface.userAgent,
    };
    const { entry, autoBlock: triggeredAutoBlock } = registerBlock(result);
    return {
      ...result,
      detectedAt: entry.detectedAt,
      referenceId: entry.referenceId,
      autoBlock: triggeredAutoBlock ?? undefined,
    };
  }

  return {
    allowed: true,
    reason: 'clean',
    ip: surface.ip,
    method: surface.method,
    path: surface.path,
    origin: surface.origin,
    userAgent: surface.userAgent,
  };
}

function shouldConsiderAutoBlock(event) {
  if (!event || !event.ip) {
    return false;
  }
  if (event.reason === 'ip-blocked' || event.reason === 'auto-block') {
    return false;
  }
  return true;
}

export function registerBlock(event) {
  const { metrics } = wafState;
  metrics.blockedRequests += 1;
  metrics.lastBlockedAt = event.detectedAt ?? new Date().toISOString();
  const recordedRules = Array.isArray(event.matchedRules) ? event.matchedRules : [];

  if (event.ip) {
    addMetricCounter(metrics.blockedIps, event.ip);
  }
  if (event.userAgent) {
    addMetricCounter(metrics.blockedAgents, event.userAgent);
  }

  recordedRules.forEach((rule) => {
    addMetricCounter(metrics.blockedByRule, rule.id ?? rule.description ?? 'unknown');
  });

  const recentEntry = serialiseRecentBlock({
    ...event,
    detectedAt: metrics.lastBlockedAt,
  });
  metrics.recentBlocks.unshift(recentEntry);
  if (metrics.recentBlocks.length > metrics.maxRecentBlocks) {
    metrics.recentBlocks.length = metrics.maxRecentBlocks;
  }

  const autoBlock = shouldConsiderAutoBlock(event) ? maybeCreateAutoBlock(event, recordedRules) : null;

  return { entry: recentEntry, autoBlock };
}

export function recordAllowedRequest() {
  const { metrics } = wafState;
  metrics.evaluatedRequests += 1;
}

export function getWebApplicationFirewallSnapshot() {
  pruneExpiredAutoBlocks();
  const { metrics, config } = wafState;
  return {
    evaluatedRequests: metrics.evaluatedRequests,
    blockedRequests: metrics.blockedRequests,
    lastBlockedAt: metrics.lastBlockedAt,
    blockedByRule: Array.from(metrics.blockedByRule.entries())
      .map(([ruleId, count]) => ({ ruleId, count }))
      .sort((a, b) => b.count - a.count),
    blockedIps: Array.from(metrics.blockedIps.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count),
    blockedAgents: Array.from(metrics.blockedAgents.entries())
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count),
    recentBlocks: metrics.recentBlocks.slice(0, metrics.maxRecentBlocks),
    autoBlock: {
      enabled: Boolean(config.autoBlock?.enabled),
      threshold: config.autoBlock?.threshold ?? null,
      windowSeconds: config.autoBlock?.windowSeconds ?? null,
      ttlSeconds: config.autoBlock?.ttlSeconds ?? null,
      totalTriggered: metrics.autoBlockEvents,
      active: Array.from(metrics.activeAutoBlocks.entries())
        .map(([ip, entry]) => ({
          ip,
          blockedAt: new Date(entry.blockedAt).toISOString(),
          expiresAt: new Date(entry.expiresAt).toISOString(),
          hits: entry.hits,
        }))
        .sort((a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime()),
      lastTriggered: metrics.lastAutoBlock
        ? {
            ip: metrics.lastAutoBlock.ip,
            blockedAt: new Date(metrics.lastAutoBlock.blockedAt).toISOString(),
            expiresAt: new Date(metrics.lastAutoBlock.expiresAt).toISOString(),
            hits: metrics.lastAutoBlock.hits,
            matchedRules: metrics.lastAutoBlock.matchedRules ?? [],
          }
        : null,
    },
  };
}

export function resetWebApplicationFirewallMetrics() {
  wafState.metrics = {
    evaluatedRequests: 0,
    blockedRequests: 0,
    blockedByRule: new Map(),
    blockedIps: new Map(),
    blockedAgents: new Map(),
    lastBlockedAt: null,
    recentBlocks: [],
    maxRecentBlocks: 25,
    autoBlockEvents: 0,
    activeAutoBlocks: new Map(),
    lastAutoBlock: null,
  };
  pruneExpiredAutoBlocks();
  for (const [ip, entry] of wafState.dynamicBlocks.entries()) {
    wafState.metrics.activeAutoBlocks.set(ip, entry);
  }
}

export default {
  configureWebApplicationFirewall,
  evaluateRequest,
  registerBlock,
  recordAllowedRequest,
  getWebApplicationFirewallSnapshot,
  resetWebApplicationFirewallMetrics,
};
