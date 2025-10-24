import PropTypes from 'prop-types';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoadableRoute from './LoadableRoute.jsx';

export default function AdminRoutes({ routes }) {
  return (
    <Routes>
      {routes.map((route) => {
        if (route.index || route.relativePath === '' || route.relativePath == null) {
          return <Route key="index" index element={<LoadableRoute modulePath={route.module} />} />;
        }

        if (!route.relativePath) {
          throw new Error(`Admin route "${route.path}" is missing a relativePath.`);
        }

        return (
          <Route
            key={route.relativePath}
            path={route.relativePath}
            element={<LoadableRoute modulePath={route.module} />}
          />
        );
      })}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

AdminRoutes.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      index: PropTypes.bool,
      path: PropTypes.string,
      relativePath: PropTypes.string,
      module: PropTypes.string.isRequired,
    }),
  ).isRequired,
};
