const CURRENCY_FORMATTERS = new Map();

export function formatCurrency(value, currency = 'USD') {
  const amount = Number(value);
  const numeric = Number.isFinite(amount) ? amount : 0;
  const key = currency || 'USD';
  if (!CURRENCY_FORMATTERS.has(key)) {
    CURRENCY_FORMATTERS.set(
      key,
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: key,
        maximumFractionDigits: 0,
      }),
    );
  }
  return CURRENCY_FORMATTERS.get(key).format(numeric);
}

export function formatDate(value) {
  if (!value) {
    return 'No date';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No date';
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateForInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function formatPercent(value) {
  const numeric = Number(value);
  const valid = Number.isFinite(numeric) ? numeric : 0;
  return `${Math.max(0, Math.min(100, valid)).toFixed(0)}%`;
}

export function getProjectStatus(project) {
  if (!project) {
    return 'planning';
  }
  return project.lifecycle?.workspaceStatus ?? project.workspace?.status ?? project.status ?? 'planning';
}

export function getRiskLevel(project) {
  if (!project) {
    return 'low';
  }
  return project.lifecycle?.riskLevel ?? project.workspace?.riskLevel ?? 'low';
}

export function isProjectArchived(project) {
  return Boolean(project?.archivedAt);
}

export function searchProjects(projects, term) {
  if (!term) {
    return projects;
  }
  const query = term.trim().toLowerCase();
  if (!query) {
    return projects;
  }
  return projects.filter((project) => {
    const haystack = [
      project.title,
      project.description,
      project.metadata?.clientName,
      project.metadata?.workspaceUrl,
      project.lifecycle?.tags?.join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function filterProjectsByStatus(projects, status) {
  if (!status || status === 'all') {
    return projects;
  }
  return projects.filter((project) => getProjectStatus(project) === status);
}

export function filterProjectsByRisk(projects, risk) {
  if (!risk || risk === 'all') {
    return projects;
  }
  return projects.filter((project) => getRiskLevel(project) === risk);
}

export function sortProjects(projects, sortKey) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  if (sortKey === 'due') {
    return [...safeProjects].sort((a, b) => {
      const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return timeA - timeB;
    });
  }
  if (sortKey === 'client') {
    return [...safeProjects].sort((a, b) => {
      const clientA = (a.metadata?.clientName ?? '').toLowerCase();
      const clientB = (b.metadata?.clientName ?? '').toLowerCase();
      return clientA.localeCompare(clientB);
    });
  }
  if (sortKey === 'progress') {
    return [...safeProjects].sort((a, b) => {
      const progressA = Number(a.workspace?.progressPercent ?? a.lifecycle?.progressPercent ?? 0);
      const progressB = Number(b.workspace?.progressPercent ?? b.lifecycle?.progressPercent ?? 0);
      return progressB - progressA;
    });
  }
  return [...safeProjects].sort((a, b) => {
    const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return updatedB - updatedA;
  });
}

export function bytesToDisplay(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  let value = size;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || units[index] === 'B' ? 0 : 1)} ${units[index]}`;
}

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeProject(project) {
  if (!project) {
    return null;
  }
  const workspace = project.workspace ?? {};
  const lifecycle = project.lifecycle ?? {};
  return {
    ...project,
    workspace: {
      status: workspace.status ?? lifecycle.workspaceStatus ?? project.status ?? 'planning',
      progressPercent: toNumber(workspace.progressPercent ?? lifecycle.progressPercent ?? 0),
      riskLevel: workspace.riskLevel ?? lifecycle.riskLevel ?? 'low',
      nextMilestone: workspace.nextMilestone ?? lifecycle.nextMilestone ?? '',
      nextMilestoneDueAt: workspace.nextMilestoneDueAt ?? lifecycle.nextDueAt ?? null,
      notes: workspace.notes ?? '',
      metrics: workspace.metrics ?? {},
    },
  };
}

export function getProjectClient(project) {
  return project?.metadata?.clientName ?? 'Client';
}

export function getProjectTags(project) {
  const tags = project?.lifecycle?.tags ?? project?.metadata?.tags;
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.map((tag) => tag.toString()).filter(Boolean);
}

export function getWorkspaceUrl(project) {
  return project?.metadata?.workspaceUrl ?? null;
}
