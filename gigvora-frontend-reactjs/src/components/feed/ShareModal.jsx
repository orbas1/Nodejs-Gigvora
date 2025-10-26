import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LinkIcon,
  LockClosedIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import analytics from '../../services/analytics.js';
import { formatRelativeTime } from '../../utils/date.js';

const SHARE_AUDIENCES = [
  {
    id: 'internal',
    label: 'Internal network',
    description: 'Share within Gigvora groups, workspaces, and partners.',
    icon: UsersIcon,
    compliance: 'Follows workspace confidentiality rules.',
  },
  {
    id: 'external',
    label: 'External channels',
    description: 'Generate a link optimised for email, Slack, or LinkedIn.',
    icon: GlobeAltIcon,
    compliance: 'Checks attachments for public-ready assets.',
  },
];

const SHARE_CHANNELS = [
  {
    id: 'copy',
    label: 'Copy link',
    description: 'Copy a tracking-ready link to your clipboard.',
    icon: LinkIcon,
  },
  {
    id: 'email',
    label: 'Email teammates',
    description: 'Open your email client with a prefilled digest.',
    icon: EnvelopeIcon,
  },
  {
    id: 'secure',
    label: 'Secure workspace',
    description: 'Route into a private workspace with approvals.',
    icon: LockClosedIcon,
  },
];

function buildShareLink(post) {
  if (post?.permalink) {
    return post.permalink;
  }
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://gigvora.com';
  return `${base}/feed/${encodeURIComponent(post?.id ?? 'post')}`;
}

