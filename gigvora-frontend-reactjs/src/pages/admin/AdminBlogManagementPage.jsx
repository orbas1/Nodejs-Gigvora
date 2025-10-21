import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import {
  fetchAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
  deleteAdminBlogPost,
  fetchBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  fetchBlogTags,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
  fetchAdminBlogMetrics,
  updateAdminBlogPostMetrics,
  fetchAdminBlogComments,
  createAdminBlogComment,
  updateAdminBlogComment,
  deleteAdminBlogComment,
} from '../../services/blog.js';
import { ADMIN_BLOG_MENU_SECTIONS } from '../../constants/adminBlogMenu.js';
import BlogPostEditor from '../../components/admin/blog/BlogPostEditor.jsx';
import BlogPostLibrary from '../../components/admin/blog/BlogPostLibrary.jsx';
import BlogCategoryManager from '../../components/admin/blog/BlogCategoryManager.jsx';
import BlogTagManager from '../../components/admin/blog/BlogTagManager.jsx';
import BlogMetricsPanel from '../../components/admin/blog/BlogMetricsPanel.jsx';
import BlogCommentsPanel from '../../components/admin/blog/BlogCommentsPanel.jsx';
import useSession from '../../hooks/useSession.js';

const DEFAULT_FORM = Object.freeze({
  id: null,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
  categoryId: '',
  readingTimeMinutes: 6,
  featured: false,
  coverImageUrl: '',
  mediaUrls: '',
  tagsText: '',
});

const AVAILABLE_DASHBOARDS = ['admin', 'company', 'user', 'freelancer'];

function formatCount(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return numeric.toLocaleString();
}

