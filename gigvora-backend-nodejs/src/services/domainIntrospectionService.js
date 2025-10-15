import path from 'node:path';
import { DomainGovernanceReview, domainRegistry } from '../models/index.js';
import logger from '../utils/logger.js';
import services from '../domains/serviceCatalog.js';
import { NotFoundError } from '../utils/errors.js';

function normaliseDefaultValue(value) {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normaliseDefaultValue(item));
  }
  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value.toString();
    }
  }
  return value;
}

function serialiseAttribute([attributeName, attribute]) {
  const type =
    attribute?.type?.key ||
    attribute?.type?.toSql?.() ||
    attribute?.type?.toString?.() ||
    (typeof attribute?.type === 'string' ? attribute.type : null);
  const references = attribute?.references
    ? { model: attribute.references.model, key: attribute.references.key }
    : null;
  return {
    name: attributeName,
    columnName: attribute?.field || attributeName,
    type,
    allowNull: attribute?.allowNull !== false,
    defaultValue: normaliseDefaultValue(attribute?.defaultValue),
    primaryKey: Boolean(attribute?.primaryKey),
    unique: Boolean(attribute?.unique || attribute?.primaryKey),
    autoIncrement: Boolean(attribute?.autoIncrement),
    comment: attribute?.comment ?? null,
    values: Array.isArray(attribute?.values) ? attribute.values : undefined,
    references,
  };
}

function serialiseIndex(index) {
  if (!index) {
    return null;
  }
  return {
    name: index.name || null,
    unique: Boolean(index.unique),
    fields: Array.isArray(index.fields)
      ? index.fields.map((field) => (typeof field === 'string' ? field : field?.name)).filter(Boolean)
      : [],
    using: index.using || null,
    where: index.where || null,
  };
}

function serialiseHook([hookName, handlers]) {
  const handlerCount = Array.isArray(handlers) ? handlers.length : handlers ? 1 : 0;
  return { name: hookName, handlerCount };
}

function serialiseAssociation([associationName, association]) {
  return {
    name: associationName,
    type: association?.associationType || null,
    target: association?.target?.name || null,
    as: association?.as || associationName,
    foreignKey: association?.foreignKey || association?.identifier || null,
    through: association?.throughModel?.name || association?.through?.model?.name || null,
  };
}

function serialiseModel(modelName, model) {
  const tableName = typeof model?.getTableName === 'function' ? model.getTableName() : model?.tableName;
  const attributes = Object.entries(model?.rawAttributes ?? {}).map(serialiseAttribute);
  const indexes = (model?.options?.indexes || []).map(serialiseIndex).filter(Boolean);
  const scopes = Object.keys(model?.options?.scopes || {});
  const hooks = Object.entries(model?.options?.hooks || {}).map(serialiseHook);
  const associations = Object.entries(model?.associations || {}).map(serialiseAssociation);

  return {
    name: modelName,
    tableName,
    attributes,
    indexes,
    scopes,
    hooks,
    associations,
  };
}

class DomainIntrospectionService {
  constructor({ domainRegistry: registry, logger: rootLogger, serviceCatalog, governanceReviewModel }) {
    this.registry = registry;
    this.logger = (rootLogger || logger).child({ service: 'DomainIntrospectionService' });
    this.serviceCatalog = serviceCatalog;
    this.governanceReviewModel = governanceReviewModel;
  }

  getRegistrySnapshot() {
    return this.registry.snapshot();
  }

  resolveServicesForContext(contextName, contextModels = []) {
    return Object.entries(this.serviceCatalog)
      .map(([serviceKey, service]) => {
        const descriptor = typeof service.describeCapabilities === 'function' ? service.describeCapabilities() : null;
        const serviceContext = descriptor?.contextName || service.contextName || null;
        const models = descriptor?.models || Object.keys(service.models || {});
        const description = descriptor?.description || null;
        const operations = Array.isArray(descriptor?.operations) ? descriptor.operations : [];

        if (serviceContext && serviceContext !== contextName) {
          return null;
        }

        if (!serviceContext) {
          const overlap = models.filter((modelName) => contextModels.includes(modelName));
          if (overlap.length === 0) {
            return null;
          }
        }

        return {
          key: serviceKey,
          contextName: serviceContext || contextName,
          description,
          operations,
          models,
        };
      })
      .filter(Boolean);
  }

  sampleModelAttributes(contextName, limit = 3) {
    const models = this.registry.getContextModels(contextName);
    const entries = Object.entries(models);
    return entries.slice(0, limit).map(([modelName, model]) => ({
      model: modelName,
      attributes: Object.keys(model.rawAttributes || {}).slice(0, 5),
    }));
  }

  listContexts() {
    const contexts = this.registry.listContexts();
    return contexts.map((context) => {
      const contextModels = Object.keys(this.registry.getContextModels(context.name));
      return {
        ...context,
        services: this.resolveServicesForContext(context.name, contextModels),
        sampledModels: this.sampleModelAttributes(context.name),
        metadata: context.metadata,
      };
    });
  }

