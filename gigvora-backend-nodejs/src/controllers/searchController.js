import { Job, Gig, Project, Volunteering, ExperienceLaunchpad, User } from '../models/index.js';

export async function globalSearch(req, res) {
  const { q } = req.query;
  const [jobs, gigs, projects, volunteering, launchpads, people] = await Promise.all([
    Job.searchByTerm(q),
    Gig.searchByTerm(q),
    Project.searchByTerm(q),
    Volunteering.searchByTerm(q),
    ExperienceLaunchpad.searchByTerm(q),
    User.searchByTerm(q),
  ]);
  res.json({ jobs, gigs, projects, volunteering, launchpads, people });
}

export async function searchJobs(req, res) {
  const results = await Job.searchByTerm(req.query.q);
  res.json(results);
}

export async function searchGigs(req, res) {
  const results = await Gig.searchByTerm(req.query.q);
  res.json(results);
}

export async function searchProjects(req, res) {
  const results = await Project.searchByTerm(req.query.q);
  res.json(results);
}

export async function searchVolunteering(req, res) {
  const results = await Volunteering.searchByTerm(req.query.q);
  res.json(results);
}

export async function searchLaunchpad(req, res) {
  const results = await ExperienceLaunchpad.searchByTerm(req.query.q);
  res.json(results);
}
