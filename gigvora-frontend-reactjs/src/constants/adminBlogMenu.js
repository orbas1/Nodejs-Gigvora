export const ADMIN_BLOG_MENU_SECTIONS = [
  {
    label: 'Main',
    items: [
      { id: 'overview', name: 'Home', sectionId: 'overview' },
      { id: 'editor', name: 'Write', sectionId: 'editor' },
      { id: 'library', name: 'Posts', sectionId: 'library' },
      { id: 'metrics', name: 'Stats', sectionId: 'metrics' },
      { id: 'comments', name: 'Comments', sectionId: 'comments' },
    ],
  },
  {
    label: 'Structure',
    items: [
      { id: 'categories', name: 'Topics', sectionId: 'categories' },
      { id: 'tags', name: 'Tags', sectionId: 'tags' },
    ],
  },
];

export default ADMIN_BLOG_MENU_SECTIONS;
