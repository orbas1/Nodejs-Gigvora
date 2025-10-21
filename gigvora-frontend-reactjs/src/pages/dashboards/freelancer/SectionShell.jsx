import PropTypes from 'prop-types';

export default function SectionShell({ id, title, description, children, actions }) {
  return (
    <section id={id} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

SectionShell.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
};

SectionShell.defaultProps = {
  id: undefined,
  description: undefined,
  actions: null,
};
