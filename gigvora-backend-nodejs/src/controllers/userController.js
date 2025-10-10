import { User, Profile, CompanyProfile, AgencyProfile, FreelancerProfile } from '../models/index.js';

export async function listUsers(req, res) {
  const users = await User.findAll({
    include: [Profile, CompanyProfile, AgencyProfile, FreelancerProfile],
  });
  res.json(users);
}

export async function getUserProfile(req, res) {
  const user = await User.findByPk(req.params.id, {
    include: [Profile, CompanyProfile, AgencyProfile, FreelancerProfile],
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
}

export async function updateProfile(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  await user.update(req.body);
  res.json(user);
}
