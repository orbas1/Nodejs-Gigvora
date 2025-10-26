const useActualModels = process.env.JEST_DISABLE_MODEL_STUBS === 'true';
const actualModule = useActualModels ? await import('../src/models/index.js') : null;

const stubModel = new Proxy(
  {},
  {
    get: () => stubModel,
    apply: () => stubModel,
  },
);

let sequelize = {
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
let RuntimeSecurityAuditEvent = stubModel;
let MentorAdCampaign = stubModel;
let MentorProfile = stubModel;
let MentorAvailabilitySlot = stubModel;
let MentorBooking = stubModel;
let MentorClient = stubModel;
let MentorSettings = stubModel;
let MentorRecommendation = stubModel;
let VolunteerApplication = stubModel;
let VolunteerResponse = stubModel;
let VolunteerContract = stubModel;
let SpeedNetworkingParticipant = stubModel;
let SpeedNetworkingSession = stubModel;
let SpeedNetworkingRoom = stubModel;
let AgencyCollaboration = stubModel;
let AgencyCollaborationInvitation = stubModel;
let AgencyRateCard = stubModel;
let AgencyRateCardItem = stubModel;
let AgencyRetainerNegotiation = stubModel;
let AgencyRetainerEvent = stubModel;
let ClientSuccessAffiliateLink = stubModel;
let ClientSuccessAffiliateMetric = stubModel;
let Group = stubModel;
let GroupMembership = stubModel;
let GroupInvite = stubModel;
let GroupPost = stubModel;

let domainRegistry = {
  registerContext: () => {},
  getContext: () => ({}),
  listContexts: () => [],
  getUnassignedModelNames: () => [],
};

let COMMUNITY_INVITE_STATUSES = [];
let GROUP_VISIBILITIES = [];
let GROUP_MEMBER_POLICIES = [];
let GROUP_MEMBERSHIP_STATUSES = [];
let GROUP_MEMBERSHIP_ROLES = [];
let GROUP_POST_STATUSES = [];
let GROUP_POST_VISIBILITIES = [];

let __setModelStubs = (overrides = {}) => {
  const assignIfPresent = (key, setter) => {
    if (Object.prototype.hasOwnProperty.call(overrides, key) && overrides[key]) {
      setter(overrides[key]);
    }
  };

  assignIfPresent('FeedPost', (value) => {
    FeedPost = value;
  });
  assignIfPresent('FeedComment', (value) => {
    FeedComment = value;
  });
  assignIfPresent('FeedReaction', (value) => {
    FeedReaction = value;
  });
  assignIfPresent('User', (value) => {
    User = value;
  });
  assignIfPresent('Profile', (value) => {
    Profile = value;
  });
  assignIfPresent('Connection', (value) => {
    Connection = value;
  });
  assignIfPresent('RuntimeSecurityAuditEvent', (value) => {
    RuntimeSecurityAuditEvent = value;
  });
  assignIfPresent('MentorAdCampaign', (value) => {
    MentorAdCampaign = value;
  });
  assignIfPresent('MentorProfile', (value) => {
    MentorProfile = value;
  });
  assignIfPresent('MentorAvailabilitySlot', (value) => {
    MentorAvailabilitySlot = value;
  });
  assignIfPresent('MentorBooking', (value) => {
    MentorBooking = value;
  });
  assignIfPresent('MentorClient', (value) => {
    MentorClient = value;
  });
  assignIfPresent('MentorSettings', (value) => {
    MentorSettings = value;
  });
  assignIfPresent('MentorRecommendation', (value) => {
    MentorRecommendation = value;
  });
  assignIfPresent('VolunteerApplication', (value) => {
    VolunteerApplication = value;
  });
  assignIfPresent('VolunteerResponse', (value) => {
    VolunteerResponse = value;
  });
  assignIfPresent('VolunteerContract', (value) => {
    VolunteerContract = value;
  });
  assignIfPresent('SpeedNetworkingParticipant', (value) => {
    SpeedNetworkingParticipant = value;
  });
  assignIfPresent('SpeedNetworkingSession', (value) => {
    SpeedNetworkingSession = value;
  });
  assignIfPresent('SpeedNetworkingRoom', (value) => {
    SpeedNetworkingRoom = value;
  });
  assignIfPresent('AgencyCollaboration', (value) => {
    AgencyCollaboration = value;
  });
  assignIfPresent('AgencyCollaborationInvitation', (value) => {
    AgencyCollaborationInvitation = value;
  });
  assignIfPresent('AgencyRateCard', (value) => {
    AgencyRateCard = value;
  });
  assignIfPresent('AgencyRateCardItem', (value) => {
    AgencyRateCardItem = value;
  });
  assignIfPresent('AgencyRetainerNegotiation', (value) => {
    AgencyRetainerNegotiation = value;
  });
  assignIfPresent('AgencyRetainerEvent', (value) => {
    AgencyRetainerEvent = value;
  });
  assignIfPresent('ClientSuccessAffiliateLink', (value) => {
    ClientSuccessAffiliateLink = value;
  });
  assignIfPresent('ClientSuccessAffiliateMetric', (value) => {
    ClientSuccessAffiliateMetric = value;
  });
  assignIfPresent('Group', (value) => {
    Group = value;
  });
  assignIfPresent('GroupMembership', (value) => {
    GroupMembership = value;
  });
  assignIfPresent('GroupInvite', (value) => {
    GroupInvite = value;
  });
  assignIfPresent('GroupPost', (value) => {
    GroupPost = value;
  });
};

if (useActualModels && actualModule) {
  sequelize = actualModule.sequelize ?? sequelize;
  domainRegistry = actualModule.domainRegistry ?? domainRegistry;
  __setModelStubs = typeof actualModule.__setModelStubs === 'function' ? actualModule.__setModelStubs : () => {};
  FeedPost = actualModule.FeedPost ?? FeedPost;
  FeedComment = actualModule.FeedComment ?? FeedComment;
  FeedReaction = actualModule.FeedReaction ?? FeedReaction;
  User = actualModule.User ?? User;
  Profile = actualModule.Profile ?? Profile;
  Connection = actualModule.Connection ?? Connection;
  RuntimeSecurityAuditEvent = actualModule.RuntimeSecurityAuditEvent ?? RuntimeSecurityAuditEvent;
  MentorAdCampaign = actualModule.MentorAdCampaign ?? MentorAdCampaign;
  MentorProfile = actualModule.MentorProfile ?? MentorProfile;
  MentorAvailabilitySlot = actualModule.MentorAvailabilitySlot ?? MentorAvailabilitySlot;
  MentorBooking = actualModule.MentorBooking ?? MentorBooking;
  MentorClient = actualModule.MentorClient ?? MentorClient;
  MentorSettings = actualModule.MentorSettings ?? MentorSettings;
  MentorRecommendation = actualModule.MentorRecommendation ?? MentorRecommendation;
  VolunteerApplication = actualModule.VolunteerApplication ?? VolunteerApplication;
  VolunteerResponse = actualModule.VolunteerResponse ?? VolunteerResponse;
  VolunteerContract = actualModule.VolunteerContract ?? VolunteerContract;
  SpeedNetworkingParticipant = actualModule.SpeedNetworkingParticipant ?? SpeedNetworkingParticipant;
  SpeedNetworkingSession = actualModule.SpeedNetworkingSession ?? SpeedNetworkingSession;
  SpeedNetworkingRoom = actualModule.SpeedNetworkingRoom ?? SpeedNetworkingRoom;
  AgencyCollaboration = actualModule.AgencyCollaboration ?? AgencyCollaboration;
  AgencyCollaborationInvitation = actualModule.AgencyCollaborationInvitation ?? AgencyCollaborationInvitation;
  AgencyRateCard = actualModule.AgencyRateCard ?? AgencyRateCard;
  AgencyRateCardItem = actualModule.AgencyRateCardItem ?? AgencyRateCardItem;
  AgencyRetainerNegotiation = actualModule.AgencyRetainerNegotiation ?? AgencyRetainerNegotiation;
  AgencyRetainerEvent = actualModule.AgencyRetainerEvent ?? AgencyRetainerEvent;
  ClientSuccessAffiliateLink = actualModule.ClientSuccessAffiliateLink ?? ClientSuccessAffiliateLink;
  ClientSuccessAffiliateMetric = actualModule.ClientSuccessAffiliateMetric ?? ClientSuccessAffiliateMetric;
  Group = actualModule.Group ?? Group;
  GroupMembership = actualModule.GroupMembership ?? GroupMembership;
  GroupInvite = actualModule.GroupInvite ?? GroupInvite;
  GroupPost = actualModule.GroupPost ?? GroupPost;
  COMMUNITY_INVITE_STATUSES = actualModule.COMMUNITY_INVITE_STATUSES ?? COMMUNITY_INVITE_STATUSES;
  GROUP_VISIBILITIES = actualModule.GROUP_VISIBILITIES ?? GROUP_VISIBILITIES;
  GROUP_MEMBER_POLICIES = actualModule.GROUP_MEMBER_POLICIES ?? GROUP_MEMBER_POLICIES;
  GROUP_MEMBERSHIP_STATUSES = actualModule.GROUP_MEMBERSHIP_STATUSES ?? GROUP_MEMBERSHIP_STATUSES;
  GROUP_MEMBERSHIP_ROLES = actualModule.GROUP_MEMBERSHIP_ROLES ?? GROUP_MEMBERSHIP_ROLES;
  GROUP_POST_STATUSES = actualModule.GROUP_POST_STATUSES ?? GROUP_POST_STATUSES;
  GROUP_POST_VISIBILITIES = actualModule.GROUP_POST_VISIBILITIES ?? GROUP_POST_VISIBILITIES;
}
export {
  sequelize,
  __setModelStubs,
  domainRegistry,
  FeedPost,
  FeedComment,
  FeedReaction,
  User,
  Profile,
  Connection,
  RuntimeSecurityAuditEvent,
  MentorAdCampaign,
  MentorProfile,
  MentorAvailabilitySlot,
  MentorBooking,
  MentorClient,
  MentorSettings,
  MentorRecommendation,
  VolunteerApplication,
  VolunteerResponse,
  VolunteerContract,
  SpeedNetworkingParticipant,
  SpeedNetworkingSession,
  SpeedNetworkingRoom,
  AgencyCollaboration,
  AgencyCollaborationInvitation,
  AgencyRateCard,
  AgencyRateCardItem,
  AgencyRetainerNegotiation,
  AgencyRetainerEvent,
  ClientSuccessAffiliateLink,
  ClientSuccessAffiliateMetric,
  Group,
  GroupMembership,
  GroupInvite,
  GroupPost,
  COMMUNITY_INVITE_STATUSES,
  GROUP_VISIBILITIES,
  GROUP_MEMBER_POLICIES,
  GROUP_MEMBERSHIP_STATUSES,
  GROUP_MEMBERSHIP_ROLES,
  GROUP_POST_STATUSES,
  GROUP_POST_VISIBILITIES,
};

export default stubModel;
