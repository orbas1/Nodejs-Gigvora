import PropTypes from 'prop-types';

import MegaMenu from './MegaMenu.jsx';

export default function HeaderMegaMenu({ menu }) {
  if (!menu) {
    return null;
  }

  return <MegaMenu item={menu} />;
}

HeaderMegaMenu.propTypes = {
  menu: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            to: PropTypes.string.isRequired,
            icon: PropTypes.elementType.isRequired,
          }),
        ).isRequired,
      }),
    ).isRequired,
  }),
};

HeaderMegaMenu.defaultProps = {
  menu: null,
};
