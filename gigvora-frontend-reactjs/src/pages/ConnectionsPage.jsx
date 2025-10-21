import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useSession from '../hooks/useSession.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';
import useConnectionNetwork from '../hooks/useConnectionNetwork.js';
import { createConnectionRequest } from '../services/connections.js';

export function ConnectionCard({ node, onConnect, isSubmitting }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
          <UserAvatar name={node.name} seed={node.avatarSeed ?? node.name} size="xs" showGlow={false} />
          {node.degreeLabel}
        </span>
        {node.actions?.canMessage ? (
          <button className="rounded-full border border-slate-200 px-4 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-accent hover:text-accent">
            Message
          </button>
        ) : (
          <span className="rounded-full border border-transparent px-3 py-1 text-[11px] font-semibold text-accent/70">
            {node.userType}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{node.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{node.headline ?? 'Gigvora member'}</p>
      <p className="mt-1 text-xs text-slate-500">{node.location ?? 'Global network'}</p>

      {node.mutualConnections ? (
        <p className="mt-3 text-xs font-medium text-slate-500">
          {node.mutualConnections === 1
            ? `Connected via ${node.connectors?.[0]?.name ?? 'a trusted partner'}`
            : `Connected via ${node.mutualConnections} trusted partners`}
        </p>
      ) : null}

      {node.connectors?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {node.connectors.map((connector) => (
            <span
              key={connector.id}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600"
            >
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              {connector.name}
            </span>
          ))}
        </div>
      ) : null}

      {node.path?.length > 2 ? (
        <p className="mt-4 text-[11px] uppercase tracking-wide text-slate-400">
          Path: {node.path.map((segment) => segment.name).join(' • ')}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onConnect?.(node)}
          disabled={!node.actions?.canRequestConnection || isSubmitting}
          className="inline-flex items-center gap-2 rounded-full border border-accent px-5 py-2 text-xs font-semibold text-accent transition hover:bg-accentSoft disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          {node.actions?.requiresIntroduction ? 'Request introduction' : 'Connect'}
          {isSubmitting ? '…' : ''}
        </button>
        {!node.actions?.canRequestConnection && node.actions?.reason ? (
          <span className="text-[11px] text-rose-500">{node.actions.reason}</span>
        ) : null}
      </div>
    </article>
  );
}

export function ConnectionSection({ title, description, nodes, emptyCta, onConnect, submittingId }) {
  if (!nodes?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-700">{title}</p>
        <p className="mt-2 text-slate-500">{emptyCta}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {nodes.map((node) => (
          <ConnectionCard
            key={node.id}
            node={node}
            onConnect={onConnect}
            isSubmitting={submittingId === node.id}
          />
        ))}
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const { session } = useSession();
  const [feedback, setFeedback] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const userId = session?.id ?? session?.userId ?? null;
  const engagementSignals = useEngagementSignals({ session, limit: 8 });
  const networkState = useConnectionNetwork({ userId, viewerId: userId, enabled: Boolean(userId) });
  const { data: network, loading, error } = networkState;

  const directConnections = network?.firstDegree ?? [];
  const secondDegree = network?.secondDegree ?? [];
  const thirdDegree = network?.thirdDegree ?? [];
  const summary = network?.summary ?? { firstDegree: 0, secondDegree: 0, thirdDegree: 0, total: 0 };
  const policy = network?.policy;

  const knownNames = useMemo(
    () => new Set(directConnections.map((connection) => connection.name.toLowerCase())),
    [directConnections],
  );

  const recommendedConnections = useMemo(
    () =>
      engagementSignals.connectionSuggestions.filter((suggestion) => {
        const key = suggestion.name?.toLowerCase() ?? '';
        return key && !knownNames.has(key);
      }),
    [engagementSignals.connectionSuggestions, knownNames],
  );

  const groupSuggestions = engagementSignals.groupSuggestions;

  const handleConnect = async (node) => {
    if (!node || !userId) {
      return;
    }
    try {
      setSubmittingId(node.id);
      setFeedback(null);
      await createConnectionRequest({ actorId: userId, targetId: node.id });
      setFeedback({ type: 'success', message: `Connection request queued for ${node.name}.` });
      await networkState.refresh?.({ force: true });
    } catch (requestError) {
      const message =
        requestError?.body?.message ?? requestError?.message ?? 'Unable to create the connection request right now.';
      setFeedback({ type: 'error', message });
    } finally {
      setSubmittingId(null);
    }
  };

  if (!userId) {
    return (
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6">
          <PageHeader
            eyebrow="Network"
            title="Followers &amp; connects"
            description="Sign in to unlock 1st, 2nd, and 3rd-degree visibility and manage introductions across the Gigvora network."
          />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <p className="text-sm font-semibold text-slate-900">Access restricted</p>
            <p className="mt-3 text-sm text-slate-600">
              Create or load a session to view your trusted connections and connection policies.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accentDark"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Network"
          title="Followers &amp; connects"
          description="Nurture your relationships across the Gigvora network and unlock collaborations faster."
        />
        <div className="mt-10 space-y-10">
          {feedback ? (
            <div
              className={`rounded-3xl border px-6 py-4 text-sm font-medium ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
              We couldn’t load your network right now. Please refresh shortly.
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Network summary</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Live visibility of 1st, 2nd, and 3rd-degree relationships.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => networkState.refresh?.({ force: true })}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Refresh
                </button>
              </div>
              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">1st degree</dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.firstDegree}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">2nd degree</dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.secondDegree}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">3rd degree</dt>
                  <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.thirdDegree}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold text-slate-900">Connection policy</p>
              <p className="mt-1 text-xs text-slate-500">Roles you are cleared to engage with directly.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(policy?.allowedRoles ?? []).map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    {role}
                  </span>
                ))}
              </div>
              {policy?.notes ? <p className="mt-4 text-xs text-slate-500">{policy.notes}</p> : null}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[...Array(4).keys()].map((index) => (
                <div key={index} className="h-48 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              <ConnectionSection
                title="Direct relationships"
                description="Active collaborators and followers who can receive instant updates and messages."
                nodes={directConnections}
                emptyCta="No accepted connections yet. Accept pending invitations or explore recommendations."
                onConnect={handleConnect}
                submittingId={submittingId}
              />
              <ConnectionSection
                title="2nd-degree introductions"
                description="Warm leads surfaced by your trusted partners. Request an introduction when ready."
                nodes={secondDegree}
                emptyCta="Grow your direct network to reveal curated second-degree opportunities."
                onConnect={handleConnect}
                submittingId={submittingId}
              />
              <ConnectionSection
                title="3rd-degree reach"
                description="Strategic relationships surfaced via two intermediaries. Pair with context when requesting support."
                nodes={thirdDegree}
                emptyCta="We’ll populate this tier once your 1st and 2nd-degree networks expand."
                onConnect={handleConnect}
                submittingId={submittingId}
              />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)]">
            {recommendedConnections.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">People you should connect with</p>
                <p className="mt-1 text-xs text-slate-500">
                  Matches are based on shared interests and mutual collaborators.
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {recommendedConnections.slice(0, 4).map((person) => (
                    <li key={person.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={person.name} seed={person.name} size="xs" showGlow={false} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{person.name}</p>
                          <p className="text-xs text-slate-500">{person.headline}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{person.reason}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>{person.location}</span>
                        <span>{person.mutualConnections} mutual</span>
                      </div>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accentSoft"
                      >
                        Preview profile
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {groupSuggestions.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">Groups to join</p>
                <p className="mt-1 text-xs text-slate-500">
                  Grow relationships faster by joining aligned discussion circles.
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {groupSuggestions.slice(0, 3).map((group) => (
                    <li key={group.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{group.description}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {group.members} members · {group.focus.slice(0, 2).join(' • ')}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-right text-xs text-accent">
                  <Link to="/groups" className="font-semibold hover:text-accentDark">
                    View all groups
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
