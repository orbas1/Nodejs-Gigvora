import { ChartBarSquareIcon, GlobeAltIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import SectionShell from '../../SectionShell.jsx';
import { QUICK_ACCESS_COMMERCE, QUICK_ACCESS_GROWTH, QUICK_ACCESS_SECTIONS } from '../sampleData.js';

export default function OperationalQuickAccessSection() {
  return (
    <SectionShell
      id="quick-access"
      title="Operational quick access"
      description="Project workspace dashboards, gig commerce, and growth shortcuts ready for action."
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {QUICK_ACCESS_SECTIONS.map((section) => (
            <div key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <ChartBarSquareIcon className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{section.description}</p>
                </div>
              </div>
              {section.bullets?.length ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <RectangleStackIcon className="h-6 w-6 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900">Gig commerce</h3>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {QUICK_ACCESS_COMMERCE.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                {card.bullets?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
                    {card.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="h-6 w-6 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-900">Growth & profile</h3>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {QUICK_ACCESS_GROWTH.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
