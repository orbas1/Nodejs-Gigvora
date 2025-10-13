import { Op } from 'sequelize';
import {
  WorkspaceTemplate,
  WorkspaceTemplateCategory,
  WorkspaceTemplateStage,
  WorkspaceTemplateResource,
} from '../models/index.js';
import { appCache, buildCacheKey } from '../utils/cache.js';
import { NotFoundError } from '../utils/errors.js';

const CACHE_NAMESPACE = 'workspaceTemplates:list';
const CACHE_TTL_SECONDS = 90;

function normaliseArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value == null) {
    return [];
  }
  return [value];
}

function sanitiseCategory(record, templateCount = 0) {
  const plain = record.get ? record.get({ plain: true }) : record;
  return {
    id: plain.id,
    slug: plain.slug,
    name: plain.name,
    description: plain.description ?? null,
    icon: plain.icon ?? null,
    sortOrder: plain.sortOrder ?? 0,
    templateCount,
  };
}

function sanitiseTemplate(template, { includeStages = true, includeResources = true } = {}) {
  const base = template.toPublicObject ? template.toPublicObject() : template;
  const category = template.category ? sanitiseCategory(template.category) : null;
  const stages = includeStages
    ? (template.stages || []).map((stage) =>
        stage.toPublicObject ? stage.toPublicObject() : stage,
      )
    : undefined;
  const resources = includeResources
    ? (template.resources || []).map((resource) =>
        resource.toPublicObject ? resource.toPublicObject() : resource,
      )
    : undefined;

  return {
    ...base,
    category,
    stages: stages ?? [],
    resources: resources ?? [],
  };
}

