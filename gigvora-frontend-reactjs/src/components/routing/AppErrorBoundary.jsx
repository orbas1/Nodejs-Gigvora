import { Component } from 'react';
import PropTypes from 'prop-types';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof window !== 'undefined') {
      console.error('Main layout error boundary caught an error', error, errorInfo);
    }
    this.props.onError?.(error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  }

  render() {
    const { hasError, error } = this.state;
    const { fallback: FallbackComponent, children } = this.props;

    if (hasError) {
      if (typeof FallbackComponent === 'function') {
        return <FallbackComponent error={error} onRetry={this.handleReset} />;
      }
      return FallbackComponent ?? null;
    }

    return children;
  }
}

AppErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  onError: PropTypes.func,
  onReset: PropTypes.func,
};

AppErrorBoundary.defaultProps = {
  onError: undefined,
  onReset: undefined,
};
