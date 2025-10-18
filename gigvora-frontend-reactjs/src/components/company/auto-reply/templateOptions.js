export const CHANNEL_OPTIONS = [
  { value: 'direct', label: 'Direct' },
  { value: 'support', label: 'Support' },
  { value: 'project', label: 'Projects' },
  { value: 'contract', label: 'Contracts' },
  { value: 'group', label: 'Groups' },
];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'disabled', label: 'Paused' },
];

export const TONE_OPTIONS = ['Friendly', 'Professional', 'Concise', 'Empathetic'];

export function normalizeTemplate(template) {
  if (!template) {
    return {
      title: '',
      summary: '',
      tone: '',
      instructions: '',
      sampleReply: '',
      channels: ['direct', 'support'],
      temperature: 0.35,
      status: 'active',
      isDefault: false,
    };
  }

  return {
    title: template.title ?? '',
    summary: template.summary ?? '',
    tone: template.tone ?? '',
    instructions: template.instructions ?? '',
    sampleReply: template.sampleReply ?? '',
    channels: Array.isArray(template.channels) && template.channels.length
      ? template.channels
      : ['direct', 'support'],
    temperature:
      typeof template.temperature === 'number'
        ? Math.max(0, Math.min(2, Number(template.temperature)))
        : 0.35,
    status: template.status ?? 'active',
    isDefault: Boolean(template.isDefault),
  };
}

export default {
  CHANNEL_OPTIONS,
  STATUS_OPTIONS,
  TONE_OPTIONS,
  normalizeTemplate,
};
