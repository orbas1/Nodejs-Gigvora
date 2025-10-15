class ZodStub {
  constructor(parser = (value) => value) {
    this._parser = parser;
  }

  parse(value) {
    try {
      return this._parser(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }
      throw new ZodError([{ path: [], message: error.message || 'Validation failed', code: 'custom' }]);
    }
  }
}

function createChainable(parser = (value) => value) {
  const instance = new ZodStub(parser);
  return new Proxy(instance, {
    get(target, property) {
      if (property === 'parse') {
        return target.parse.bind(target);
      }
      if (property === 'array') {
        return () => createChainable((value) => (Array.isArray(value) ? value : []));
      }
      if (property === 'optional' || property === 'nullable' || property === 'nullish') {
        return () => createChainable((value) => (value == null ? value : target.parse(value)));
      }
      if (property === 'default') {
        return (defaultValue) => createChainable((value) => (value == null ? defaultValue : target.parse(value)));
      }
      if (property === 'transform' || property === 'refine' || property === 'superRefine') {
        return () => createChainable(target._parser);
      }
      if (property === 'min' || property === 'max' || property === 'nonempty' || property === 'length') {
        return () => createChainable(target._parser);
      }
      if (property === 'enum' || property === 'literal' || property === 'or') {
        return () => createChainable(target._parser);
      }
      return () => createChainable(target._parser);
    },
  });
}

const zFactory = new Proxy(
  {},
  {
    get(_target, property) {
      if (property === 'object') {
        return (shape = {}) =>
          createChainable((value = {}) => {
            const input = value && typeof value === 'object' ? value : {};
            const output = {};
            Object.entries(shape).forEach(([key, schema]) => {
              if (schema && typeof schema.parse === 'function') {
                output[key] = schema.parse(input[key]);
              } else {
                output[key] = input[key];
              }
            });
            return { ...input, ...output };
          });
      }
      if (property === 'array') {
        return (schema) =>
          createChainable((value) => {
            const items = Array.isArray(value) ? value : [];
            if (!schema || typeof schema.parse !== 'function') {
              return items;
            }
            return items.map((item) => schema.parse(item));
          });
      }
      if (property === 'union' || property === 'discriminatedUnion') {
        return () => createChainable();
      }
      if (property === 'lazy') {
        return (factory) => createChainable((value) => factory().parse(value));
      }
      if (property === 'coerce') {
        return new Proxy(
          {},
          {
            get(__target, key) {
              return () => createChainable();
            },
          },
        );
      }
      return () => createChainable();
    },
  },
);

class ZodError extends Error {
  constructor(issues = []) {
    super('Zod validation failed');
    this.issues = issues;
    this.name = 'ZodError';
  }
}

export const z = zFactory;
export { ZodError };
export default { z, ZodError };
