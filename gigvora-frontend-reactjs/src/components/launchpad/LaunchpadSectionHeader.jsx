import PropTypes from 'prop-types';

export default function LaunchpadSectionHeader({ title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
    </div>
  );
}

LaunchpadSectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.elementType,
};

LaunchpadSectionHeader.defaultProps = {
  description: undefined,
  icon: undefined,
};
