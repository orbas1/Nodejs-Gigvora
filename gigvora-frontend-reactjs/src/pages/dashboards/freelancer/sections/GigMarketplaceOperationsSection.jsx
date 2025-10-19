import { MegaphoneIcon } from '@heroicons/react/24/outline';
import SectionShell from '../../SectionShell.jsx';
import { GIG_MARKETPLACE_FEATURES } from '../sampleData.js';

export default function GigMarketplaceOperationsSection() {
  return (
    <SectionShell
      id="gig-marketplace"
      title="Gig marketplace operations"
      description="Manage the full gig lifecycle from publishing listings to fulfillment, upsells, and post-delivery reviews."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {GIG_MARKETPLACE_FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <MegaphoneIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            </div>
            {feature.bullets?.length ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
