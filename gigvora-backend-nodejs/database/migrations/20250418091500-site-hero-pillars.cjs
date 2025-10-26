'use strict';

const SITE_SETTINGS_KEY = 'site:global';

const DEFAULT_HERO_PERSONA_CHIPS = [
  'Founders orchestrating cross-functional squads',
  'Agencies scaling delivery pods with trust guardrails',
  'Mentors, operators, and advisors guiding cohorts',
  'Recruiters and talent leads hiring with real-time telemetry',
];

const DEFAULT_HERO_VALUE_PILLARS = [
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
];

const ALLOWED_ICONS = new Set([
  'SparklesIcon',
  'ShieldCheckIcon',
  'ChartBarIcon',
  'CurrencyDollarIcon',
  'BoltIcon',
  'GlobeAltIcon',
  'BuildingOffice2Icon',
]);

const clonePillar = (pillar) => ({
  ...pillar,
  highlights: Array.isArray(pillar?.highlights) ? [...pillar.highlights] : [],
  metric: pillar?.metric ? { ...pillar.metric } : null,
  action: pillar?.action ? { ...pillar.action } : null,
});

const DEFAULT_PILLAR_FALLBACK = DEFAULT_HERO_VALUE_PILLARS.map((pillar) => clonePillar(pillar));

const safeString = (value, fallback = '') => {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

const safeSlug = (value, fallback) => {
  const base = safeString(value, fallback ?? '');
  if (!base) {
    return fallback ?? '';
  }
  return base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
};

const safeStringArray = (input, fallback = [], { limit = 8 } = {}) => {
  const source = Array.isArray(input) ? input : [];
  const cleaned = source
    .map((item) => safeString(item))
    .filter((item) => item && item.length > 0)
    .slice(0, limit);
  if (cleaned.length) {
    return cleaned;
  }
  return [...fallback];
};

const sanitizeHeroPersonaChips = (chips) => {
  const sanitized = safeStringArray(chips, DEFAULT_HERO_PERSONA_CHIPS, { limit: 8 });
  return sanitized.length ? sanitized : [...DEFAULT_HERO_PERSONA_CHIPS];
};

const sanitizeMetric = (metric, fallback = null) => {
  const base = fallback && typeof fallback === 'object' ? { ...fallback } : null;
  if (!metric || typeof metric !== 'object') {
    return base;
  }
  const label = safeString(metric.label ?? metric.title, base?.label ?? 'Key metric');
  const value = safeString(metric.value ?? metric.copy ?? metric.stat, base?.value ?? '');
  if (!label && !value) {
    return base;
  }
  const result = {
    label: label || base?.label || 'Key metric',
  };
  if (value) {
    result.value = value;
  } else if (base?.value) {
    result.value = base.value;
  }
  return result;
};

const sanitizeAction = (action, fallback = null) => {
  const candidate = action && typeof action === 'object' ? action : null;
  const base = fallback && typeof fallback === 'object' ? { ...fallback } : null;
  if (!candidate && !base) {
    return null;
  }
  const label = safeString(candidate?.label ?? candidate?.title, base?.label ?? 'Explore pillar');
  const href = safeString(candidate?.href ?? candidate?.url, base?.href ?? base?.url ?? '');
  const to = safeString(candidate?.to, base?.to ?? '');
  const actionId = safeSlug(candidate?.id ?? base?.id ?? label, label);
  if (!label) {
    return base;
  }
  const result = { id: actionId || 'cta', label };
  if (href) {
    result.href = href;
  }
  if (to) {
    result.to = to;
  }
  return result;
};

const sanitizeHighlights = (highlights, fallback = []) => {
  if (!Array.isArray(highlights)) {
    return [...fallback];
  }
  const cleaned = highlights
    .map((item) => (typeof item === 'string' ? item : item?.text))
    .map((item) => safeString(item))
    .filter(Boolean)
    .slice(0, 4);
  if (cleaned.length) {
    return cleaned;
  }
  return [...fallback];
};

const sanitizeHeroValuePillars = (pillars) => {
  const source = Array.isArray(pillars) ? pillars : [];
  const sanitized = source
    .map((pillar, index) => {
      const fallback = DEFAULT_PILLAR_FALLBACK[index] ?? DEFAULT_PILLAR_FALLBACK[0];
      const title = safeString(pillar?.title ?? pillar?.label ?? pillar?.name, fallback.title);
      if (!title) {
        return null;
      }
      const description = safeString(pillar?.description ?? pillar?.copy ?? pillar?.summary, fallback.description);
      const id = safeSlug(pillar?.id ?? title, fallback.id);
      const highlights = sanitizeHighlights(pillar?.highlights ?? pillar?.bullets, fallback.highlights);
      const metric = sanitizeMetric(pillar?.metric, fallback.metric);
      const iconCandidate = safeString(pillar?.icon ?? pillar?.Icon ?? pillar?.iconName, fallback.icon);
      const icon = ALLOWED_ICONS.has(iconCandidate) ? iconCandidate : fallback.icon;
      const action = sanitizeAction(pillar?.action ?? pillar?.cta, fallback.action);
      return {
        id,
        title,
        description,
        highlights,
        metric,
        icon,
        action,
      };
    })
    .filter(Boolean)
    .slice(0, 6);

  if (sanitized.length) {
    return sanitized;
  }

  return DEFAULT_PILLAR_FALLBACK.map((pillar) => clonePillar(pillar));
};

const parseSettings = (value) => {
  if (value == null) {
    return {};
  }
  if (typeof value === 'object') {
    return { ...value };
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const serializeSettings = (value) => JSON.stringify(value);

const enhanceSettings = (current = {}) => {
  const clone = { ...current };
  clone.heroPersonaChips = sanitizeHeroPersonaChips(current.heroPersonaChips ?? current.hero?.personaChips);
  clone.heroValuePillars = sanitizeHeroValuePillars(
    current.heroValuePillars ?? current.hero?.valuePillars ?? current.hero?.valueProps,
  );
  return clone;
};

const stripEnhancements = (current = {}) => {
  const clone = { ...current };
  delete clone.heroPersonaChips;
  delete clone.heroValuePillars;
  return clone;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [record] = await queryInterface.sequelize.query(
        'SELECT id, value FROM site_settings WHERE key = :key LIMIT 1',
        {
          transaction,
          type: Sequelize.QueryTypes.SELECT,
          replacements: { key: SITE_SETTINGS_KEY },
        },
      );

      if (record) {
        const parsed = parseSettings(record.value);
        const merged = enhanceSettings(parsed);
        await queryInterface.sequelize.query(
          'UPDATE site_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id',
          {
            transaction,
            replacements: { value: serializeSettings(merged), id: record.id },
          },
        );
      } else {
        const merged = enhanceSettings({});
        await queryInterface.bulkInsert(
          'site_settings',
          [
            {
              key: SITE_SETTINGS_KEY,
              value: serializeSettings(merged),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [record] = await queryInterface.sequelize.query(
        'SELECT id, value FROM site_settings WHERE key = :key LIMIT 1',
        {
          transaction,
          type: Sequelize.QueryTypes.SELECT,
          replacements: { key: SITE_SETTINGS_KEY },
        },
      );

      if (record) {
        const parsed = parseSettings(record.value);
        const stripped = stripEnhancements(parsed);
        await queryInterface.sequelize.query(
          'UPDATE site_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id',
          {
            transaction,
            replacements: { value: serializeSettings(stripped), id: record.id },
          },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
