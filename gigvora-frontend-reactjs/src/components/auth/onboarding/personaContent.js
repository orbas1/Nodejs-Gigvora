import personasDataset from '@shared-contracts/onboarding/personas.json';

export const DEFAULT_PRIMER_HIGHLIGHTS = [
  'Personalise your hero, invites, and insights with persona-backed defaults.',
  'Invite your core collaborators so approvals and rituals stay in sync.',
  'Activate AI story starters, analytics, and executive briefs on launch.',
];

const RAW_PERSONAS = Array.isArray(personasDataset) ? personasDataset : [];

export function normalisePersona(record) {
  if (!record) {
    return null;
  }
  const id = record.slug || record.id || record.personaKey;
  if (!id) {
    return null;
  }
  const ensureArray = (value, mapFn) => {
    if (!Array.isArray(value)) {
      return [];
    }
    return mapFn ? value.map(mapFn).filter(Boolean) : value.filter(Boolean);
  };

  return {
    id,
    title: record.title || '',
    subtitle: record.subtitle || '',
    headline: record.headline || null,
    benefits: ensureArray(record.benefits),
    metrics: ensureArray(record.metrics, (metric) => {
      if (!metric || !metric.label || !metric.value) {
        return null;
      }
      return {
        label: String(metric.label),
        value: String(metric.value),
        delta: metric.delta ? String(metric.delta) : undefined,
      };
    }),
    signatureMoments: ensureArray(record.signatureMoments, (moment) => {
      if (!moment || !moment.label || !moment.description) {
        return null;
      }
      return {
        label: String(moment.label),
        description: String(moment.description),
      };
    }),
    recommendedModules: ensureArray(record.recommendedModules, (module) => String(module)),
    heroMedia:
      record.heroMedia && typeof record.heroMedia === 'object'
        ? {
            poster: record.heroMedia.poster || null,
            alt: record.heroMedia.alt || null,
          }
        : {},
    metadata:
      record.metadata && typeof record.metadata === 'object'
        ? {
            ...record.metadata,
            primerHighlights: ensureArray(record.metadata.primerHighlights, (item) => String(item)),
            recommendedRoles: ensureArray(record.metadata.recommendedRoles, (role) => String(role)),
          }
        : {},
  };
}

export const DEFAULT_PERSONAS_FOR_SELECTION = RAW_PERSONAS.map(normalisePersona).filter(Boolean);

export function buildPersonaPrimerSlides(persona, insights = []) {
  if (!persona) {
    return [];
  }

  const modules = Array.isArray(persona.recommendedModules) ? persona.recommendedModules : [];
  const signatureMoments = Array.isArray(persona.signatureMoments) ? persona.signatureMoments : [];
  const heroMedia = persona.heroMedia && typeof persona.heroMedia === 'object' ? persona.heroMedia : {};
  const personaHighlights = Array.isArray(persona.metadata?.primerHighlights)
    ? persona.metadata.primerHighlights.filter(Boolean)
    : [];
  const insightHighlights = Array.isArray(insights)
    ? insights
        .filter((entry) => entry && entry.label === 'Signature wins')
        .flatMap((entry) => (Array.isArray(entry.value) ? entry.value : []))
        .filter(Boolean)
    : [];
  const highlights = personaHighlights.length ? personaHighlights : insightHighlights.length ? insightHighlights : DEFAULT_PRIMER_HIGHLIGHTS;
  const suggestedRoles = Array.isArray(persona.metadata?.recommendedRoles) ? persona.metadata.recommendedRoles : [];
  const metrics = Array.isArray(persona.metrics)
    ? persona.metrics
        .slice(0, 2)
        .map((metric) => ({ label: metric.label, value: metric.value }))
        .filter((metric) => metric.label && metric.value)
    : [];

  const formatPillar = (pillar) =>
    pillar
      ? pillar
          .split('-')
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
          .join(' ')
      : null;

  const slides = [
    {
      id: `${persona.id}-overview`,
      pill: formatPillar(persona.metadata?.personaPillar) || persona.title || 'Workspace primer',
      title: persona.headline || `Launch the ${persona.title.toLowerCase()}`,
      description: persona.subtitle || persona.headline || '',
      metrics,
      checklist: [
        highlights[0],
        modules.length ? `Preloaded modules: ${modules.slice(0, 3).join(', ')}` : null,
        highlights[1],
      ].filter(Boolean),
      media:
        heroMedia.poster
          ? {
              type: 'image',
              src: heroMedia.poster,
              alt: heroMedia.alt || `${persona.title} hero media`,
            }
          : undefined,
    },
  ];

  signatureMoments.forEach((moment, index) => {
    slides.push({
      id: `${persona.id}-moment-${index + 1}`,
      pill: `Moment ${index + 1}`,
      title: moment.label,
      description: moment.description,
      checklist: [
        modules[index] ? `Align with ${modules[index]}` : null,
        highlights[(index + 1) % highlights.length],
      ].filter(Boolean),
    });
  });

  slides.push({
    id: `${persona.id}-collaboration`,
    pill: 'Collaboration',
    title: 'Invite collaborators and calibrate signals',
    description:
      'Confirm who publishes updates, reviews analytics, and approves storytelling so workflows stay coordinated.',
    checklist: [
      'Add at least one collaborator before launch',
      metrics[0]?.label ? `Track ${metrics[0].label.toLowerCase()} from day one` : null,
      suggestedRoles.length ? `Suggested roles: ${suggestedRoles.join(', ')}` : null,
      highlights[(signatureMoments.length + 1) % highlights.length],
    ].filter(Boolean),
  });

  return slides;
}

export default {
  DEFAULT_PERSONAS_FOR_SELECTION,
  DEFAULT_PRIMER_HIGHLIGHTS,
  buildPersonaPrimerSlides,
  normalisePersona,
};
