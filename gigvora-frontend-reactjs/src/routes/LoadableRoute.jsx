import PropTypes from 'prop-types';
import { createLoadableElement } from './routeConfig.jsx';
import RouteLoading from '../components/routing/RouteLoading.jsx';

function LoadableRoute({ modulePath }) {
  return createLoadableElement(modulePath);
}

LoadableRoute.propTypes = {
  modulePath: PropTypes.string.isRequired,
};

function LoadableRouteFallback() {
  return <RouteLoading />;
}

LoadableRoute.Fallback = LoadableRouteFallback;

export default LoadableRoute;
