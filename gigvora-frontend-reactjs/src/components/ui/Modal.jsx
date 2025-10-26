import PropTypes from 'prop-types';
import OverlayFrame from '../design-system/OverlayFrame.jsx';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
  footer,
  labelledBy,
  describedBy,
}) {
  return (
    <OverlayFrame
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      width={wide ? 'xl' : 'md'}
      variant="modal"
      footer={footer}
      labelledBy={labelledBy}
      describedBy={describedBy}
    >
      {children}
    </OverlayFrame>
  );
}

Modal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  description: PropTypes.node,
  children: PropTypes.node,
  wide: PropTypes.bool,
  footer: PropTypes.node,
  labelledBy: PropTypes.string,
  describedBy: PropTypes.string,
};

Modal.defaultProps = {
  open: false,
  onClose: undefined,
  title: null,
  description: null,
  children: null,
  wide: false,
  footer: null,
  labelledBy: undefined,
  describedBy: undefined,
};
