import assert from 'node:assert/strict';

/**
 * Lightweight registry that maps Sequelize models into bounded contexts so downstream services can
 * reason about domain ownership without coupling themselves to the monolithic `models/index.js` export.
 */
export class DomainRegistry {
  constructor({ sequelize, logger } = {}) {
    assert(sequelize, 'DomainRegistry requires a Sequelize instance.');
    this.sequelize = sequelize;
    this.logger = logger;
    this.contexts = new Map();
    this.assignedModels = new Set();
  }

  /**
   * Normalises matcher definitions (string, RegExp, or predicate function) into a predicate
   * that can be executed against every registered Sequelize model name.
   */
  static normaliseMatcher(matcher) {
    if (typeof matcher === 'function') {
      return matcher;
    }
    if (matcher instanceof RegExp) {
      return (modelName) => matcher.test(modelName);
    }
    if (typeof matcher === 'string') {
      return (modelName) => modelName === matcher;
    }
    throw new TypeError('Unsupported matcher type when registering domain context.');
  }

  resolveModels({ models = [], include = [], exclude = [] } = {}) {
    const matched = new Map();
    const normalisedInclude = include.map((entry) => DomainRegistry.normaliseMatcher(entry));
    const normalisedExclude = exclude.map((entry) => DomainRegistry.normaliseMatcher(entry));

    for (const explicit of models) {
      const model = this.sequelize.models[explicit];
      if (!model) {
        throw new Error(`Attempted to register unknown model "${explicit}" in domain registry.`);
      }
      matched.set(explicit, model);
    }

    if (normalisedInclude.length) {
      for (const [modelName, model] of Object.entries(this.sequelize.models)) {
        if (matched.has(modelName)) continue;
        if (!normalisedInclude.some((fn) => fn(modelName, model))) continue;
        if (normalisedExclude.some((fn) => fn(modelName, model))) continue;
        matched.set(modelName, model);
      }
    }

    return matched;
  }

  registerContext({
    name,
    displayName,
    description,
    models = [],
    include = [],
    exclude = [],
    metadata = {},
  }) {
    if (!name) {
      throw new Error('Domain contexts must specify a unique name.');
    }
    const normalisedName = name.toLowerCase();
    if (this.contexts.has(normalisedName)) {
      throw new Error(`Domain context "${normalisedName}" is already registered.`);
    }

    const resolvedModels = this.resolveModels({ models, include, exclude });
    const duplicateNames = Array.from(resolvedModels.keys()).filter((modelName) =>
      this.assignedModels.has(modelName),
    );
    if (duplicateNames.length) {
      const detail = duplicateNames.join(', ');
      const message = `Models already assigned to a different domain context: ${detail}`;
      if (this.logger) {
        this.logger.warn({ context: normalisedName, duplicates: duplicateNames }, message);
      }
    }

    const serialisableModels = Object.fromEntries(resolvedModels.entries());
    Object.freeze(serialisableModels);

    for (const modelName of resolvedModels.keys()) {
      this.assignedModels.add(modelName);
    }

    const context = Object.freeze({
      name: normalisedName,
      displayName: displayName ?? name,
      description: description ?? '',
      models: serialisableModels,
      metadata,
    });

    this.contexts.set(normalisedName, context);
    return context;
  }

  getContext(name) {
    if (!name) {
      throw new Error('A context name must be provided.');
    }
    const context = this.contexts.get(name.toLowerCase());
    if (!context) {
      throw new Error(`No domain context registered as "${name}".`);
    }
    return context;
  }

  getContextModels(name) {
    return this.getContext(name).models;
  }

  listContexts() {
    return Array.from(this.contexts.values()).map((context) => ({
      name: context.name,
      displayName: context.displayName,
      description: context.description,
      modelCount: Object.keys(context.models).length,
      metadata: context.metadata,
    }));
  }

  getUnassignedModelNames() {
    return Object.keys(this.sequelize.models).filter((modelName) => !this.assignedModels.has(modelName));
  }

  snapshot() {
    return Object.fromEntries(
      Array.from(this.contexts.entries()).map(([name, context]) => [
        name,
        {
          name: context.name,
          displayName: context.displayName,
          description: context.description,
          modelNames: Object.keys(context.models),
          metadata: context.metadata,
        },
      ]),
    );
  }

  async transaction(contextName, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new TypeError('Domain transactions require a handler function.');
    }
    const context = this.getContext(contextName);
    return this.sequelize.transaction(options, async (transaction) =>
      handler({
        transaction,
        models: context.models,
        context,
      }),
    );
  }
}

export default DomainRegistry;
