'use strict';

const SITE_SETTINGS_KEY = 'site:global';

const DEFAULT_HERO_INSIGHT_STATS = [
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
];

const cloneStat = (stat) => ({ ...stat });

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

const sanitizeHeroInsightStats = (stats) => {
  const source = Array.isArray(stats) ? stats : [];
  const sanitized = source
    .map((stat, index) => {
      if (!stat) {
        return null;
      }
      if (typeof stat === 'string') {
        const label = safeString(stat);
        if (!label) {
          return null;
        }
        return {
          id: safeSlug(label, `stat-${index + 1}`) || `stat-${index + 1}`,
          label,
          value: null,
          helper: null,
        };
      }

      if (typeof stat === 'object') {
        const label = safeString(stat.label ?? stat.title ?? stat.name, '');
        const value = safeString(stat.value ?? stat.metric ?? stat.copy, '');
        const helper = safeString(stat.helper ?? stat.description ?? stat.summary, '');
        if (!label && !value && !helper) {
          return null;
        }
        const id = safeSlug(stat.id ?? stat.key ?? stat.slug ?? label ?? value, label || value || helper || 'stat');
        const result = {
          id: id || `stat-${index + 1}`,
          label: label || value || helper || 'Insight',
        };
        if (value) {
          result.value = value;
        }
        if (helper) {
          result.helper = helper;
        }
        return result;
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, 6)
    .map((stat) => ({
      id: stat.id,
      label: stat.label,
      ...(stat.value ? { value: stat.value } : {}),
      ...(stat.helper ? { helper: stat.helper } : {}),
    }));

  if (sanitized.length) {
    return sanitized;
  }

  return DEFAULT_HERO_INSIGHT_STATS.map((stat) => cloneStat(stat));
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
  clone.heroInsightStats = sanitizeHeroInsightStats(
    current.heroInsightStats ?? current.hero?.insightStats ?? current.hero?.stats,
  );
  return clone;
};

const stripEnhancements = (current = {}) => {
  const clone = { ...current };
  delete clone.heroInsightStats;
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
