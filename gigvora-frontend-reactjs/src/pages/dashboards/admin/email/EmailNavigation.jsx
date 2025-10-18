import { useMemo } from 'react';
import { Squares2X2Icon } from '@heroicons/react/24/outline';

export default function EmailNavigation({ sections, activeSection, onSelect }) {
  const items = useMemo(() => (Array.isArray(sections) ? sections : []), [sections]);

  if (!items.length) {
    return null;
  }

  return (
    <nav className="lg:w-60">
      <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white/80 backdrop-blur px-4 py-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
          Email menu
        </div>
        <ul className="space-y-2 text-sm font-medium text-slate-600">
          {items.map((item) => {
            const isActive = activeSection === item.sectionId || activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.sectionId)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? 'border-accent bg-accent/10 text-accent shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <span>{item.name}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${isActive ? 'bg-accent' : 'bg-slate-300'}`}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
