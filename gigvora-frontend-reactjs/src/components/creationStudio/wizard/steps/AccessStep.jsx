import PropTypes from 'prop-types';
import { ROLE_OPTIONS, VISIBILITY_OPTIONS } from '../../config.js';

export default function AccessStep({ draft, onChange }) {
  const ensurePermissionRecord = (role) => {
    const existing = (draft.permissions ?? []).find((entry) => entry.role === role);
    if (existing) {
      return existing;
    }
    return {
      role,
      canView: false,
      canEdit: false,
      canPublish: false,
      canManageAssets: false,
    };
  };

  const handleRoleAccessToggle = (role) => {
    const current = new Set(draft.roleAccess ?? []);
    if (current.has(role)) {
      current.delete(role);
    } else {
      current.add(role);
    }
    onChange({ roleAccess: Array.from(current) });
  };

  const handlePermissionToggle = (role, key, value) => {
    const nextPermissions = ROLE_OPTIONS.map((option) => {
      const record = ensurePermissionRecord(option.value);
      if (option.value === role) {
        return { ...record, [key]: value };
      }
      return record;
    }).filter((record) => record.canView || record.canEdit || record.canPublish || record.canManageAssets);
    const updates = { permissions: nextPermissions };
    if (key === 'canView') {
      const current = new Set(draft.roleAccess ?? []);
      if (value) {
        current.add(role);
      } else {
        current.delete(role);
      }
      updates.roleAccess = Array.from(current);
    }
    onChange(updates);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Visibility
          <select
            value={draft.visibility}
            onChange={(event) => onChange({ visibility: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Who can view</p>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((role) => {
              const active = (draft.roleAccess ?? []).includes(role.value);
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleAccessToggle(role.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-slate-900 text-white shadow hover:bg-slate-800'
                      : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permissions</p>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-center font-semibold">View</th>
                <th className="px-4 py-3 text-center font-semibold">Edit</th>
                <th className="px-4 py-3 text-center font-semibold">Publish</th>
                <th className="px-4 py-3 text-center font-semibold">Assets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {ROLE_OPTIONS.map((role) => {
                const record = ensurePermissionRecord(role.value);
                return (
                  <tr key={role.value}>
                    <td className="px-4 py-3 font-medium text-slate-900">{role.label}</td>
                    {['canView', 'canEdit', 'canPublish', 'canManageAssets'].map((field) => (
                      <td key={field} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={record[field] ?? false}
                          onChange={(event) => handlePermissionToggle(role.value, field, event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

AccessStep.propTypes = {
  draft: PropTypes.shape({
    visibility: PropTypes.string,
    roleAccess: PropTypes.arrayOf(PropTypes.string),
    permissions: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string.isRequired,
        canView: PropTypes.bool,
        canEdit: PropTypes.bool,
        canPublish: PropTypes.bool,
        canManageAssets: PropTypes.bool,
      }),
    ),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
