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
let DisputeCase = stubModel;
let DisputeEvent = stubModel;
let DisputeWorkflowSetting = stubModel;
let DisputeTemplate = stubModel;
let EscrowAccount = stubModel;
let EscrowTransaction = stubModel;

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
  assignIfPresent('DisputeCase', (value) => {
    DisputeCase = value;
  });
  assignIfPresent('DisputeEvent', (value) => {
    DisputeEvent = value;
  });
  assignIfPresent('DisputeWorkflowSetting', (value) => {
    DisputeWorkflowSetting = value;
  });
  assignIfPresent('DisputeTemplate', (value) => {
    DisputeTemplate = value;
  });
  assignIfPresent('EscrowAccount', (value) => {
    EscrowAccount = value;
  });
  assignIfPresent('EscrowTransaction', (value) => {
    EscrowTransaction = value;
  });
};

export const domainRegistry = {
  registerContext: () => {},
  getContext: () => ({}),
  listContexts: () => [],
  getUnassignedModelNames: () => [],
};

export const DISPUTE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const DISPUTE_STATUSES = ['open', 'awaiting_customer', 'under_review', 'settled'];
export const DISPUTE_STAGES = ['intake', 'mediation', 'arbitration', 'resolved'];
export const DISPUTE_REASON_CODES = ['quality_issue', 'scope_disagreement', 'communication_breakdown'];
export const DISPUTE_ACTION_TYPES = ['comment', 'evidence_upload', 'deadline_adjusted', 'stage_advanced', 'status_change'];
export const DISPUTE_ACTOR_TYPES = ['customer', 'provider', 'mediator', 'admin', 'system'];
export const ESCROW_ACCOUNT_STATUSES = ['active', 'suspended'];
export const ESCROW_TRANSACTION_TYPES = ['project', 'milestone'];
export const ESCROW_TRANSACTION_STATUSES = ['initiated', 'funded', 'in_escrow', 'disputed', 'released', 'refunded'];

export {
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
  DisputeCase,
  DisputeEvent,
  DisputeWorkflowSetting,
  DisputeTemplate,
  EscrowAccount,
  EscrowTransaction,
};

export default stubModel;
