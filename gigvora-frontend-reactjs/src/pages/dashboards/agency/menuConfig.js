export const MENU_GROUPS = [
  {
    label: 'Gigs',
    items: [
      { id: 'manage', name: 'Manage', sectionId: 'agency-gig-management' },
      { id: 'timeline', name: 'Timeline', sectionId: 'agency-gig-timeline' },
      { id: 'build', name: 'Build', sectionId: 'agency-gig-creation' },
    ],
  },
  {
    label: 'Status',
    items: [
      { id: 'open', name: 'Open', sectionId: 'agency-open-gigs' },
      { id: 'closed', name: 'Closed', sectionId: 'agency-closed-gigs' },
      { id: 'proofs', name: 'Proofs', sectionId: 'agency-gig-submissions' },
    ],
  },
  {
    label: 'Chat',
    items: [{ id: 'chat', name: 'Chat', sectionId: 'agency-gig-chat' }],
  },
];

export const AVAILABLE_DASHBOARDS = [
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'admin', label: 'Admin', href: '/dashboard/admin' },
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
];
