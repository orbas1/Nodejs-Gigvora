import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';
import { useComponentTokens } from '../../context/ComponentTokenContext.jsx';

const BrandBadge = forwardRef(function BrandBadge(
  { as: Component = 'span', tone = 'accent', icon = null, children, className = '', ...rest },
  ref,
) {
  const { tokens } = useComponentTokens('brandBadge');
  const baseClass = tokens?.base ?? '';
  const toneTokens = tokens?.tones?.[tone] ?? tokens?.tones?.accent ?? {};
  const iconClass = tokens?.icon ?? '';
  const textClass = tokens?.text ?? '';
  const dataset = {};

  if (tokens?.analytics?.datasetTone) {
    dataset[tokens.analytics.datasetTone] = tone;
  }

  return (
    <Component
      ref={ref}
      className={classNames(baseClass, toneTokens.shell, className)}
      {...dataset}
      {...rest}
    >
      {icon ? (
        <span className={classNames(iconClass, toneTokens.icon)} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={textClass}>{children}</span>
    </Component>
  );
});

BrandBadge.propTypes = {
  as: PropTypes.elementType,
  tone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

BrandBadge.defaultProps = {
  as: 'span',
  tone: 'accent',
  icon: null,
  className: '',
};

export default BrandBadge;
