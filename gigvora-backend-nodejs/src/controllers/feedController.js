import { FeedPost, User, Profile } from '../models/index.js';

export async function listFeed(req, res) {
  const posts = await FeedPost.findAll({
    include: [{ model: User, include: [Profile] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(posts);
}

export async function createPost(req, res) {
  const { userId, content, visibility } = req.body;
  const post = await FeedPost.create({ userId, content, visibility });
  res.status(201).json(post);
}
