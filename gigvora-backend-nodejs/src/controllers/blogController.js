import {
  listBlogPosts,
  getBlogPost,
  listBlogCategories,
  listBlogTags,
} from '../services/blogService.js';

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    return normalised === 'true' || normalised === '1';
  }
  return false;
}

export async function index(req, res) {
  const { status, page, pageSize, category, tag, search } = req.query ?? {};
  const includeUnpublished = parseBoolean(req.query?.includeUnpublished);
  const payload = await listBlogPosts({ status, page, pageSize, category, tag, search, includeUnpublished });
  res.json(payload);
}

export async function show(req, res) {
  const { slug } = req.params;
  const includeUnpublished = parseBoolean(req.query?.includeUnpublished);
  const post = await getBlogPost(slug, { includeUnpublished });
  res.json(post);
}

export async function categories(req, res) {
  const items = await listBlogCategories();
  res.json({ results: items });
}

export async function tags(req, res) {
  const items = await listBlogTags();
  res.json({ results: items });
}

export default {
  index,
  show,
  categories,
  tags,
};
