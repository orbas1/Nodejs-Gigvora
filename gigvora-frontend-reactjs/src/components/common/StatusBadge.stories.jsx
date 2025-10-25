import StatusBadge, { DEFAULT_STATUS_APPEARANCE } from './StatusBadge.jsx';

export default {
  title: 'Common/StatusBadge',
  component: StatusBadge,
  args: {
    status: 'in_progress',
    label: undefined,
    uppercase: true,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'tint', 'solid'],
    },
    tone: {
      control: 'select',
      options: ['slate', 'blue', 'emerald', 'amber', 'rose', 'indigo', 'accent'],
    },
    uppercase: {
      control: 'boolean',
    },
    status: {
      control: 'text',
    },
  },
};

function Template(args) {
  return <StatusBadge {...args} />;
}

export const Playground = Template.bind({});

export function PresetStatuses() {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(DEFAULT_STATUS_APPEARANCE).map(([key, appearance]) => (
        <StatusBadge key={key} status={key} tone={appearance.tone} variant={appearance.variant} />
      ))}
    </div>
  );
}

export function TintShowcase() {
  const variants = ['draft', 'review', 'scheduled', 'published', 'archived'];
  return (
    <div className="flex flex-wrap gap-3">
      {variants.map((status) => (
        <StatusBadge key={status} status={status} uppercase={false} />
      ))}
    </div>
  );
}
