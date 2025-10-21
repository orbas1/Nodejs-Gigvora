const stubModel = new Proxy(
  {},
  {
    get: () => stubModel,
    apply: () => stubModel,
  },
);

export const sequelize = {
  define: () => stubModel,
  models: {},
  authenticate: async () => {},
  close: async () => {},
};

export const USER_STATUSES = ['invited', 'active', 'suspended', 'archived'];

export const domainRegistry = {
  getContextModels: () => ({}),
  transaction: async () => {},
};

export default stubModel;
