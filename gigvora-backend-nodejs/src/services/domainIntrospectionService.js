import path from 'node:path';
import { domainRegistry } from '../models/index.js';
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
  constructor({ domainRegistry: registry, logger: rootLogger, serviceCatalog }) {
    this.registry = registry;
    this.logger = (rootLogger || logger).child({ service: 'DomainIntrospectionService' });
    this.serviceCatalog = serviceCatalog;
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
      };
    });
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
});

export { DomainIntrospectionService };
export default domainIntrospectionService;
