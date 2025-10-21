import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AgencyDashboardLayout from './AgencyDashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import SupportDeskPanel from '../../../components/support/SupportDeskPanel.jsx';
import { createKnowledgeBaseArticle } from '../../../services/supportDesk.js';

const PLAYBOOK_LINKS = [
  {
    id: 'triage',
    title: 'Triage accelerator',
    description: 'Route conversations instantly with AI-intent, SLA stage, and client sentiment.',
    href: '/pages?category=support-automation',
  },
  {
    id: 'macro',
    title: 'Macro library',
    description: 'Ready-to-use responses for disputes, compliance, onboarding, and finance escalations.',
    href: '/pages?category=support-macros',
  },
  {
    id: 'analytics',
    title: 'Analytics workbook',
    description: 'Pull CSAT, backlog velocity, and on-call coverage reports into Looker or Sheets.',
    href: '/pages?category=support-analytics',
  },
];

const CONTACT_OPTIONS = [
  { label: 'Open agency inbox', href: '/dashboard/agency/inbox' },
  { label: 'Escalate to trust & safety', href: 'mailto:trust@gigvora.com?subject=Agency%20support%20escalation' },
  { label: 'Ping finance ops', href: 'mailto:finance-ops@gigvora.com?subject=Vendor%20payment%20support' },
];

export default function AgencySupportDeskPage() {
  const { session } = useSession();
  const userId = session?.id ?? null;
  const [articleDraft, setArticleDraft] = useState({
    title: '',
    category: 'policies',
    audience: 'freelancer',
    summary: '',
    resourceUrl: '',
  });
  const [submittingArticle, setSubmittingArticle] = useState(false);
  const [articleFeedback, setArticleFeedback] = useState(null);

  const handleDraftChange = useCallback((field, value) => {
    setArticleDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleArticleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmittingArticle(true);
      setArticleFeedback(null);
      try {
        await createKnowledgeBaseArticle({
          title: articleDraft.title,
          summary: articleDraft.summary,
          category: articleDraft.category,
          audience: articleDraft.audience,
          resourceLinks: articleDraft.resourceUrl ? [{ url: articleDraft.resourceUrl, label: 'Reference' }] : undefined,
        });
        setArticleDraft((prev) => ({ ...prev, title: '', summary: '', resourceUrl: '' }));
        setArticleFeedback({ type: 'success', message: 'Article proposal submitted for review.' });
      } catch (error) {
        setArticleFeedback({
          type: 'error',
          message: error?.message ?? 'Unable to submit article. Please try again.',
        });
      } finally {
        setSubmittingArticle(false);
      }
    },
    [articleDraft],
  );

  const articleCategories = useMemo(
    () => [
      { value: 'policies', label: 'Policies' },
      { value: 'payments', label: 'Payments' },
      { value: 'compliance', label: 'Compliance' },
      { value: 'growth', label: 'Growth' },
    ],
    [],
  );

  const articleAudiences = useMemo(
    () => [
      { value: 'freelancer', label: 'Freelancers' },
      { value: 'client', label: 'Clients' },
      { value: 'agency', label: 'Agencies' },
    ],
    [],
  );

  return (
    <AgencyDashboardLayout
      title="Support desk"
      subtitle="Keep agencies, clients, and talent unblocked with a proactive service hub."
      description="Monitor queues, drill into transcripts, and trigger the right playbooks without leaving the workspace."
      activeMenuItem="support"
      workspace={session?.workspace ?? null}
    >
      <div className="space-y-10">
        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <SupportDeskPanel userId={userId} />
          </div>
          <aside className="flex flex-col gap-6">
            <div className="rounded-4xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">On-call essentials</p>
              <h2 className="mt-3 text-2xl font-semibold">Live escalation matrix</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {CONTACT_OPTIONS.map((option) => (
                  <li key={option.label}>
                    <Link
                      to={option.href}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"
                    >
                      {option.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Playbooks</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Level-up the desk</h2>
              <ul className="mt-4 space-y-4">
                {PLAYBOOK_LINKS.map((item) => (
                  <li key={item.id} className="rounded-3xl border border-slate-200 px-4 py-3 transition hover:border-blue-200 hover:shadow-sm">
                    <Link to={item.href} className="flex flex-col gap-1 text-left">
                      <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className="text-xs text-slate-500">{item.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <section className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Quality guardrails</p>
              <h2 className="text-2xl font-semibold text-slate-900">Run support like a product</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Align SLAs, automate health scoring, and pulse-check agent wellbeing. The widgets below are ready for custom dashboards.
              </p>
            </div>
            <Link
              to="/pages?category=support-intelligence"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              Intelligence library
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Median first response', value: '6m 12s' },
              { label: 'CSAT (30d)', value: '4.8 / 5' },
              { label: 'Proactive saves', value: '37 this week' },
              { label: 'Automation coverage', value: '63%' },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Knowledge base</p>
              <h2 className="text-2xl font-semibold text-slate-900">Publish escalation guidance</h2>
              <p className="text-sm text-slate-600">
                Draft articles for the Gigvora trust library. Compliance will review and push live to the SupportDesk panel once approved.
              </p>
            </div>
            {articleFeedback ? (
              <div
                className={`rounded-2xl border px-4 py-2 text-sm ${
                  articleFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-600'
                }`}
              >
                {articleFeedback.message}
              </div>
            ) : null}
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleArticleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Title</span>
              <input
                type="text"
                required
                value={articleDraft.title}
                onChange={(event) => handleDraftChange('title', event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. Evidence checklist for milestone disputes"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Audience</span>
              <select
                value={articleDraft.audience}
                onChange={(event) => handleDraftChange('audience', event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {articleAudiences.map((audience) => (
                  <option key={audience.value} value={audience.value}>
                    {audience.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Category</span>
              <select
                value={articleDraft.category}
                onChange={(event) => handleDraftChange('category', event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {articleCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Summary</span>
              <textarea
                required
                value={articleDraft.summary}
                onChange={(event) => handleDraftChange('summary', event.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Outline the resolution steps, evidence requirements, and success metrics."
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Reference link (optional)</span>
              <input
                type="url"
                value={articleDraft.resourceUrl}
                onChange={(event) => handleDraftChange('resourceUrl', event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="https://"
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submittingArticle}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingArticle ? 'Submitting…' : 'Submit for review'}
              </button>
              <p className="text-xs text-slate-500">
                Approved entries appear in the knowledge base widget automatically.
              </p>
            </div>
          </form>
        </section>
      </div>
    </AgencyDashboardLayout>
  );
}