export default function ShareModal({ open, onClose, post, viewer, onComplete }) {
  const [audience, setAudience] = useState('internal');
  const [channel, setChannel] = useState('copy');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => buildShareLink(post), [post]);
  const sharePreview = useMemo(() => {
    if (!post) {
      return null;
    }
    return {
      title: post.title || post.summary || post.content?.slice(0, 120) || 'Gigvora feed update',
      author: post.author?.name || post.authorName || 'Gigvora member',
      publishedAt: post.publishedAt || post.createdAt,
      type: post.type || 'update',
    };
  }, [post]);

  useEffect(() => {
    if (!open) {
      setAudience('internal');
      setChannel('copy');
      setMessage('');
      setCopied(false);
    } else if (post) {
      const baseMessage = `Sharing: ${post.title || post.summary || post.content?.slice(0, 80) || 'New update'}\n\nWhy it matters: `;
      setMessage(baseMessage);
      analytics.track('web_feed_share_modal_open', { postId: post.id }, { source: 'web_app' });
    }
  }, [open, post]);

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        analytics.track('web_feed_share_copy_link', { postId: post?.id }, { source: 'web_app' });
        setTimeout(() => setCopied(false), 2400);
      }
    } catch (error) {
      console.warn('Failed to copy link', error);
      setCopied(false);
    }
  };

  const handleShare = async () => {
    const payload = {
      postId: post?.id,
      audience,
      channel,
      message: message.trim(),
      link,
    };
    analytics.track('web_feed_share_submit', payload, { source: 'web_app' });

    if (channel === 'copy') {
      await handleCopyLink();
    }
    if (channel === 'email') {
      const subject = encodeURIComponent(`Gigvora update: ${sharePreview?.title ?? 'New update'}`);
      const body = encodeURIComponent(`${message}\n\nView: ${link}`);
      if (typeof window !== 'undefined') {
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      }
    }
    if (channel === 'secure') {
      console.info('Route share to secure workspace', payload);
    }

    onComplete?.(payload);
    onClose?.();
  };

  const selectedAudience = SHARE_AUDIENCES.find((option) => option.id === audience) ?? SHARE_AUDIENCES[0];
  const selectedChannel = SHARE_CHANNELS.find((option) => option.id === channel) ?? SHARE_CHANNELS[0];

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white p-6 text-left shadow-2xl">
                <Dialog.Title className="text-xl font-semibold text-slate-900">Share this update</Dialog.Title>
                <p className="mt-2 text-sm text-slate-600">
                  Create a professional share package with compliance-friendly messaging and analytics tracking.
                </p>

                <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Choose audience</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {SHARE_AUDIENCES.map((option) => {
                          const Icon = option.icon;
                          const selected = option.id === audience;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setAudience(option.id)}
                              className={`rounded-3xl border px-4 py-4 text-left transition ${
                                selected
                                  ? 'border-accent bg-accentSoft text-accent shadow-lg'
                                  : 'border-slate-200 bg-white/90 text-slate-600 hover:border-accent/50 hover:text-accent'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${
                                    selected ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  <Icon className="h-5 w-5" />
                                </span>
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold">{option.label}</p>
                                  <p className="text-xs text-slate-500">{option.description}</p>
                                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                                    {option.compliance}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {SHARE_CHANNELS.map((option) => {
                          const Icon = option.icon;
                          const selected = option.id === channel;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setChannel(option.id)}
                              className={`rounded-2xl border px-4 py-3 text-left transition ${
                                selected
                                  ? 'border-accent bg-accentSoft text-accent shadow-md'
                                  : 'border-slate-200 bg-white/90 text-slate-600 hover:border-accent/40 hover:text-accent'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                                    selected ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  <Icon className="h-5 w-5" />
                                </span>
                                <div>
                                  <p className="text-sm font-semibold">{option.label}</p>
                                  <p className="text-xs text-slate-500">{option.description}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</h3>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        rows={5}
                        className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                        placeholder="Add context so recipients know how to act on this update…"
                      />
                      <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                        {message.length} characters · Include next steps or key intros
                      </p>
                    </section>
                  </div>

                  <aside className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</h3>
                    {sharePreview ? (
                      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                        <p className="text-sm font-semibold text-slate-900">{sharePreview.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{sharePreview.author}</p>
                        {sharePreview.publishedAt ? (
                          <p className="mt-2 text-xs text-slate-400">
                            Published {formatRelativeTime(sharePreview.publishedAt)}
                          </p>
                        ) : null}
                        <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                          {selectedAudience.label} · {selectedChannel.label}
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                            copied ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent'
                          }`}
                        >
                          {copied ? (
                            <>
                              <CheckCircleIcon className="h-4 w-4" /> Copied
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-4 w-4" /> Copy share link
                            </>
                          )}
                        </button>
                        <p className="mt-2 break-all text-[0.65rem] text-slate-400">{link}</p>
                      </div>
                    ) : (
                      <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-xs text-slate-500">
                        Select a post to generate a preview.
                      </p>
                    )}

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-[0.65rem] text-indigo-700">
                      <p className="font-semibold uppercase tracking-wide">Governance</p>
                      <p className="mt-1">
                        {selectedAudience.id === 'external'
                          ? 'External shares attach compliance notices and watermark previews before they leave Gigvora.'
                          : 'Internal shares respect workspace permissions and thread-level privacy controls.'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.65rem] text-amber-700">
                      <p className="font-semibold uppercase tracking-wide">Reminder</p>
                      <p className="mt-1 flex items-start gap-2">
                        <ExclamationTriangleIcon className="mt-[1px] h-4 w-4" />
                        Vet attachments for client approvals before distributing externally.
                      </p>
                    </div>

                    {viewer ? (
                      <p className="text-[0.65rem] text-slate-400">
                        Sharing as <span className="font-semibold text-slate-600">{viewer.name}</span> — analytics credit will map to your workspace.
                      </p>
                    ) : null}
                  </aside>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accentDark"
                  >
                    Share now
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

ShareModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  post: PropTypes.object,
  viewer: PropTypes.shape({
    name: PropTypes.string,
  }),
  onComplete: PropTypes.func,
};

ShareModal.defaultProps = {
  open: false,
  onClose: undefined,
  post: null,
  viewer: null,
  onComplete: undefined,
};
