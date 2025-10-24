import {
  filterProjectsByRisk,
  filterProjectsByStatus,
  searchProjects,
  sortProjects,
} from './utils.js';
import { trackDashboardEvent } from '../../../../../utils/analytics.js';

export function applyProjectFilters(projects, { term, status, risk, sort }) {
  const filtered = filterProjectsByRisk(
    filterProjectsByStatus(searchProjects(projects, term), status),
    risk,
  );
  const ordered = sortProjects(filtered, sort);
  trackDashboardEvent('freelancer.projects.filtered', {
    query: term,
    status,
    risk,
    sort,
    count: ordered.length,
  });
  return ordered;
}

export function exportProjectsToCsv(projects, { filename = 'gigvora-projects-export.csv' } = {}) {
  if (!Array.isArray(projects) || !projects.length) {
    throw new Error('No projects available to export.');
  }
  const header = ['ID', 'Title', 'Status', 'Client', 'Due', 'Budget Allocated', 'Budget Spent'];
  const rows = projects.map((project) => [
    project.id ?? '',
    project.title ?? '',
    project.status ?? '',
    project.metadata?.clientName ?? '',
    project.dueDate ? new Date(project.dueDate).toISOString() : '',
    project.budgetAllocated ?? 0,
    project.budgetSpent ?? 0,
  ]);
  const csv = [header, ...rows]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('CSV export is only available in the browser.');
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);

  trackDashboardEvent('freelancer.projects.exported', { count: projects.length });
}

export function logProjectAction(eventName, payload) {
  trackDashboardEvent(`freelancer.project.${eventName}`, payload);
}

export default {
  applyProjectFilters,
  exportProjectsToCsv,
  logProjectAction,
};
