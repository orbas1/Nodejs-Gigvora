export const ADMIN_DASHBOARD_MENU_SECTIONS = [
  {
    id: 'admin-pages',
    label: 'Dashboards',
    items: [
      { id: 'admin-home', name: 'Home', href: '/dashboard/admin' },
      { id: 'admin-interviews', name: 'Interviews', href: '/dashboard/admin/interviews' },
      { id: 'admin-blog', name: 'Blog', href: '/dashboard/admin/blog' },
    ],
  },
];

export default ADMIN_DASHBOARD_MENU_SECTIONS;
