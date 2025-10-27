import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';
import { useComponentTokens } from '../../context/ComponentTokenContext.jsx';

const PersonaChip = forwardRef(function PersonaChip(
  {
    as: Component = 'span',
    label,
    labelClassName = '',
    tone = 'accent',
    size = 'md',
    icon = null,
    indicator = true,
    interactive = false,
    selected = false,
    className = '',
    children = null,
    ...rest
  },
  ref,
) {
  const { tokens } = useComponentTokens('personaChip');
  const baseClass = tokens?.base ?? '';
  const toneTokens = tokens?.tones?.[tone] ?? tokens?.tones?.accent ?? {};
  const sizeToken = tokens?.sizes?.[size] ?? tokens?.sizes?.md ?? '';
  const indicatorClass = tokens?.indicator ?? '';
  const iconClass = tokens?.icon ?? '';
  const labelClass = tokens?.label ?? '';
  const states = tokens?.states ?? {};
  const dataset = {};

  if (tokens?.analytics?.datasetTone) {
    dataset[tokens.analytics.datasetTone] = tone;
  }
  if (tokens?.analytics?.datasetSize) {
    dataset[tokens.analytics.datasetSize] = size;
  }

  const content = children ?? label;

  return (
    <Component
      ref={ref}
      className={classNames(
        baseClass,
        toneTokens.shell,
        sizeToken,
        interactive ? states.interactive : '',
        selected ? states.selected : '',
        className,
      )}
      {...dataset}
      {...rest}
    >
      {indicator ? (
        <span className={classNames(indicatorClass, toneTokens.indicator)} aria-hidden="true" />
      ) : null}
      {icon ? (
        <span className={classNames(iconClass)} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {content != null ? (
        <span className={classNames(labelClass, labelClassName)}>{content}</span>
      ) : null}
    </Component>
  );
});

PersonaChip.propTypes = {
  as: PropTypes.elementType,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  labelClassName: PropTypes.string,
  tone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node,
  indicator: PropTypes.bool,
  interactive: PropTypes.bool,
  selected: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

PersonaChip.defaultProps = {
  as: 'span',
  label: null,
  labelClassName: '',
  tone: 'accent',
  size: 'md',
  icon: null,
  indicator: true,
  interactive: false,
  selected: false,
  className: '',
  children: null,
};

export default PersonaChip;
