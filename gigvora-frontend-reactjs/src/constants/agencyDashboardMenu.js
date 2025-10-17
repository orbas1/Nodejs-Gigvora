export const AGENCY_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'agency-section',
    label: 'Agency',
    items: [
      { id: 'agency-home', name: 'Home', sectionId: 'agency-overview' },
      { id: 'volunteer-home', name: 'Volunteer', sectionId: 'volunteering-home' },
    ],
  },
  {
    id: 'volunteer-section',
    label: 'Volunteer',
    items: [
      { id: 'volunteer-deals', name: 'Deals', sectionId: 'volunteering-home' },
      { id: 'volunteer-apply', name: 'Apply', sectionId: 'volunteering-home' },
      { id: 'volunteer-replies', name: 'Replies', sectionId: 'volunteering-home' },
      { id: 'volunteer-spend', name: 'Spend', sectionId: 'volunteering-home' },
    ],
  },
];

export default AGENCY_DASHBOARD_MENU_SECTIONS;
