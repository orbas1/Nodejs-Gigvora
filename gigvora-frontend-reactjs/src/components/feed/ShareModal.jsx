import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LinkIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import OverlayModal from '../common/OverlayModal.jsx';
import analytics from '../../services/analytics.js';
import UserAvatar from '../UserAvatar.jsx';
import { formatRelativeTime } from '../../utils/date.js';

function buildShareUrl(post) {
  if (!post?.id) {
    return null;
  }
  if (post.permalink) {
    return post.permalink;
  }
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || 'https://gigvora.com';
    return `${origin}/feed/${post.id}`;
  }
  return `https://gigvora.com/feed/${post.id}`;
}

function encodeQuery(params) {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export default function ShareModal({ open, onClose, post, viewer }) {
  const shareUrl = useMemo(() => buildShareUrl(post), [post]);
  const [message, setMessage] = useState('');
  const [copyState, setCopyState] = useState(null);

  useEffect(() => {
    if (!open) {
      setCopyState(null);
      return;
    }
    const defaultMessage = post
      ? `Celebrating ${post.authorName ?? 'our community'}: ${post.summary?.slice(0, 140) ?? ''}`.trim()
      : '';
    setMessage(defaultMessage);
  }, [open, post]);

  useEffect(() => {
    if (!copyState) {
      return undefined;
    }
    const timeout = setTimeout(() => setCopyState(null), 2400);
    return () => clearTimeout(timeout);
  }, [copyState]);

  if (!open) {
    return null;
  }

  const postTitle = post?.title || post?.summary || post?.content || 'Gigvora update';
  const previewImage = post?.mediaAttachments?.[0]?.url ?? null;
  const postTimestamp = post?.createdAt ? formatRelativeTime(post.createdAt) : 'moments ago';
  const authorName = post?.authorName ?? post?.User?.name ?? 'Gigvora member';
  const authorHeadline =
    post?.authorHeadline ??
    post?.User?.Profile?.headline ??
    post?.User?.Profile?.bio ??
    'Marketplace professional';

  const shareTargets = [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      description: 'Syndicate to your professional network with attribution.',
      icon: ShareIcon,
      onSelect: () => {
        if (!shareUrl) {
          return;
        }
        const url = `https://www.linkedin.com/shareArticle?${encodeQuery({ mini: 'true', url: shareUrl, title: postTitle, summary: message })}`;
        if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener');
        }
      },
    },
    {
      id: 'email',
      label: 'Email',
      description: 'Send a curated note to shortlisted collaborators.',
      icon: EnvelopeIcon,
      onSelect: () => {
        if (!shareUrl) {
          return;
        }
        const subject = `Sharing a Gigvora update: ${postTitle}`;
        const body = `${message}\n\nView the full update: ${shareUrl}`;
        const url = `mailto:?${encodeQuery({ subject, body })}`;
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
      },
    },
    {
      id: 'copy-link',
      label: copyState === 'link' ? 'Link copied' : 'Copy link',
      description: 'Copy a trackable link to post in Slack or Docs.',
      icon: LinkIcon,
      onSelect: async () => {
        if (!shareUrl) {
          return;
        }
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
          } else if (typeof window !== 'undefined') {
            window.prompt('Copy this link', shareUrl);
          }
          setCopyState('link');
        } catch (clipboardError) {
          console.warn('Failed to copy link', clipboardError);
        }
      },
    },
    {
      id: 'copy-message',
      label: copyState === 'message' ? 'Message copied' : 'Copy blurb',
      description: 'Grab the crafted message for quick social posts.',
      icon: ClipboardDocumentListIcon,
      onSelect: async () => {
        if (!message) {
          return;
        }
        try {
          const payload = `${message}\n${shareUrl ?? ''}`.trim();
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(payload);
          } else if (typeof window !== 'undefined') {
            window.prompt('Copy this message', payload);
          }
          setCopyState('message');
        } catch (clipboardError) {
          console.warn('Failed to copy message', clipboardError);
        }
      },
    },
    {
      id: 'copy-embed',
      label: copyState === 'embed' ? 'Embed copied' : 'Copy embed code',
      description: 'Embed this post into microsites or investor updates.',
      icon: ClipboardDocumentCheckIcon,
      onSelect: async () => {
        if (!shareUrl) {
          return;
        }
        const embed = `<iframe title="Gigvora share" src="${shareUrl}" loading="lazy" style="border-radius:24px;border:0;width:100%;height:420px;"></iframe>`;
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(embed);
          } else if (typeof window !== 'undefined') {
            window.prompt('Copy this embed code', embed);
          }
          setCopyState('embed');
        } catch (clipboardError) {
          console.warn('Failed to copy embed', clipboardError);
        }
      },
    },
  ];

  const handleTargetSelect = (target) => {
    analytics.track(
      'web_feed_share_target',
      {
        postId: post?.id,
        target: target.id,
      },
      { source: 'web_app' },
    );
    target.onSelect();
  };

  return (
    <OverlayModal open={open} onClose={onClose} title="Share externally" maxWidth="max-w-4xl">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_minmax(0,1fr)]">
        <section className="space-y-4">
          <header className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow">
                <GlobeAltIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">External distribution</p>
                <p className="text-xs text-slate-500">Trackable link & copy ready for LinkedIn, newsletters, and CRM outreach.</p>
              </div>
            </div>
          </header>

          <div className="space-y-3">
            <label htmlFor="share-message" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Curate your message
            </label>
            <textarea
              id="share-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-inner transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Celebrate the milestone, tag champions, and clarify the call-to-action before syndicating."
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share targets</p>
            <ul className="mt-3 space-y-2">
              {shareTargets.map((target) => {
                const TargetIcon = target.icon;
                return (
                  <li key={target.id}>
                    <button
                      type="button"
                      onClick={() => handleTargetSelect(target)}
                      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <TargetIcon className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col items-start">
                          <span>{target.label}</span>
                          <span className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-400">
                            {target.description}
                          </span>
                        </span>
                      </span>
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Select</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
            <div className="mt-3 space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar name={authorName} seed={authorName} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{authorName}</p>
                  <p className="text-xs text-slate-500">{authorHeadline}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">{postTitle}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{post?.summary ?? post?.content ?? ''}</p>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">{postTimestamp}</p>
              </div>
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={postTitle}
                  className="w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
          </div>

          {shareUrl ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
              Distribution link
              <span className="mt-1 block break-all text-slate-500">{shareUrl}</span>
            </div>
          ) : null}

          {viewer ? (
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share as</p>
              <div className="mt-3 flex items-center gap-3">
                <UserAvatar name={viewer.name ?? 'You'} seed={viewer.avatarSeed ?? viewer.name} size="xs" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{viewer.name ?? 'You'}</p>
                  <p className="text-xs text-slate-500">{viewer.title ?? viewer.headline ?? 'Gigvora member'}</p>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </OverlayModal>
  );
}