  buildModelGovernanceSnapshot(model, metadata = {}) {
    const piiModels = metadata.piiModels ?? {};
    const fieldDescriptions = metadata.fieldDescriptions ?? {};
    const modelGovernance = piiModels[model.name] ?? {};
    const flaggedFields = new Set(Array.isArray(modelGovernance.fields) ? modelGovernance.fields : []);
    const retention = modelGovernance.retention ?? metadata.defaultRetention ?? null;
    const fieldNotes = fieldDescriptions[model.name] ?? {};

    return {
      name: model.name,
      tableName: model.tableName,
      retention,
      classification: flaggedFields.size > 0 ? metadata.dataClassification ?? null : null,
      piiFields: Array.from(flaggedFields),
      attributes: model.attributes.map((attribute) => ({
        name: attribute.name,
        type: attribute.type,
        allowNull: attribute.allowNull,
        pii: flaggedFields.has(attribute.name),
        retention,
        description: fieldNotes[attribute.name] ?? null,
      })),
    };
  }

  async listGovernanceSummaries() {
    const contexts = this.registry.listContexts();
    let reviews = [];
    if (this.governanceReviewModel) {
      reviews = await this.governanceReviewModel.findAll({ order: [['contextName', 'ASC']] });
    }
    const reviewMap = new Map(
      reviews.map((review) => [review.contextName.toLowerCase(), review.toPublicObject?.() ?? review.get({ plain: true })]),
    );

    return contexts.map((context) => {
      const metadata = context.metadata ?? {};
      const review = reviewMap.get(context.name.toLowerCase()) ?? null;
      const piiModels = metadata.piiModels ?? {};
      const piiFieldCount = Object.values(piiModels).reduce((acc, entry) => {
        const count = Array.isArray(entry.fields) ? entry.fields.length : 0;
        return acc + count;
      }, 0);

      return {
        contextName: context.name,
        displayName: context.displayName,
        description: context.description,
        ownerTeam: review?.ownerTeam ?? metadata.ownerTeam ?? null,
        dataSteward: review?.dataSteward ?? metadata.dataSteward ?? null,
        dataClassification: metadata.dataClassification ?? null,
        businessCriticality: metadata.businessCriticality ?? null,
        defaultRetention: metadata.defaultRetention ?? null,
        regulatoryFrameworks: metadata.regulatoryFrameworks ?? [],
        piiModelCount: Object.keys(piiModels).length,
        piiFieldCount,
        reviewStatus: review?.reviewStatus ?? 'unknown',
        reviewedAt: review?.reviewedAt ?? null,
        nextReviewDueAt: review?.nextReviewDueAt ?? null,
        automationCoverage: review?.scorecard?.automationCoverage ?? null,
        remediationItems: review?.scorecard?.remediationItems ?? null,
      };
    });
  }

  async getContextGovernance(contextName) {
    const detail = this.getContextDetail(contextName);
    const metadata = detail.context.metadata ?? {};
    const models = detail.models.map((model) => this.buildModelGovernanceSnapshot(model, metadata));

    let review = null;
    if (this.governanceReviewModel) {
      const record = await this.governanceReviewModel.findOne({ where: { contextName: detail.context.name } });
      review = record?.toPublicObject?.() ?? record?.get?.({ plain: true }) ?? null;
    }

    const piiFieldCount = models.reduce((acc, model) => acc + model.piiFields.length, 0);

    return {
      context: detail.context,
      ownerTeam: review?.ownerTeam ?? metadata.ownerTeam ?? null,
      dataSteward: review?.dataSteward ?? metadata.dataSteward ?? null,
      dataClassification: metadata.dataClassification ?? null,
      businessCriticality: metadata.businessCriticality ?? null,
      defaultRetention: metadata.defaultRetention ?? null,
      dataResidency: metadata.dataResidency ?? null,
      regulatoryFrameworks: metadata.regulatoryFrameworks ?? [],
      qualityChecks: metadata.qualityChecks ?? [],
      piiModelCount: models.filter((model) => model.piiFields.length > 0).length,
      piiFieldCount,
      review,
      models,
    };
  }

  getContextDetail(contextName) {
    if (!contextName) {
      throw new NotFoundError('A domain context name is required.');
    }
    const context = this.registry.getContext(contextName);
    const models = Object.entries(context.models).map(([modelName, model]) => serialiseModel(modelName, model));
    return {
      context: {
        name: context.name,
        displayName: context.displayName,
        description: context.description,
        metadata: context.metadata,
      },
      services: this.resolveServicesForContext(context.name, models.map((model) => model.name)),
      models,
    };
  }

  getModelDetail(contextName, modelName) {
    if (!contextName || !modelName) {
      throw new NotFoundError('Context name and model name are required.');
    }
    const context = this.registry.getContext(contextName);
    const model = context.models[modelName];
    if (!model) {
      throw new NotFoundError(`Model "${modelName}" is not registered under the "${contextName}" context.`);
    }
    return serialiseModel(modelName, model);
  }

  getModelFilePath(contextName, modelName) {
    const context = this.registry.getContext(contextName);
    if (!context.models[modelName]) {
      throw new NotFoundError(`Model "${modelName}" is not registered under the "${contextName}" context.`);
    }
    return path.normalize(path.join('src', 'models', `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}.js`));
  }
}

const domainIntrospectionService = new DomainIntrospectionService({
  domainRegistry,
  logger,
  serviceCatalog: services,
  governanceReviewModel: DomainGovernanceReview,
});

export { DomainIntrospectionService };
export default domainIntrospectionService;
