import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import AccessGate from './AccessGate.jsx';
import useSession from '../../hooks/useSession.js';
import { DASHBOARD_LINKS } from '../../constants/dashboardLinks.js';

function resolveMembershipLabel(key) {
  return DASHBOARD_LINKS[key]?.label ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export default function RequireMembership({
  allowed,
  children,
  title = 'Access restricted',
  description = 'Only approved operators can open this area. Request access or head back to your dashboard.',
}) {
  const { isAuthenticated, session } = useSession();
  const location = useLocation();
  const allowedKeys = Array.isArray(allowed) ? allowed.filter(Boolean) : [];

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const memberships = Array.isArray(session?.memberships) ? session.memberships : [];
  const hasAccess =
    !allowedKeys.length || allowedKeys.some((membershipKey) => memberships.includes(membershipKey));

  if (!hasAccess) {
    const fallbackKey = session?.primaryDashboard ?? memberships[0] ?? 'user';
    const fallbackLink = DASHBOARD_LINKS[fallbackKey]?.path ?? '/';
    const requirements = allowedKeys.map((membershipKey) => `${resolveMembershipLabel(membershipKey)} membership required`);

    return (
      <AccessGate
        title={title}
        description={description}
        requirements={requirements}
        primaryAction={{ to: fallbackLink, label: 'Go to your dashboard' }}
        secondaryAction={{ href: 'mailto:partnerships@gigvora.com', label: 'Contact partnerships' }}
      />
    );
  }

  return children;
}

RequireMembership.propTypes = {
  allowed: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
};

RequireMembership.defaultProps = {
  allowed: [],
  title: 'Access restricted',
  description: 'Only approved operators can open this area. Request access or head back to your dashboard.',
};
