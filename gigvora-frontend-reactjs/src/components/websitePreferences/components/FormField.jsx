import { Children, cloneElement, isValidElement, useId } from 'react';
import PropTypes from 'prop-types';

export default function FormField({ label, description, children, inline = false, action }) {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const descriptionId = description ? `${baseId}-description` : undefined;

  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const interactiveTags = ['input', 'textarea', 'select'];
    if (typeof child.type === 'string' && interactiveTags.includes(child.type)) {
      const labelledBy = [child.props['aria-labelledby'], labelId].filter(Boolean).join(' ') || undefined;
      const describedBy = [child.props['aria-describedby'], descriptionId].filter(Boolean).join(' ') || undefined;

      return cloneElement(child, {
        'aria-labelledby': labelledBy,
        'aria-describedby': describedBy,
      });
    }

    return child;
  });

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p id={labelId} className="text-sm font-medium text-slate-700">
            {label}
          </p>
          {description ? (
            <p id={descriptionId} className="text-xs text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="text-xs text-slate-500">{action}</div> : null}
      </div>
      <div className={inline ? 'flex items-center gap-3' : ''} role="group" aria-describedby={descriptionId}>
        {enhancedChildren}
      </div>
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  inline: PropTypes.bool,
  action: PropTypes.node,
};

FormField.defaultProps = {
  description: null,
  inline: false,
  action: null,
};
