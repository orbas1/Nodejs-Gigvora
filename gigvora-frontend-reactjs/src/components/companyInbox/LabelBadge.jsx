export default function LabelBadge({ label, className = '' }) {
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: `${label.color}1a`, color: label.color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
      {label.name}
    </span>
  );
}
