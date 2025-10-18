import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

export const AGENCY_MENU_SECTIONS = [
  {
    id: 'core',
    label: 'Core',
    items: [
      { id: 'overview', name: 'Home', icon: HomeModernIcon, href: '/dashboard/agency', sectionId: 'overview' },
      { id: 'events', name: 'Events', icon: ClipboardDocumentListIcon, href: '/dashboard/agency/events', sectionId: 'agency-event-management' },
      { id: 'calendar', name: 'Schedule', icon: CalendarDaysIcon, href: '/dashboard/agency/calendar', sectionId: 'calendar' },
      { id: 'alliances', name: 'Pods', icon: UserGroupIcon, href: '/dashboard/agency#alliances', sectionId: 'alliances' },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      { id: 'projects', name: 'Projects', icon: WrenchScrewdriverIcon, href: '/dashboard/agency/projects', sectionId: 'projects-workspace' },
      { id: 'gigs', name: 'Gigs', icon: ClipboardDocumentListIcon, href: '/dashboard/agency#delivery', sectionId: 'delivery' },
      { id: 'talent', name: 'People', icon: UsersIcon, href: '/dashboard/agency#team-focus', sectionId: 'team-focus' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    items: [
      { id: 'market', name: 'Market', icon: MegaphoneIcon, sectionId: 'marketplace-leadership', href: '/dashboard/agency#marketplace-leadership' },
      { id: 'ads', name: 'Ads', icon: MegaphoneIcon, href: '/dashboard/agency#ads-operations', sectionId: 'ads-operations' },
      { id: 'playbooks', name: 'Playbooks', icon: ClipboardDocumentListIcon, href: '/pages?category=agency-growth', target: '_blank' },
    ],
  },
  {
    id: 'risk',
    label: 'Risk',
    items: [
      { id: 'id-verification', name: 'IDs', icon: ShieldCheckIcon, href: '/dashboard/agency#governance', sectionId: 'governance' },
      { id: 'inbox', name: 'Inbox', icon: MegaphoneIcon, href: '/dashboard/agency/inbox', sectionId: 'inbox' },
    ],
  },
  {
    id: 'volunteer',
    label: 'Volunteer',
    items: [
      { id: 'volunteer-home', name: 'Volunteer', sectionId: 'volunteering-home', href: '/dashboard/agency#volunteering-home' },
      { id: 'volunteer-deals', name: 'Deals', sectionId: 'volunteering-home', href: '/dashboard/agency#volunteering-home' },
      { id: 'volunteer-spend', name: 'Spend', sectionId: 'volunteering-home', href: '/dashboard/agency#volunteering-home' },
    ],
  },
];

export const AGENCY_DASHBOARD_MENU = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'agency-overview', name: 'Overview', sectionId: 'agency-overview', href: '/dashboard/agency' },
      { id: 'agency-events', name: 'Events', sectionId: 'agency-event-management', href: '/dashboard/agency/events' },
      { id: 'agency-calendar', name: 'Schedule', sectionId: 'calendar', href: '/dashboard/agency/calendar' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { id: 'agency-projects', name: 'Projects', href: '/dashboard/agency/projects' },
      { id: 'agency-inbox', name: 'Inbox', href: '/dashboard/agency/inbox' },
      { id: 'agency-settings', name: 'Governance', href: '/dashboard/agency#governance' },
    ],
  },
];

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
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
  { id: 'mentor', label: 'Mentor', href: '/dashboard/mentor' },
];

export const AGENCY_AVAILABLE_DASHBOARDS = AVAILABLE_DASHBOARDS;

export const AGENCY_DASHBOARD_ALTERNATES = [
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'agency-inbox', label: 'Inbox', href: '/dashboard/agency/inbox' },
  { id: 'agency-events', label: 'Events', href: '/dashboard/agency/events' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'freelancer', label: 'Talent', href: '/dashboard/freelancer' },
];

export const AGENCY_DASHBOARD_MENU_SECTIONS = AGENCY_MENU_SECTIONS;

export default AGENCY_MENU_SECTIONS;
