import PropTypes from 'prop-types';
import DashboardAccessGuard from '../security/DashboardAccessGuard.jsx';

function normalizeMenuItems(menuItems) {
  if (!Array.isArray(menuItems) || !menuItems.length) {
    return [
      {
        id: 'overview',
        label: 'Overview',
        description: 'High-level snapshot of your workspace.',
      },
    ];
  }

  return menuItems.map((item, index) => ({
    id: item.id ?? `menu-item-${index + 1}`,
    label: item.label ?? item.name ?? `Menu item ${index + 1}`,
    description: item.description ?? '',
  }));
}

export default function SimpleDashboardShell({
  role,
  title,
  subtitle,
  description,
  menuItems,
  children,
}) {
  const items = normalizeMenuItems(menuItems);
  const activeItemId = items[0]?.id;

  return (
    <DashboardAccessGuard requiredRoles={[role]}>
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 lg:flex-row">
          <aside className="lg:w-64">
            <nav aria-label="Dashboard sections" className="space-y-2 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Navigation</h2>
              <div className="mt-4 space-y-2">
                {items.map((item) => {
                  const isActive = item.id === activeItemId;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border px-4 py-3 transition ${
                        isActive
                          ? 'border-accent/40 bg-accent/10 text-accent'
                          : 'border-transparent bg-slate-50 text-slate-600'
                      }`}
                    >
                      <p className="font-semibold">{item.label}</p>
                      {item.description ? (
                        <p className="text-sm text-slate-500">{item.description}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </nav>
          </aside>

          <main className="flex-1 rounded-3xl bg-white p-10 shadow-sm">
            <header className="space-y-3 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">{role}</span>
                <h1 className="mt-1 text-3xl font-bold text-slate-900">{title}</h1>
              </div>
              {subtitle ? <p className="text-lg text-slate-600">{subtitle}</p> : null}
              {description ? <p className="text-sm text-slate-500">{description}</p> : null}
            </header>

            <section aria-labelledby={`${activeItemId}-heading`} className="mt-8 space-y-4">
              <h2 id={`${activeItemId}-heading`} className="text-2xl font-semibold text-slate-900">
                Overview
              </h2>
              {children ?? (
                <p className="text-slate-600">
                  This workspace is ready for future modules. Use the navigation to explore upcoming areas as they
                  are introduced.
                </p>
              )}
            </section>
          </main>
        </div>
      </div>
    </DashboardAccessGuard>
  );
}

SimpleDashboardShell.propTypes = {
  role: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  menuItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
  children: PropTypes.node,
};

SimpleDashboardShell.defaultProps = {
  subtitle: undefined,
  description: undefined,
  menuItems: undefined,
  children: undefined,
};
