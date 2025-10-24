const stubModel = new Proxy(
  {},
  {
    get: (target, property) => {
      return stubModel;
    },
    apply: () => stubModel,
  },
);

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
};

export { FeedPost, FeedComment, FeedReaction, User, Profile };

export default stubModel;
