import { DataTypes } from 'sequelize';
import sequelize from './sequelizeClient.js';
import { normaliseSlug } from '../utils/modelNormalizers.js';

const dialect = sequelize.getDialect();
const jsonType = ['postgres', 'postgresql'].includes(dialect) ? DataTypes.JSONB : DataTypes.JSON;

export const ONBOARDING_PERSONA_STATUSES = ['draft', 'active', 'deprecated'];
export const ONBOARDING_JOURNEY_STATUSES = ['draft', 'launching', 'active', 'completed', 'archived'];
export const ONBOARDING_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'bounced', 'cancelled'];

export const OnboardingPersona = sequelize.define(
  'OnboardingPersona',
  {
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    subtitle: { type: DataTypes.STRING(255), allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    benefits: { type: jsonType, allowNull: false, defaultValue: [] },
    metrics: { type: jsonType, allowNull: false, defaultValue: [] },
    signatureMoments: { type: jsonType, allowNull: false, defaultValue: [] },
    recommendedModules: { type: jsonType, allowNull: false, defaultValue: [] },
    heroMedia: { type: jsonType, allowNull: false, defaultValue: {} },
    status: {
      type: DataTypes.ENUM(...ONBOARDING_PERSONA_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'onboarding_personas',
    underscored: true,
    hooks: {
      beforeValidate(instance) {
        if (instance.slug) {
          instance.slug = normaliseSlug(instance.slug, { fallback: 'persona' });
        }
      },
    },
  },
);

export const OnboardingJourney = sequelize.define(
  'OnboardingJourney',
  {
    personaId: { type: DataTypes.INTEGER, allowNull: false },
    personaKey: { type: DataTypes.STRING(120), allowNull: false },
    personaTitle: { type: DataTypes.STRING(180), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM(...ONBOARDING_JOURNEY_STATUSES),
      allowNull: false,
      defaultValue: 'launching',
    },
    profileCompanyName: { type: DataTypes.STRING(180), allowNull: false },
    profileRole: { type: DataTypes.STRING(120), allowNull: false },
    profileTimezone: { type: DataTypes.STRING(80), allowNull: false },
    profileHeadline: { type: DataTypes.STRING(255), allowNull: true },
    profileNorthStar: { type: DataTypes.TEXT, allowNull: true },
    preferencesDigestCadence: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'weekly' },
    preferencesUpdatesEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    preferencesEnableAiDrafts: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    preferencesFocusSignals: { type: jsonType, allowNull: false, defaultValue: [] },
    preferencesStoryThemes: { type: jsonType, allowNull: false, defaultValue: [] },
    invitedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    launchedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'onboarding_journeys',
    underscored: true,
  },
);

export const OnboardingJourneyInvite = sequelize.define(
  'OnboardingJourneyInvite',
  {
    journeyId: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM(...ONBOARDING_INVITE_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    invitedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  {
    tableName: 'onboarding_journey_invites',
    underscored: true,
  },
);

OnboardingPersona.hasMany(OnboardingJourney, { foreignKey: 'personaId', as: 'journeys' });
OnboardingJourney.belongsTo(OnboardingPersona, { foreignKey: 'personaId', as: 'persona' });
OnboardingJourney.belongsTo(sequelize.models.User, { foreignKey: 'userId', as: 'user' });
OnboardingJourney.hasMany(OnboardingJourneyInvite, { foreignKey: 'journeyId', as: 'invites' });
OnboardingJourneyInvite.belongsTo(OnboardingJourney, { foreignKey: 'journeyId', as: 'journey' });

export default {
  OnboardingPersona,
  OnboardingJourney,
  OnboardingJourneyInvite,
  ONBOARDING_PERSONA_STATUSES,
  ONBOARDING_JOURNEY_STATUSES,
  ONBOARDING_INVITE_STATUSES,
};
