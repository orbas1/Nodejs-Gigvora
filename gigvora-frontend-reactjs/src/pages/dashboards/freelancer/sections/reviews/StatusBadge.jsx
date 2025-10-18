import { getStatusConfig } from './utils.js';

export default function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${config.badge}`}
    >
      {config.label}
    </span>
  );
}
