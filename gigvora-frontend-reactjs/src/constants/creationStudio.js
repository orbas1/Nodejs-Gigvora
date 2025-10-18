export const CREATION_STUDIO_TYPES = [
  { id: 'job', label: 'Job', shortLabel: 'Job' },
  { id: 'project', label: 'Project', shortLabel: 'Project' },
  { id: 'gig', label: 'Gig', shortLabel: 'Gig' },
  { id: 'launchpad_job', label: 'Launchpad Job', shortLabel: 'Role' },
  { id: 'launchpad_project', label: 'Launchpad Project', shortLabel: 'Build' },
  { id: 'volunteer_opportunity', label: 'Volunteer Role', shortLabel: 'Volunteer' },
  { id: 'networking_session', label: 'Networking Session', shortLabel: 'Event' },
  { id: 'blog_post', label: 'Blog Post', shortLabel: 'Blog' },
  { id: 'group', label: 'Group', shortLabel: 'Group' },
  { id: 'page', label: 'Page', shortLabel: 'Page' },
  { id: 'ad', label: 'Gigvora Ad', shortLabel: 'Ad' },
];

export const CREATION_STUDIO_STATUSES = [
  { id: 'draft', label: 'Draft', tone: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' },
  { id: 'scheduled', label: 'Scheduled', tone: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  { id: 'published', label: 'Published', tone: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  { id: 'archived', label: 'Archived', tone: 'text-slate-500', badge: 'bg-slate-100 text-slate-500' },
];

export const CREATION_STUDIO_GROUPS = [
  { id: 'jobs', label: 'Jobs', types: ['job'], defaultType: 'job' },
  { id: 'projects', label: 'Projects', types: ['project'], defaultType: 'project' },
  { id: 'gigs', label: 'Gigs', types: ['gig'], defaultType: 'gig' },
  { id: 'launch', label: 'Launch', types: ['launchpad_job', 'launchpad_project'], defaultType: 'launchpad_job' },
  { id: 'volunteer', label: 'Volunteer', types: ['volunteer_opportunity'], defaultType: 'volunteer_opportunity' },
  { id: 'events', label: 'Events', types: ['networking_session'], defaultType: 'networking_session' },
  { id: 'blog', label: 'Blog', types: ['blog_post'], defaultType: 'blog_post' },
  { id: 'groups', label: 'Groups', types: ['group'], defaultType: 'group' },
  { id: 'pages', label: 'Pages', types: ['page'], defaultType: 'page' },
  { id: 'ads', label: 'Ads', types: ['ad'], defaultType: 'ad' },
];

export function getCreationType(typeId) {
  return CREATION_STUDIO_TYPES.find((type) => type.id === typeId) ?? null;
}

export function getCreationStatus(statusId) {
  return CREATION_STUDIO_STATUSES.find((status) => status.id === statusId) ?? null;
}

export default {
  CREATION_STUDIO_TYPES,
  CREATION_STUDIO_STATUSES,
  CREATION_STUDIO_GROUPS,
  getCreationType,
  getCreationStatus,
};
