import { Component } from 'react';
import analytics from '../../services/analytics.js';
import { ANALYTICS_EVENTS } from '../../constants/analyticsEvents.js';

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    analytics.track(ANALYTICS_EVENTS.ROUTE_RENDER_FAILURE.name, {
      message: error?.message ?? 'Unknown route render failure',
      componentStack: info?.componentStack ?? '',
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError } = this.state;
    if (hasError) {
      return (
        <section className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-rose-50/70 p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-rose-700">Something went wrong</h1>
          <p className="mt-3 text-sm text-rose-600">
            The page could not be rendered right now. Try again or head back to the dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:text-rose-800"
            >
              Return home
            </a>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
