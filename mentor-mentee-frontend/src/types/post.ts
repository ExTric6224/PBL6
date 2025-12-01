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
  user?: {
    id: number;
    email: string;
    role: string;
    mentorprofile?: {
      fullName: string;
      avatar?: string;
      school: string;
    };
    menteeprofile?: {
      fullName: string;
      avatar?: string;
    };
  };
  likesCount?: number; // Backend trả về likesCount thay vì _count.likes
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
