import PropTypes from 'prop-types';
import OverlayFrame from '../design-system/OverlayFrame.jsx';

const WIDTH_ALIAS = {
  'max-w-2xl': 'md',
  'max-w-3xl': 'lg',
  'max-w-4xl': 'lg',
  'max-w-5xl': 'xl',
};

export default function OverlayModal({ open, onClose, title, children, maxWidth = 'max-w-3xl', footer }) {
  const width = WIDTH_ALIAS[maxWidth] ?? 'lg';

  return (
    <OverlayFrame open={open} onClose={onClose} title={title} width={width} variant="panel" footer={footer}>
      <div className="space-y-4 text-[var(--gv-color-text-muted)]">{children}</div>
    </OverlayFrame>
  );
}

OverlayModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  maxWidth: PropTypes.string,
  footer: PropTypes.node,
};

OverlayModal.defaultProps = {
  open: false,
  onClose: undefined,
  title: null,
  children: null,
  maxWidth: 'max-w-3xl',
  footer: null,
};
