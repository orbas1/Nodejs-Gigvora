import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';
import { useComponentTokens } from '../../context/ComponentTokenContext.jsx';

const InsightStatBlock = forwardRef(function InsightStatBlock(
  { as: Component = 'div', tone = 'accent', label, value, helper, className = '', ...rest },
  ref,
) {
  const { tokens } = useComponentTokens('statBlock');
  const baseClass = tokens?.base ?? '';
  const layout = tokens?.layout ?? '';
  const toneTokens = tokens?.tones?.[tone] ?? tokens?.tones?.accent ?? {};
  const dataset = {};

  if (tokens?.analytics?.datasetTone) {
    dataset[tokens.analytics.datasetTone] = tone;
  }

  return (
    <Component
      ref={ref}
      className={classNames(baseClass, layout, toneTokens.shell, className)}
      {...dataset}
      {...rest}
    >
      {label ? <dt className={classNames(tokens?.label, toneTokens.label)}>{label}</dt> : null}
      {value ? <dd className={classNames(tokens?.value, toneTokens.value)}>{value}</dd> : null}
      {helper ? <p className={classNames(tokens?.helper, toneTokens.helper)}>{helper}</p> : null}
    </Component>
  );
});

InsightStatBlock.propTypes = {
  as: PropTypes.elementType,
  tone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.node,
  value: PropTypes.node,
  helper: PropTypes.node,
  className: PropTypes.string,
};

InsightStatBlock.defaultProps = {
  as: 'div',
  tone: 'accent',
  label: null,
  value: null,
  helper: null,
  className: '',
};

export default InsightStatBlock;
