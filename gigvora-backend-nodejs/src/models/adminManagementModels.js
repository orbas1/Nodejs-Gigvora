import { DataTypes } from 'sequelize';

import sequelize from './sequelizeClient.js';

function defineModel(name, attributes, options) {
  if (sequelize.models[name]) {
    return sequelize.models[name];
  }
  return sequelize.define(name, attributes, options);
}

const User = defineModel(
  'User',
  {
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    firstName: { type: DataTypes.STRING(120), allowNull: true },
    lastName: { type: DataTypes.STRING(120), allowNull: true },
    phoneNumber: { type: DataTypes.STRING(50), allowNull: true },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'active' },
    userType: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'user' },
    memberships: { type: DataTypes.JSON, allowNull: true },
    primaryDashboard: { type: DataTypes.STRING(40), allowNull: true },
    lastSeenAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'users' },
);

const Profile = defineModel(
  'Profile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    missionStatement: { type: DataTypes.TEXT, allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    timezone: { type: DataTypes.STRING(120), allowNull: true },
  },
  { tableName: 'profiles' },
);

const AgencyProfile = defineModel(
  'AgencyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    agencyName: { type: DataTypes.STRING(255), allowNull: false },
    focusArea: { type: DataTypes.STRING(255), allowNull: true },
    website: { type: DataTypes.STRING(2048), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    services: { type: DataTypes.JSON, allowNull: true },
    industries: { type: DataTypes.JSON, allowNull: true },
    clients: { type: DataTypes.JSON, allowNull: true },
    awards: { type: DataTypes.JSON, allowNull: true },
    socialLinks: { type: DataTypes.JSON, allowNull: true },
    teamSize: { type: DataTypes.INTEGER, allowNull: true },
    foundedYear: { type: DataTypes.INTEGER, allowNull: true },
    workforceAvailable: { type: DataTypes.INTEGER, allowNull: true },
    workforceNotes: { type: DataTypes.TEXT, allowNull: true },
    introVideoUrl: { type: DataTypes.STRING(2048), allowNull: true },
    bannerUrl: { type: DataTypes.STRING(2048), allowNull: true },
    profileImageUrl: { type: DataTypes.STRING(2048), allowNull: true },
    autoAcceptFollowers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    defaultConnectionMessage: { type: DataTypes.TEXT, allowNull: true },
    followerPolicy: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'open' },
    connectionPolicy: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'open' },
    primaryContactName: { type: DataTypes.STRING(255), allowNull: true },
    primaryContactEmail: { type: DataTypes.STRING(255), allowNull: true },
    primaryContactPhone: { type: DataTypes.STRING(50), allowNull: true },
  },
  { tableName: 'agency_profiles' },
);

const CompanyProfile = defineModel(
  'CompanyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    companyName: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING(2048), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    logoUrl: { type: DataTypes.STRING(2048), allowNull: true },
    bannerUrl: { type: DataTypes.STRING(2048), allowNull: true },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    contactPhone: { type: DataTypes.STRING(50), allowNull: true },
    socialLinks: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'company_profiles' },
);

if (!User.associations?.Profile) {
  User.hasOne(Profile, { foreignKey: 'userId', as: 'Profile' });
}
if (!Profile.associations?.User) {
  Profile.belongsTo(User, { foreignKey: 'userId', as: 'User' });
}

if (!User.associations?.AgencyProfile) {
  User.hasOne(AgencyProfile, { foreignKey: 'userId', as: 'AgencyProfile' });
}
if (!AgencyProfile.associations?.User) {
  AgencyProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });
}

if (!User.associations?.CompanyProfile) {
  User.hasOne(CompanyProfile, { foreignKey: 'userId', as: 'CompanyProfile' });
}
if (!CompanyProfile.associations?.User) {
  CompanyProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });
}

export { sequelize, User, Profile, AgencyProfile, CompanyProfile };

export default { sequelize, User, Profile, AgencyProfile, CompanyProfile };
