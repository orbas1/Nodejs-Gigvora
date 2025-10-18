export default function FormField({ label, description, children, inline = false, action }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="text-xs text-slate-500">{action}</div> : null}
      </div>
      <div className={inline ? 'flex items-center gap-3' : ''}>{children}</div>
    </div>
  );
}
