const stubModel = new Proxy(
  {},
  {
    get: (target, property) => {
      return stubModel;
    },
    apply: () => stubModel,
  },
);

const VOLUNTEER_ASSIGNMENT_STATUSES = Object.freeze([
  'invited',
  'accepted',
  'active',
  'completed',
  'withdrawn',
]);

const NETWORKING_CONNECTION_FOLLOW_STATUSES = Object.freeze([
  'pending',
  'following',
  'ignored',
]);

export const sequelize = {
  define: () => stubModel,
  models: {},
  authenticate: async () => {},
  close: async () => {},
  getDialect: () => 'postgres',
};

let FeedPost = stubModel;
let FeedComment = stubModel;
let FeedReaction = stubModel;
let User = stubModel;
let Profile = stubModel;
let Connection = stubModel;
let FreelancerCostBreakdown = stubModel;

export const __setModelStubs = (overrides = {}) => {
  if (overrides.FeedPost) {
    FeedPost = overrides.FeedPost;
  }
  if (overrides.FeedComment) {
    FeedComment = overrides.FeedComment;
  }
  if (overrides.FeedReaction) {
    FeedReaction = overrides.FeedReaction;
  }
  if (overrides.User) {
    User = overrides.User;
  }
  if (overrides.Profile) {
    Profile = overrides.Profile;
  }
  if (overrides.Connection) {
    Connection = overrides.Connection;
  }
  if (overrides.FreelancerCostBreakdown) {
    FreelancerCostBreakdown = overrides.FreelancerCostBreakdown;
  }
};

export {
  FeedPost,
  FeedComment,
  FeedReaction,
  User,
  Profile,
  Connection,
  FreelancerCostBreakdown,
  VOLUNTEER_ASSIGNMENT_STATUSES,
  NETWORKING_CONNECTION_FOLLOW_STATUSES,
};

export default stubModel;
