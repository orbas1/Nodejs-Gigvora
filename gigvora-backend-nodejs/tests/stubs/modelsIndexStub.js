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

export default stubModel;
