import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import { PROJECT_WORKSPACE_FEATURES } from '../sampleData.js';

export default function ProjectWorkspaceExcellenceSection() {
  return (
    <SectionShell
      id="project-excellence"
      title="Project workspace excellence"
      description="Deliver projects with structure. Each workspace combines real-time messaging, documents, tasks, billing, and client approvals."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {PROJECT_WORKSPACE_FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-500" />
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
