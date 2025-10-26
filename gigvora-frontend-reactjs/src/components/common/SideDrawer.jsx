import PropTypes from 'prop-types';
import OverlayFrame from '../design-system/OverlayFrame.jsx';

const WIDTH_ALIAS = {
  'max-w-md': 'md',
  'max-w-lg': 'lg',
  'max-w-xl': 'lg',
  'max-w-2xl': 'xl',
};

export default function SideDrawer({ open, onClose, title, children, widthClass = 'max-w-xl', footer }) {
  const width = WIDTH_ALIAS[widthClass] ?? 'lg';

  return (
    <OverlayFrame
      open={open}
      onClose={onClose}
      title={title}
      width={width}
      variant="drawer"
      footer={footer}
      bodyClassName="px-5 py-6"
    >
      {children}
    </OverlayFrame>
  );
}

SideDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  widthClass: PropTypes.string,
  footer: PropTypes.node,
};

SideDrawer.defaultProps = {
  open: false,
  onClose: undefined,
  title: null,
  children: null,
  widthClass: 'max-w-xl',
  footer: null,
};
