const stubModel = new Proxy(
  {},
  {
    get: () => stubModel,
    apply: () => stubModel,
  },
);

export const sequelize = {
  define: () => stubModel,
  getDialect: () => 'postgres',
};

export const ModerationEventActions = [];
export const ModerationEventSeverities = [];
export const ModerationEventStatuses = [];
export const ModerationEvent = stubModel;

export default {
  sequelize,
};
