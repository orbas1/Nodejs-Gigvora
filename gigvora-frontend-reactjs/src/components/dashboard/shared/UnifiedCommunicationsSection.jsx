import PropTypes from 'prop-types';
import clsx from 'clsx';
import CollapsibleSection from './CollapsibleSection.jsx';

function ModuleCard({ title, summary, statusTone, children, actions }) {
  return (
    <div className={clsx('space-y-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm', statusTone)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Shared workspace</p>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          {summary ? <p className="mt-1 text-sm text-slate-600">{summary}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

ModuleCard.propTypes = {
  title: PropTypes.string.isRequired,
  summary: PropTypes.string,
  statusTone: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
};

ModuleCard.defaultProps = {
  summary: undefined,
  statusTone: undefined,
  actions: null,
};

export default function UnifiedCommunicationsSection({ id, title, description, modules, defaultOpen }) {
  const filteredModules = modules.filter(Boolean);

  if (!filteredModules.length) {
    return null;
  }

  return (
    <CollapsibleSection
      id={id}
      title={title}
      description={description}
      badge="Operations"
      defaultOpen={defaultOpen}
      contentClassName="space-y-5"
    >
      {filteredModules.map((module) => (
        <ModuleCard key={module.id} title={module.title} summary={module.summary} statusTone={module.statusTone} actions={module.actions}>
          {module.component}
        </ModuleCard>
      ))}
    </CollapsibleSection>
  );
}

UnifiedCommunicationsSection.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  modules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      summary: PropTypes.string,
      statusTone: PropTypes.string,
      actions: PropTypes.node,
      component: PropTypes.node.isRequired,
    }),
  ),
  defaultOpen: PropTypes.bool,
};

UnifiedCommunicationsSection.defaultProps = {
  id: undefined,
  description: undefined,
  modules: [],
  defaultOpen: true,
};
