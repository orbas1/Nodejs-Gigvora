import { Sequelize, DataTypes, Op } from 'sequelize';
import databaseConfig from '../config/database.js';

export const sequelize = new Sequelize({
  ...databaseConfig,
});

export const User = sequelize.define(
  'User',
  {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    address: DataTypes.STRING,
    age: DataTypes.INTEGER,
    userType: {
      type: DataTypes.ENUM('user', 'company', 'freelancer', 'agency', 'admin'),
      defaultValue: 'user',
    },
  },
  {
    tableName: 'users',
  },
);

User.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  return User.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.like]: `%${term}%` } },
        { lastName: { [Op.like]: `%${term}%` } },
        { email: { [Op.like]: `%${term}%` } },
      ],
    },
    limit: 20,
  });
};

export const Profile = sequelize.define(
  'Profile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    headline: DataTypes.STRING,
    bio: DataTypes.TEXT,
    skills: DataTypes.TEXT,
    experience: DataTypes.TEXT,
    education: DataTypes.TEXT,
  },
  { tableName: 'profiles' },
);

export const CompanyProfile = sequelize.define(
  'CompanyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    companyName: DataTypes.STRING,
    description: DataTypes.TEXT,
    website: DataTypes.STRING,
  },
  { tableName: 'company_profiles' },
);

export const AgencyProfile = sequelize.define(
  'AgencyProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    agencyName: DataTypes.STRING,
    focusArea: DataTypes.STRING,
    website: DataTypes.STRING,
  },
  { tableName: 'agency_profiles' },
);

export const FreelancerProfile = sequelize.define(
  'FreelancerProfile',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: DataTypes.STRING,
    hourlyRate: DataTypes.DECIMAL,
    availability: DataTypes.STRING,
  },
  { tableName: 'freelancer_profiles' },
);

export const FeedPost = sequelize.define(
  'FeedPost',
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    content: DataTypes.TEXT,
    visibility: { type: DataTypes.ENUM('public', 'connections'), defaultValue: 'public' },
  },
  { tableName: 'feed_posts' },
);

export const Job = sequelize.define(
  'Job',
  {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    location: DataTypes.STRING,
    employmentType: DataTypes.STRING,
  },
  { tableName: 'jobs' },
);

Job.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  return Job.findAll({
    where: { title: { [Op.like]: `%${term}%` } },
    limit: 20,
  });
};

export const Gig = sequelize.define(
  'Gig',
  {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    budget: DataTypes.STRING,
    duration: DataTypes.STRING,
  },
  { tableName: 'gigs' },
);

Gig.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  return Gig.findAll({
    where: { title: { [Op.like]: `%${term}%` } },
    limit: 20,
  });
};

export const Project = sequelize.define(
  'Project',
  {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    status: DataTypes.STRING,
  },
  { tableName: 'projects' },
);

Project.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  return Project.findAll({
    where: { title: { [Op.like]: `%${term}%` } },
    limit: 20,
  });
};

export const ExperienceLaunchpad = sequelize.define(
  'ExperienceLaunchpad',
  {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    track: DataTypes.STRING,
  },
  { tableName: 'experience_launchpads' },
);

ExperienceLaunchpad.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  return ExperienceLaunchpad.findAll({
    where: { title: { [Op.like]: `%${term}%` } },
    limit: 20,
  });
};

export const Volunteering = sequelize.define(
  'Volunteering',
  {
    title: DataTypes.STRING,
    organization: DataTypes.STRING,
    description: DataTypes.TEXT,
  },
  { tableName: 'volunteering_roles' },
);

Volunteering.searchByTerm = async function searchByTerm(term) {
  if (!term) return [];
  return Volunteering.findAll({
    where: { title: { [Op.like]: `%${term}%` } },
    limit: 20,
  });
};

export const Group = sequelize.define(
  'Group',
  {
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
  },
  { tableName: 'groups' },
);

export const GroupMembership = sequelize.define(
  'GroupMembership',
  {
    userId: DataTypes.INTEGER,
    groupId: DataTypes.INTEGER,
    role: DataTypes.STRING,
  },
  { tableName: 'group_memberships' },
);

export const Connection = sequelize.define(
  'Connection',
  {
    requesterId: DataTypes.INTEGER,
    addresseeId: DataTypes.INTEGER,
    status: { type: DataTypes.ENUM('pending', 'accepted', 'rejected'), defaultValue: 'pending' },
  },
  { tableName: 'connections' },
);

export const TwoFactorToken = sequelize.define(
  'TwoFactorToken',
  {
    email: { type: DataTypes.STRING, primaryKey: true },
    code: DataTypes.STRING,
    expiresAt: DataTypes.DATE,
  },
  { tableName: 'two_factor_tokens', timestamps: false },
);

User.hasOne(Profile, { foreignKey: 'userId' });
Profile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(CompanyProfile, { foreignKey: 'userId' });
CompanyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(AgencyProfile, { foreignKey: 'userId' });
AgencyProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(FreelancerProfile, { foreignKey: 'userId' });
FreelancerProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(FeedPost, { foreignKey: 'userId' });
FeedPost.belongsTo(User, { foreignKey: 'userId' });

User.belongsToMany(Group, { through: GroupMembership, foreignKey: 'userId' });
Group.belongsToMany(User, { through: GroupMembership, foreignKey: 'groupId' });

User.belongsToMany(User, {
  through: Connection,
  as: 'connections',
  foreignKey: 'requesterId',
  otherKey: 'addresseeId',
});

export default {
  sequelize,
  User,
  Profile,
  CompanyProfile,
  AgencyProfile,
  FreelancerProfile,
  FeedPost,
  Job,
  Gig,
  Project,
  ExperienceLaunchpad,
  Volunteering,
  Group,
  GroupMembership,
  Connection,
  TwoFactorToken,
};
