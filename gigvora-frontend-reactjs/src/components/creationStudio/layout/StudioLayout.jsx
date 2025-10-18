import PropTypes from 'prop-types';

export default function StudioLayout({ gallery, shelf, footer }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
        <div className="space-y-6">{gallery}</div>
        <aside className="space-y-6">{shelf}</aside>
      </div>
      {footer ? <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">{footer}</div> : null}
    </div>
  );
}

StudioLayout.propTypes = {
  gallery: PropTypes.node.isRequired,
  shelf: PropTypes.node.isRequired,
  footer: PropTypes.node,
};
