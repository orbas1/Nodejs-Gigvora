import SectionShell from '../../SectionShell.jsx';
import { FEATURE_TOGGLES } from '../sampleData.js';

export default function WorkspaceSettingsSection() {
  return (
    <SectionShell
      id="workspace-settings"
      title="Workspace settings"
      description="Control advanced systems, governance, and personalization preferences."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Feature toggles</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {FEATURE_TOGGLES.map((toggle) => (
              <li key={toggle.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{toggle.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{toggle.description}</p>
                </div>
                <input type="checkbox" defaultChecked className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Safety controls</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              {[
                'Require 2FA for all sign-ins',
                'Mask sensitive client data in shared views',
                'Enable advanced audit logs',
              ].map((policy) => (
                <li key={policy} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span>{policy}</span>
                  <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Personalization</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</span>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                  <option>Gigvora Light</option>
                  <option>Midnight Ops</option>
                  <option>Solar Burst</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notification digest</span>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none">
                  <option>Daily summary</option>
                  <option>Weekly highlights</option>
                  <option>Real-time alerts</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
