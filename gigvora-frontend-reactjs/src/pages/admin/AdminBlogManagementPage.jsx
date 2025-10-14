import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAdminBlogPosts,
  createAdminBlogPost,
  updateAdminBlogPost,
  deleteAdminBlogPost,
  fetchBlogCategories,
  fetchBlogTags,
  createBlogCategory,
  createBlogTag,
} from '../../services/blog.js';

const DEFAULT_FORM = {
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
};

export default function AdminBlogManagementPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '' });
  const [tagForm, setTagForm] = useState({ name: '', slug: '', description: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [postPayload, categoryPayload, tagPayload] = await Promise.all([
        fetchAdminBlogPosts({ pageSize: 50 }),
        fetchBlogCategories({}),
        fetchBlogTags({}),
      ]);
      setPosts(postPayload?.results ?? []);
      setCategories(categoryPayload ?? []);
      setTags(tagPayload ?? []);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback((post) => {
    if (!post) {
      setFormState(DEFAULT_FORM);
      return;
    }
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
        ? post.media
            .map((item) => item.media?.url ?? '')
            .filter(Boolean)
            .join('\n')
        : '',
      tagsText: Array.isArray(post.tags) ? post.tags.map((tag) => tag.name).join(', ') : '',
    });
  }, []);

  const handleDelete = useCallback(
    async (postId) => {
      if (!postId) return;
      // eslint-disable-next-line no-alert
      const confirmDelete = window.confirm('Delete this blog post? This action cannot be undone.');
      if (!confirmDelete) {
        return;
      }
      await deleteAdminBlogPost(postId);
      if (formState.id === postId) {
        setFormState(DEFAULT_FORM);
      }
      await loadData();
    },
    [formState.id, loadData],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSaving(true);
      try {
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

        if (formState.id) {
          await updateAdminBlogPost(formState.id, payload);
        } else {
          await createAdminBlogPost(payload);
        }
        setFormState(DEFAULT_FORM);
        await loadData();
      } finally {
        setSaving(false);
      }
    },
    [formState, loadData],
  );

  const handleCategorySubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!categoryForm.name) return;
      await createBlogCategory({
        name: categoryForm.name,
        slug: categoryForm.slug || undefined,
        description: categoryForm.description || undefined,
      });
      setCategoryForm({ name: '', slug: '', description: '' });
      await loadData();
    },
    [categoryForm, loadData],
  );

  const handleTagSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!tagForm.name) return;
      await createBlogTag({
        name: tagForm.name,
        slug: tagForm.slug || undefined,
        description: tagForm.description || undefined,
      });
      setTagForm({ name: '', slug: '', description: '' });
      await loadData();
    },
    [tagForm, loadData],
  );

  const selectedPost = useMemo(() => posts.find((post) => post.id === formState.id) ?? null, [formState.id, posts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50/40 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <header className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_40px_110px_-70px_rgba(37,99,235,0.4)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Admin content operations</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Gigvora blog management</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Publish trusted stories, release updates, and knowledge hub articles across the Gigvora ecosystem. Every change syncs
            to the web experience and mobile app for immediate parity.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-semibold text-accent">
              {posts.length} posts
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
              {categories.length} categories
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
              {tags.length} tags
            </span>
          </div>
        </header>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-600">
            Unable to load blog data. Refresh the page or retry later.
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedPost ? `Editing: ${selectedPost.title}` : 'Create a new article'}
              </h2>
              {selectedPost ? (
                <button
                  type="button"
                  onClick={() => setFormState(DEFAULT_FORM)}
                  className="text-sm font-semibold text-accent hover:text-accentDark"
                >
                  Start new
                </button>
              ) : null}
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={formState.title}
                  onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="slug" className="block text-sm font-semibold text-slate-700">
                    Slug (optional)
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={formState.slug}
                    onChange={(event) => setFormState((current) => ({ ...current, slug: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formState.status}
                    onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-slate-700">
                  Category
                </label>
                <select
                  id="category"
                  value={formState.categoryId}
                  onChange={(event) => setFormState((current) => ({ ...current, categoryId: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                >
                  <option value="">Uncategorised</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="excerpt" className="block text-sm font-semibold text-slate-700">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  rows={3}
                  value={formState.excerpt}
                  onChange={(event) => setFormState((current) => ({ ...current, excerpt: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-semibold text-slate-700">
                  Content (HTML supported)
                </label>
                <textarea
                  id="content"
                  rows={10}
                  required
                  value={formState.content}
                  onChange={(event) => setFormState((current) => ({ ...current, content: event.target.value }))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="readingTime" className="block text-sm font-semibold text-slate-700">
                    Reading time (minutes)
                  </label>
                  <input
                    id="readingTime"
                    type="number"
                    min="1"
                    value={formState.readingTimeMinutes}
                    onChange={(event) => setFormState((current) => ({ ...current, readingTimeMinutes: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="featured" className="block text-sm font-semibold text-slate-700">
                    Featured
                  </label>
                  <select
                    id="featured"
                    value={formState.featured ? 'true' : 'false'}
                    onChange={(event) => setFormState((current) => ({ ...current, featured: event.target.value === 'true' }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  >
                    <option value="false">Standard</option>
                    <option value="true">Featured</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="coverImageUrl" className="block text-sm font-semibold text-slate-700">
                    Cover image URL
                  </label>
                  <input
                    id="coverImageUrl"
                    type="text"
                    value={formState.coverImageUrl}
                    onChange={(event) => setFormState((current) => ({ ...current, coverImageUrl: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tagsText" className="block text-sm font-semibold text-slate-700">
                    Tags (comma separated)
                  </label>
                  <input
                    id="tagsText"
                    type="text"
                    value={formState.tagsText}
                    onChange={(event) => setFormState((current) => ({ ...current, tagsText: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="mediaUrls" className="block text-sm font-semibold text-slate-700">
                    Gallery media (one URL per line)
                  </label>
                  <textarea
                    id="mediaUrls"
                    rows={3}
                    value={formState.mediaUrls}
                    onChange={(event) => setFormState((current) => ({ ...current, mediaUrls: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
                >
                  {formState.id ? 'Update post' : 'Publish post'}
                </button>
                {formState.id ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(formState.id)}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 px-6 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                  >
                    Delete post
                  </button>
                ) : null}
                {saving ? <span className="text-xs text-slate-500">Saving changes...</span> : null}
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Categories</h2>
              <form className="mt-4 space-y-3" onSubmit={handleCategorySubmit}>
                <input
                  type="text"
                  placeholder="Category name"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Slug (optional)"
                  value={categoryForm.slug}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Add category
                </button>
              </form>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {categories.map((category) => (
                  <li key={category.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    {category.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Tags</h2>
              <form className="mt-4 space-y-3" onSubmit={handleTagSubmit}>
                <input
                  type="text"
                  placeholder="Tag name"
                  value={tagForm.name}
                  onChange={(event) => setTagForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Slug (optional)"
                  value={tagForm.slug}
                  onChange={(event) => setTagForm((current) => ({ ...current, slug: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={tagForm.description}
                  onChange={(event) => setTagForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                >
                  Add tag
                </button>
              </form>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {tags.map((tag) => (
                  <li key={tag.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    #{tag.name}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Posts overview</h2>
            <button
              type="button"
              onClick={loadData}
              className="text-sm font-semibold text-accent hover:text-accentDark"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading posts...</p>
          ) : posts.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handleEdit(post)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    formState.id === post.id
                      ? 'border-accent/50 bg-accentSoft shadow-soft'
                      : 'border-slate-200 bg-white hover:border-accent/40 hover:shadow-sm'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    {post.status} • {post.category?.name ?? 'Uncategorised'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published'}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No posts found. Start by drafting your first article.</p>
          )}
        </section>
      </div>
    </div>
  );
}