function FullscreenPanel({ open, onClose, children }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-6"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-6"
            >
              <Dialog.Panel className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function AdminBlogManagementPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const [activeSection, setActiveSection] = useState('overview');
  const [fullscreenPanel, setFullscreenPanel] = useState(null);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [savingPost, setSavingPost] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [metricsOverview, setMetricsOverview] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [commentFilters, setCommentFilters] = useState({ status: 'pending', postId: '', page: 1 });
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentPagination, setCommentPagination] = useState(null);

  const membershipSet = useMemo(() => {
    if (!Array.isArray(session?.memberships)) {
      return new Set();
    }
    return new Set(session.memberships.map((value) => `${value}`.trim().toLowerCase()).filter(Boolean));
  }, [session?.memberships]);

  const isAdmin = useMemo(() => {
    if (!isAuthenticated) {
      return false;
    }
    if (Array.isArray(session?.roles) && session.roles.some((role) => `${role}`.toLowerCase() === 'admin')) {
      return true;
    }
    return membershipSet.has('admin');
  }, [isAuthenticated, membershipSet, session?.roles]);

  const postSummary = useMemo(() => {
    const totals = {
      total: posts.length,
      draft: 0,
      scheduled: 0,
      published: 0,
      archived: 0,
    };
    posts.forEach((post) => {
      const status = (post.status ?? '').toLowerCase();
      if (totals[status] != null) {
        totals[status] += 1;
      }
    });
    return totals;
  }, [posts]);

  const selectedPost = useMemo(
    () => posts.find((post) => Number(post.id) === Number(selectedPostId)) ?? null,
    [posts, selectedPostId],
  );

  const loadPosts = useCallback(async () => {
    if (!isAdmin) {
      setPosts([]);
      setPostsLoading(false);
      return;
    }
    setPostsLoading(true);
    try {
      const payload = await fetchAdminBlogPosts({ pageSize: 100 });
      setPosts(payload?.results ?? []);
    } catch (error) {
      setGlobalError(error);
    } finally {
      setPostsLoading(false);
    }
  }, [isAdmin]);

  const loadCategories = useCallback(async () => {
    if (!isAdmin) {
      setCategories([]);
      setCategoriesLoading(false);
      return;
    }
    setCategoriesLoading(true);
    try {
      const payload = await fetchBlogCategories();
      setCategories(payload ?? []);
    } catch (error) {
      setGlobalError(error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [isAdmin]);

  const loadTags = useCallback(async () => {
    if (!isAdmin) {
      setTags([]);
      setTagsLoading(false);
      return;
    }
    setTagsLoading(true);
    try {
      setGlobalError(null);
      const payload = await fetchBlogTags();
      setTags(payload ?? []);
    } catch (error) {
      setGlobalError(error);
    } finally {
      setTagsLoading(false);
    }
  }, [isAdmin]);

  const loadMetrics = useCallback(async () => {
    if (!isAdmin) {
      setMetricsOverview(null);
      setMetricsLoading(false);
      return;
    }
    setMetricsLoading(true);
    try {
      setGlobalError(null);
      const payload = await fetchAdminBlogMetrics();
      setMetricsOverview(payload ?? null);
    } catch (error) {
      setGlobalError(error);
    } finally {
      setMetricsLoading(false);
    }
  }, [isAdmin]);

  const loadComments = useCallback(async () => {
    if (!isAdmin) {
      setComments([]);
      setCommentPagination(null);
      setCommentsLoading(false);
      return;
    }
    setCommentsLoading(true);
    try {
      setGlobalError(null);
      const payload = await fetchAdminBlogComments({
        postId: commentFilters.postId || undefined,
        status: commentFilters.status === 'all' ? undefined : commentFilters.status,
        page: commentFilters.page ?? 1,
        pageSize: 25,
      });
      setComments(payload?.results ?? []);
      setCommentPagination(payload?.pagination ?? null);
    } catch (error) {
      setGlobalError(error);
    } finally {
      setCommentsLoading(false);
    }
  }, [commentFilters, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    loadPosts();
    loadCategories();
    loadTags();
    loadMetrics();
  }, [isAdmin, loadPosts, loadCategories, loadTags, loadMetrics]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    loadComments();
  }, [isAdmin, loadComments]);

  const handleMenuSelect = useCallback(
    (itemId, item) => {
      if (item?.href) {
        navigate(item.href);
        return;
      }
      const target = item?.sectionId ?? item?.id ?? itemId;
      if (target) {
        setActiveSection(target);
        setFullscreenPanel(null);
      }
    },
    [navigate],
  );

  const handleSelectPost = (post) => {
    setSelectedPostId(post.id);
    setFormState({
      id: post.id,
      title: post.title ?? '',
      slug: post.slug ?? '',
      excerpt: post.excerpt ?? '',
      content: post.content ?? '',
      status: post.status ?? 'draft',
      categoryId: post.category?.id ? String(post.category.id) : '',
      readingTimeMinutes: post.readingTimeMinutes ?? 6,
      featured: Boolean(post.featured),
      coverImageUrl: post.coverImage?.url ?? '',
      mediaUrls: Array.isArray(post.media)
        ? post.media.map((item) => item.media?.url ?? '').filter(Boolean).join('\n')
        : '',
      tagsText: Array.isArray(post.tags) ? post.tags.map((tag) => tag.name).join(', ') : '',
    });
  };

  const handleStartNew = () => {
    setSelectedPostId(null);
    setFormState(DEFAULT_FORM);
  };

  const handleFormChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    setSavingPost(true);
    const payload = {
      title: formState.title,
      slug: formState.slug || undefined,
      excerpt: formState.excerpt || undefined,
      content: formState.content,
      status: formState.status,
      categoryId: formState.categoryId ? Number(formState.categoryId) : undefined,
      featured: Boolean(formState.featured),
      readingTimeMinutes: formState.readingTimeMinutes ? Number(formState.readingTimeMinutes) : undefined,
      coverImage: formState.coverImageUrl ? { url: formState.coverImageUrl } : undefined,
      tags: formState.tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      media: formState.mediaUrls
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url, index) => ({ url, position: index })),
    };

    try {
      setGlobalError(null);
      let result;
      if (formState.id) {
        result = await updateAdminBlogPost(formState.id, payload);
      } else {
        result = await createAdminBlogPost(payload);
      }
      await Promise.all([loadPosts(), loadMetrics()]);
      if (result?.id) {
        handleSelectPost(result);
      } else {
        handleStartNew();
      }
    } finally {
      setSavingPost(false);
    }
  };

  const handlePostDelete = async () => {
    if (!formState.id) {
      return;
    }
    const confirmed = window.confirm('Delete this blog post?');
    if (!confirmed) {
      return;
    }
    await deleteAdminBlogPost(formState.id);
    handleStartNew();
    await Promise.all([loadPosts(), loadMetrics(), loadComments()]);
  };

  const handleCreateCategory = async (payload) => {
    setGlobalError(null);
    await createBlogCategory(payload);
    await loadCategories();
  };

  const handleUpdateCategory = async (categoryId, payload) => {
    setGlobalError(null);
    await updateBlogCategory(categoryId, payload);
    await loadCategories();
  };

  const handleDeleteCategory = async (categoryId) => {
    setGlobalError(null);
    await deleteBlogCategory(categoryId);
    await loadCategories();
  };

  const handleCreateTag = async (payload) => {
    setGlobalError(null);
    await createBlogTag(payload);
    await loadTags();
  };

  const handleUpdateTag = async (tagId, payload) => {
    setGlobalError(null);
    await updateBlogTag(tagId, payload);
    await loadTags();
  };

  const handleDeleteTag = async (tagId) => {
    setGlobalError(null);
    await deleteBlogTag(tagId);
    await loadTags();
  };

  const handleUpdateMetrics = async (postId, payload) => {
    setGlobalError(null);
    await updateAdminBlogPostMetrics(postId, payload);
    await Promise.all([loadMetrics(), loadPosts()]);
  };

  const handleCreateComment = async (postId, payload) => {
    setGlobalError(null);
    await createAdminBlogComment(postId, payload);
    await Promise.all([loadComments(), loadMetrics()]);
  };

  const handleUpdateComment = async (commentId, payload) => {
    setGlobalError(null);
    await updateAdminBlogComment(commentId, payload);
    await Promise.all([loadComments(), loadMetrics()]);
  };

  const handleDeleteComment = async (commentId) => {
    setGlobalError(null);
    await deleteAdminBlogComment(commentId);
    await Promise.all([loadComments(), loadMetrics()]);
  };

  const handleCommentsFilterChange = (nextFilters) => {
    setCommentFilters(nextFilters);
  };

  const openPanel = (panelId) => {
    setActiveSection(panelId);
    setFullscreenPanel(null);
  };

  const openFullscreen = (panelId) => {
    setFullscreenPanel(panelId);
  };

  const closeFullscreen = () => {
    setFullscreenPanel(null);
  };

  const overviewShortcuts = useMemo(() => {
    const totals = metricsOverview?.totals ?? {};
    return [
      { id: 'editor', label: 'Write', value: selectedPost ? 'Editing' : 'New' },
      { id: 'library', label: 'Posts', value: formatCount(postSummary.total) },
      { id: 'metrics', label: 'Stats', value: formatCount(totals.totalViews) },
      { id: 'comments', label: 'Comments', value: formatCount(totals.commentCount) },
      { id: 'categories', label: 'Topics', value: formatCount(categories.length) },
      { id: 'tags', label: 'Tags', value: formatCount(tags.length) },
    ];
  }, [categories.length, metricsOverview, postSummary.total, selectedPost, tags.length]);

  const latestPosts = useMemo(() => posts.slice(0, 6), [posts]);

  const renderPanel = (panelId, { fullscreen = false } = {}) => {
    switch (panelId) {
      case 'editor':
        return (
          <BlogPostEditor
            formState={formState}
            onChange={handleFormChange}
            onSubmit={handlePostSubmit}
            onDelete={handlePostDelete}
            onStartNew={handleStartNew}
            saving={savingPost}
            categories={categories}
            selectedPost={selectedPost}
            onExpand={() => openFullscreen('editor')}
            onCloseFullscreen={closeFullscreen}
            isFullscreen={fullscreen}
          />
        );
      case 'library':
        return (
          <BlogPostLibrary
            posts={posts}
            selectedPostId={selectedPostId}
            onSelect={handleSelectPost}
            onRefresh={loadPosts}
            loading={postsLoading}
            onExpand={() => openFullscreen('library')}
            onCloseFullscreen={closeFullscreen}
            isFullscreen={fullscreen}
          />
        );
      case 'metrics':
        return (
          <BlogMetricsPanel
            overview={metricsOverview}
            loading={metricsLoading}
            onRefresh={loadMetrics}
            posts={posts}
            onUpdatePostMetrics={handleUpdateMetrics}
            onExpand={() => openFullscreen('metrics')}
            onCloseFullscreen={closeFullscreen}
            isFullscreen={fullscreen}
          />
        );
      case 'comments':
        return (
          <BlogCommentsPanel
            comments={comments}
            loading={commentsLoading}
            pagination={commentPagination}
            filters={commentFilters}
            onFilterChange={handleCommentsFilterChange}
            onRefresh={loadComments}
            posts={posts}
            onCreate={handleCreateComment}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
            onExpand={() => openFullscreen('comments')}
            onCloseFullscreen={closeFullscreen}
            isFullscreen={fullscreen}
          />
        );
      case 'categories':
        return (
          <BlogCategoryManager
            categories={categories}
            onCreate={handleCreateCategory}
            onUpdate={handleUpdateCategory}
            onDelete={handleDeleteCategory}
            loading={categoriesLoading}
            onExpand={() => openFullscreen('categories')}
            onCloseFullscreen={closeFullscreen}
            isFullscreen={fullscreen}
          />
        );
      case 'tags':
        return (
          <BlogTagManager
            tags={tags}
            onCreate={handleCreateTag}
            onUpdate={handleUpdateTag}
            onDelete={handleDeleteTag}
            loading={tagsLoading}
            onExpand={() => openFullscreen('tags')}
            onCloseFullscreen={closeFullscreen}
            isFullscreen={fullscreen}
          />
        );
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Blog"
        menuSections={ADMIN_BLOG_MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem={activeSection}
        onMenuItemSelect={handleMenuSelect}
        profile={session}
      >
        <div className="px-6 py-12">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-800">
            Admin access required to manage the Gigvora blog workspace.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Blog"
      menuSections={ADMIN_BLOG_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeSection}
      onMenuItemSelect={handleMenuSelect}
      profile={session}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        {globalError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-600">
            Something went wrong. Refresh or try again.
          </div>
        ) : null}

        {activeSection === 'overview' ? (
          <>
            <section
              id="overview"
              className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">Blog workspace</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700">
                      Drafts {formatCount(postSummary.draft)}
                    </span>
                    <span className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700">
                      Published {formatCount(postSummary.published)}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {overviewShortcuts.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() => openPanel(shortcut.id)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-accent hover:bg-white"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {shortcut.label}
                      </span>
                      <span className="mt-2 block text-xl font-semibold text-slate-900">
                        {shortcut.value}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Latest posts</h2>
                <button
                  type="button"
                  onClick={() => openPanel('library')}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
                >
                  Open posts
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {latestPosts.length === 0 ? (
                  <p className="text-sm text-slate-500">No posts yet.</p>
                ) : (
                  latestPosts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => {
                        openPanel('editor');
                        handleSelectPost(post);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-accent hover:bg-slate-50"
                    >
                      <span className="text-sm font-semibold text-slate-900">{post.title}</span>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {(post.status ?? 'draft').toUpperCase()} ·{' '}
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Unpublished'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openPanel('editor')}
                    className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => openPanel('comments')}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Review comments
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readers</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatCount(metricsOverview?.totals?.uniqueVisitors)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Views</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatCount(metricsOverview?.totals?.totalViews)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Queue</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{formatCount(comments.length)}</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          renderPanel(activeSection)
        )}
      </div>

      <FullscreenPanel open={Boolean(fullscreenPanel)} onClose={closeFullscreen}>
        {fullscreenPanel ? renderPanel(fullscreenPanel, { fullscreen: true }) : null}
      </FullscreenPanel>
    </DashboardLayout>
  );
}
