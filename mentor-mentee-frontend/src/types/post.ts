export interface PostImage {
  id: number;
  postId: number;
  imageUrl: string;
  order: number;
  createdAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  images?: PostImage[];
  author?: {
    id: number;
    email: string;
    role: string;
  };
  _count?: {
    likes: number;
  };
  isLikedByCurrentUser?: boolean;
}

export interface CreatePostData {
  title: string;
  content: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
}

export interface PostLike {
  id: number;
  userId: number;
  postId: number;
  createdAt: string;
  user?: {
    id: number;
    email: string;
  };
}