function computeStats(templates = []) {
  if (!templates.length) {
    return {
      totalTemplates: 0,
      industries: [],
      averageAutomationLevel: 0,
      averageQualityScore: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  const industries = Array.from(new Set(templates.map((template) => template.industry).filter(Boolean)));
  const automationLevels = templates.map((template) => Number(template.automationLevel) || 0);
  const qualityScores = templates
    .map((template) => (template.qualityScore != null ? Number(template.qualityScore) : null))
    .filter((score) => Number.isFinite(score));

  const averageAutomationLevel = automationLevels.length
    ? automationLevels.reduce((total, value) => total + value, 0) / automationLevels.length
    : 0;
  const averageQualityScore = qualityScores.length
    ? qualityScores.reduce((total, value) => total + value, 0) / qualityScores.length
    : 0;

  return {
    totalTemplates: templates.length,
    industries,
    averageAutomationLevel: Math.round(averageAutomationLevel * 10) / 10,
    averageQualityScore: Math.round(averageQualityScore * 10) / 10,
    generatedAt: new Date().toISOString(),
  };
}

function buildFiltersPayload(filters = {}) {
  const payload = {
    status: filters.status || 'active',
    visibility: filters.visibility || 'public',
    categorySlug: filters.categorySlug || null,
    workspaceType: filters.workspaceType || null,
    industry: filters.industry || null,
    includeStages: filters.includeStages !== false,
    includeResources: filters.includeResources !== false,
    limit: filters.limit ? Number(filters.limit) : null,
  };

  return payload;
}

async function fetchCategories() {
  const categories = await WorkspaceTemplateCategory.findAll({ order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
  return categories.map((category) => sanitiseCategory(category));
}

function flushCache() {
  appCache.flushByPrefix(CACHE_NAMESPACE);
}

export async function listWorkspaceTemplates(rawFilters = {}) {
  const filters = buildFiltersPayload(rawFilters);
  const cacheKey = buildCacheKey(CACHE_NAMESPACE, filters);
  const cached = appCache.get(cacheKey);
  if (cached) {
    return { ...cached, meta: { ...cached.meta, cached: true, cacheKey } };
  }

  const where = {};
  if (filters.status) {
    where.status = Array.isArray(filters.status) ? { [Op.in]: filters.status } : filters.status;
  }
  if (filters.visibility) {
    where.visibility = Array.isArray(filters.visibility)
      ? { [Op.in]: filters.visibility }
      : filters.visibility;
  }
  if (filters.industry) {
    where.industry = Array.isArray(filters.industry) ? { [Op.in]: filters.industry } : filters.industry;
  }

  const include = [
    { model: WorkspaceTemplateCategory, as: 'category' },
  ];

  if (filters.includeStages) {
    include.push({
      model: WorkspaceTemplateStage,
      as: 'stages',
      separate: true,
      order: [['sortOrder', 'ASC'], ['title', 'ASC']],
    });
  }

  if (filters.includeResources) {
    include.push({
      model: WorkspaceTemplateResource,
      as: 'resources',
      separate: true,
      order: [['sortOrder', 'ASC'], ['title', 'ASC']],
    });
  }

  if (filters.categorySlug) {
    const category = await WorkspaceTemplateCategory.findOne({ where: { slug: filters.categorySlug } });
    if (!category) {
      return {
        categories: await fetchCategories(),
        templates: [],
        stats: computeStats([]),
        meta: {
          filters,
          cached: false,
          cacheKey,
        },
      };
    }
    where.categoryId = category.id;
  }

  const queryOptions = {
    where,
    include,
    order: [
      ['qualityScore', 'DESC'],
      ['automationLevel', 'DESC'],
      ['name', 'ASC'],
    ],
    distinct: true,
  };

  if (filters.limit && Number.isFinite(filters.limit)) {
    queryOptions.limit = Math.max(1, Number(filters.limit));
  }

  const templates = await WorkspaceTemplate.findAll(queryOptions);

  const filteredTemplates = filters.workspaceType
    ? templates.filter((template) => {
        const metadata = template.metadata ?? template.get?.('metadata');
        if (!metadata) return false;
        if (typeof metadata === 'object') {
          return normaliseArray(metadata.workspaceType || metadata.workspaceTypes).includes(filters.workspaceType);
        }
        return false;
      })
    : templates;

  const sanitisedTemplates = filteredTemplates.map((template) =>
    sanitiseTemplate(template, {
      includeStages: filters.includeStages,
      includeResources: filters.includeResources,
    }),
  );

  const categories = await fetchCategories();
  const countsByCategoryId = sanitisedTemplates.reduce((accumulator, template) => {
    if (!template.category) {
      return accumulator;
    }
    accumulator[template.category.id] = (accumulator[template.category.id] ?? 0) + 1;
    return accumulator;
  }, {});

  const enrichedCategories = categories.map((category) => ({
    ...category,
    templateCount: countsByCategoryId[category.id] ?? 0,
  }));

  const stats = computeStats(sanitisedTemplates);
  const response = {
    categories: enrichedCategories,
    templates: sanitisedTemplates,
    stats,
    meta: {
      filters,
      cached: false,
      cacheKey,
    },
  };

  appCache.set(cacheKey, response, CACHE_TTL_SECONDS);
  return response;
}

export async function getWorkspaceTemplateBySlug(slug, options = {}) {
  if (!slug) {
    throw new NotFoundError('Workspace template not found.');
  }

  const include = [
    { model: WorkspaceTemplateCategory, as: 'category' },
  ];

  if (options.includeStages !== false) {
    include.push({
      model: WorkspaceTemplateStage,
      as: 'stages',
      separate: true,
      order: [['sortOrder', 'ASC'], ['title', 'ASC']],
    });
  }

  if (options.includeResources !== false) {
    include.push({
      model: WorkspaceTemplateResource,
      as: 'resources',
      separate: true,
      order: [['sortOrder', 'ASC'], ['title', 'ASC']],
    });
  }

  const template = await WorkspaceTemplate.findOne({
    where: {
      slug,
      status: options.status ?? 'active',
      visibility: options.visibility ?? 'public',
    },
    include,
  });

  if (!template) {
    throw new NotFoundError('Workspace template not found.');
  }

  return {
    template: sanitiseTemplate(template, {
      includeStages: options.includeStages !== false,
      includeResources: options.includeResources !== false,
    }),
  };
}

export function invalidateWorkspaceTemplateCache() {
  flushCache();
}

export default {
  listWorkspaceTemplates,
  getWorkspaceTemplateBySlug,
  invalidateWorkspaceTemplateCache,
};
