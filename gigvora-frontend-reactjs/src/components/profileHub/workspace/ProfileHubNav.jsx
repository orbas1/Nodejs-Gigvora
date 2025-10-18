import clsx from 'clsx';

export default function ProfileHubNav({ panels, activePanelId, onSelect }) {
  return (
    <nav className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm">
      {panels.map((panel) => {
        const isActive = panel.id === activePanelId;
        return (
          <button
            key={panel.id}
            type="button"
            onClick={() => onSelect(panel.id)}
            className={clsx(
              'group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-accent text-white shadow-inner'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            {panel.icon ? <panel.icon className={clsx('h-5 w-5', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} /> : null}
            <span className="truncate">{panel.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
