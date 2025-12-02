export type PostStatus = 'draft' | 'published';

export interface Post {
  slug: string;
  title: string;
  authorId: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  contentKey: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  status?: PostStatus;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  status?: PostStatus;
}

export interface PostListItem {
  slug: string;
  title: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
