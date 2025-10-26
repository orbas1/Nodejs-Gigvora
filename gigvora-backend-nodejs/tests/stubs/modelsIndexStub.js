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
  sync: async () => {},
  getDialect: () => 'postgres',
};

let FeedPost = stubModel;
let FeedComment = stubModel;
let FeedReaction = stubModel;
let User = stubModel;
let Profile = stubModel;
let Connection = stubModel;
let SiteSetting = stubModel;
let SitePage = stubModel;
let SiteNavigationLink = stubModel;
let SitePageFeedback = stubModel;
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

export const __setModelStubs = (overrides = {}) => {
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
  assignIfPresent('SiteSetting', (value) => {
    SiteSetting = value;
  });
  assignIfPresent('SitePage', (value) => {
    SitePage = value;
  });
  assignIfPresent('SiteNavigationLink', (value) => {
    SiteNavigationLink = value;
  });
  assignIfPresent('SitePageFeedback', (value) => {
    SitePageFeedback = value;
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
};

export const domainRegistry = {
  registerContext: () => {},
  getContext: () => ({}),
  listContexts: () => [],
  getUnassignedModelNames: () => [],
};

export {
  FeedPost,
  FeedComment,
  FeedReaction,
  User,
  Profile,
  Connection,
  SiteSetting,
  SitePage,
  SiteNavigationLink,
  SitePageFeedback,
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
};

export const SITE_PAGE_STATUSES = ['draft', 'review', 'published', 'archived'];
export const SITE_PAGE_FEEDBACK_RESPONSES = ['yes', 'partially', 'no'];

export default stubModel;
