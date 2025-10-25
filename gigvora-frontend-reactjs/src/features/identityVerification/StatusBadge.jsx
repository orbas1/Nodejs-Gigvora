import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function IdentityStatusBadge({ status = 'pending', ...props }) {
  return <StatusBadge category="identityVerification" status={status} {...props} />;
}
