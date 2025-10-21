import PropTypes from 'prop-types';
import { ArrowRightIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

const ROLE_HINTS = {
  admin: {
    description: 'Only Gigvora administrators can access this control tower.',
    requiredScopes: ['admin:access'],
  },
  company: {
    description: 'This dashboard is limited to verified company workspace maintainers.',
    requiredScopes: ['company:dashboard', 'company:manage'],
  },
  agency: {
    description: 'Only approved agency operators can manage this workspace.',
    requiredScopes: ['agency:dashboard', 'agency:manage'],
  },
  user: {
    description: 'Switch to the member dashboard or request the required workspace role.',
    requiredScopes: ['user:dashboard'],
  },
  freelancer: {
    description: 'Freelancer workspaces are restricted to vetted talent accounts.',
    requiredScopes: ['freelancer:dashboard'],
  },
  headhunter: {
    description: 'Only headhunter workspaces with sourcing permissions can open this view.',
    requiredScopes: ['headhunter:dashboard'],
  },
};

function titleCase(value) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normaliseDashboardOption(entry) {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    const slug = entry.trim();
    if (!slug) {
      return null;
    }
    return {
      key: slug,
      value: slug,
      label: titleCase(slug),
      href: slug.startsWith('/') ? slug : null,
    };
  }

  if (typeof entry === 'object') {
    const value = (entry.value || entry.id || '').toString().trim();
    const href = entry.href?.trim() || null;
    if (!value && !href) {
      return null;
    }
    return {
      key: value || href,
      value: value || href,
      label: entry.label || titleCase(value || href || 'Dashboard'),
      href,
    };
  }

  return null;
}

export default function AccessDeniedPanel({
  title,
  description,
  message,
  role,
  requiredScopes,
  userScopes,
  availableDashboards,
  onNavigate,
  supportEmail,
  supportHref,
  className,
}) {
  const roleKey = role?.toLowerCase().trim();
  const roleHint = roleKey ? ROLE_HINTS[roleKey] : null;
  const heading = title || 'Access restricted';
  const details =
    description ||
    roleHint?.description ||
    'You do not have permission to view this area yet. Request the appropriate workspace role to continue.';

  const expectedScopes = (requiredScopes?.length ? requiredScopes : roleHint?.requiredScopes) ?? [];
  const grantedScopes = new Set((userScopes ?? []).filter(Boolean));
  const missingScopes = expectedScopes.filter((scope) => scope && !grantedScopes.has(scope));

  const options = Array.from(
    new Map(
      (availableDashboards ?? [])
        .map(normaliseDashboardOption)
        .filter(Boolean)
        .map((option) => [option.key, option]),
    ).values(),
  );

  const supportLink = supportHref || (supportEmail ? `mailto:${supportEmail}` : null);

  const handleNavigate = (option) => {
    if (!option) return;
    if (typeof onNavigate === 'function') {
      onNavigate(option.value ?? option.href);
      return;
    }
    if (option.href && typeof window !== 'undefined') {
      window.location.assign(option.href);
    }
  };

  return (
    <section
      className={`space-y-6 rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-slate-700 shadow-soft ${className ?? ''}`.trim()}
      aria-live="polite"
    >
      <header className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <ShieldExclamationIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-rose-700">{heading}</h2>
          <p className="mt-1 text-sm text-rose-600/90">{details}</p>
        </div>
      </header>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      {missingScopes.length ? (
        <div className="rounded-2xl border border-rose-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Required permissions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {missingScopes.map((scope) => (
              <li key={scope}>
                <code>{scope}</code>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Ask your workspace administrator to assign these scopes in Gigvora Admin or update your membership role.
          </p>
        </div>
      ) : null}

      {options.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Quick navigation</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleNavigate(option)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-700"
              >
                <span>Switch to {option.label}</span>
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {supportLink ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Need access?</p>
          <a
            href={supportLink}
            target={supportLink.startsWith('http') ? '_blank' : undefined}
            rel={supportLink.startsWith('http') ? 'noreferrer' : undefined}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
          >
            Contact support
          </a>
        </div>
      ) : null}
    </section>
  );
}

AccessDeniedPanel.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  message: PropTypes.string,
  role: PropTypes.string,
  requiredScopes: PropTypes.arrayOf(PropTypes.string),
  userScopes: PropTypes.arrayOf(PropTypes.string),
  availableDashboards: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        href: PropTypes.string,
        label: PropTypes.string,
      }),
    ]),
  ),
  onNavigate: PropTypes.func,
  supportEmail: PropTypes.string,
  supportHref: PropTypes.string,
  className: PropTypes.string,
};

AccessDeniedPanel.defaultProps = {
  title: undefined,
  description: undefined,
  message: undefined,
  role: undefined,
  requiredScopes: undefined,
  userScopes: undefined,
  availableDashboards: undefined,
  onNavigate: undefined,
  supportEmail: undefined,
  supportHref: undefined,
  className: undefined,
};
