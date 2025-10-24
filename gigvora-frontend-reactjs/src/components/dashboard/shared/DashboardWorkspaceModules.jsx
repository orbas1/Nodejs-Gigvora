import PropTypes from 'prop-types';
import DashboardCollapsibleSection from './DashboardCollapsibleSection.jsx';

export default function DashboardWorkspaceModules({ modules }) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {modules.map((module) => (
        <DashboardCollapsibleSection
          key={module.id}
          id={module.anchorId || module.id}
          anchorId={module.anchorId}
          title={module.title}
          subtitle={module.subtitle}
          description={module.description}
          badge={module.badge}
          tone={module.tone}
          meta={module.meta}
          defaultOpen={module.defaultOpen}
          actions={module.actions}
        >
          {typeof module.render === 'function' ? module.render(module) : module.content}
        </DashboardCollapsibleSection>
      ))}
    </div>
  );
}

DashboardWorkspaceModules.propTypes = {
  modules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      anchorId: PropTypes.string,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      description: PropTypes.node,
      badge: PropTypes.string,
      tone: PropTypes.oneOf(['default', 'indigo', 'slate', 'emerald', 'amber']),
      meta: PropTypes.node,
      defaultOpen: PropTypes.bool,
      actions: PropTypes.node,
      render: PropTypes.func,
      content: PropTypes.node,
    }),
  ),
};

DashboardWorkspaceModules.defaultProps = {
  modules: [],
};
