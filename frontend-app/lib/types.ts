export type Post = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  slug: string;
  createdAt: string;
  author: {
    id: number;
    fullname: string;
    username: string;
    email?: string;
    bio?: string;
    avatar_path?: string;
    role?: string;
    created_at?: string;
    email_verified?: boolean;
    email_verified_at?: string;
  };
  likeCount: number;
  liked: boolean;
  commentCount?: number;
  isSaved?: boolean;
  isPinned?: boolean;
  isSolved?: boolean;
  viewCount?: number;
  bestCommentId?: number | null;
};

export type PostSummary = {
  id: number;
  title: string;
  excerpt: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
};

export interface UserProfile {
  id: string | number;
  fullname: string;
  username: string;
  email: string;
  email_verified: boolean;
  bio?: string;
  avatar_path?: string;
  createdAt?: string;
  followed?: boolean;
  isFriend: boolean;
}

export type UserSummary = {
  id: number;
  username: string;
  avatar_path: string;
};

export type UserPostsResponse = {
  author: UserSummary;
  posts: PostSummary[];
  page: number;
  pageSize: number;
  totalPosts: number;
};

export type ProfileStatus = {
  followingCount: number,
  followerCount: number;
  postCount: number;
  postLikeCount: number;
}

// Generic pagination type for any entity
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: Pageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export type Comment {
  id: number;
  content: string;
  authorUsername: string;
  authorFullname: string;
  authorAvatar?: string;
  postId: number;
  createdAt: string;
  replies: Comment[];
  likeCount?: number;
  liked?: boolean;
  best?: boolean;
}

export type User = {
  id: string
  name: string
  username: string
  avatar: string
  bio?: string
  joinedAt?: string
  badges?: Badge[]
  stats?: UserStats
}

export type Badge = {
  id: string
  name: string
  icon: string
  color: string
}

export type UserStats = {
  posts: number
  replies: number
  likesReceived: number
  solutions: number
  followingCount: number
  followerCount: number
  postCount: number
  postLikeCount: number
}

export type Notification = {
  id: string | number
  receiverId?: number
  senderId?: number
  type: "LIKE" | "REPLY" | "MENTION" | "COMMENT" | "FOLLOW"
  message: string
  createdAt: string
  read: boolean
  link?: string
}

// export interface Comment {
//   id: number;
//   content: string;
//   authorUsername: string;
//   authorFullname: string;
//   postId: number;
//   createdAt: string;
//   replies: Comment[];
// }

export interface CreateCommentPayload {
  postId: number;
  content: string;
  parentCommentId?: number | null;
}

export type PostDetail = {
  id: number
  title: string
  content: string
  tags: string[]
  slug: string
  createdAt: string
  author: {
    id: number
    fullname: string
    username: string
    email?: string
    bio?: string
    avatar_path?: string
    role?: string
    created_at?: string
    email_verified?: boolean
    email_verified_at?: string
  }
  likeCount: number
  liked: boolean
  replyCount: number
}
