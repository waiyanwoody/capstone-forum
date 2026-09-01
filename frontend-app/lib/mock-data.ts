import type { Post, User, Comment, Notification } from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    username: "johndoe",
    avatar: "/thoughtful-man-in-library.png",
    bio: "Full-stack developer passionate about React and TypeScript",
    joinedAt: "2023-01-15",
    stats: {
      followingCount: 45,
      followerCount: 234,
      postCount: 67,
      postLikeCount: 523,
    },
  },
  {
    id: "2",
    name: "Sarah Chen",
    username: "sarahc",
    avatar: "/diverse-group-smiling.png",
    bio: "UI/UX designer and frontend developer",
    joinedAt: "2023-03-20",
    stats: {
      followingCount: 123,
      followerCount: 456,
      postCount: 89,
      postLikeCount: 1234,
    },
  },
  {
    id: "3",
    name: "Mike Johnson",
    username: "mikej",
    avatar: "/person-named-mike.png",
    bio: "Backend engineer specializing in Node.js",
    joinedAt: "2023-02-10",
    stats: {
      followingCount: 78,
      followerCount: 321,
      postCount: 54,
      postLikeCount: 789,
    },
  },
]

export const mockPosts: Post[] = [
  {
    id: "1",
    title: "How to optimize React performance with useMemo and useCallback?",
    slug: "optimize-react-performance-usememo-usecallback",
    excerpt:
      "I've been working on a large React application and noticed some performance issues. What are the best practices for using useMemo and useCallback?",
    contentMD: "# Performance Optimization\n\nI've been working on a large React application...",
    tags: ["React", "Performance", "Hooks"],
    author: mockUsers[0],
    createdAt: "2025-01-20T10:30:00Z",
    lastActivityAt: "2025-01-22T15:45:00Z",
    likeCount: 24,
    replyCount: 8,
    isSaved: true,
    isSolved: true,
  },
  {
    id: "2",
    title: "Best practices for Next.js 15 App Router?",
    slug: "nextjs-15-app-router-best-practices",
    excerpt:
      "With the new App Router in Next.js 15, what are the recommended patterns for data fetching and state management?",
    contentMD: "# Next.js 15 App Router\n\nI'm migrating to the new App Router...",
    tags: ["Next.js", "React", "App Router"],
    author: mockUsers[1],
    createdAt: "2025-01-21T14:20:00Z",
    lastActivityAt: "2025-01-22T16:30:00Z",
    likeCount: 42,
    replyCount: 15,
    isSaved: false,
    isPinned: true,
  },
  {
    id: "3",
    title: "TypeScript generics explained with practical examples",
    slug: "typescript-generics-practical-examples",
    excerpt:
      "Can someone explain TypeScript generics with real-world examples? I understand the basics but struggle with complex scenarios.",
    contentMD: "# TypeScript Generics\n\nI've been learning TypeScript...",
    tags: ["TypeScript", "Tutorial"],
    author: mockUsers[2],
    createdAt: "2025-01-19T09:15:00Z",
    lastActivityAt: "2025-01-22T11:20:00Z",
    likeCount: 67,
    replyCount: 23,
    isSaved: true,
  },
]

export const mockComments: Comment[] = [
  {
    id: "1",
    author: mockUsers[1],
    contentMD: "Great question! Here's what I've learned about `useMemo` and `useCallback`...",
    createdAt: "2025-01-20T11:30:00Z",
    likeCount: 12,
    isLiked: false,
    children: [
      {
        id: "2",
        author: mockUsers[0],
        contentMD: "Thanks for the detailed explanation! This really helps.",
        createdAt: "2025-01-20T12:00:00Z",
        likeCount: 3,
        isLiked: true,
        children: [],
      },
    ],
  },
]

export const mockUserReplies: Comment[] = [
  {
    id: "r1",
    author: mockUsers[0],
    contentMD: "Great question! I've been using `useMemo` extensively in my projects. Here's what I've learned...",
    createdAt: "2025-01-20T11:30:00Z",
    likeCount: 12,
    isLiked: false,
    children: [],
  },
  {
    id: "r2",
    author: mockUsers[0],
    contentMD: "For TypeScript generics, I recommend starting with simple utility types like `Pick` and `Omit`.",
    createdAt: "2025-01-19T14:20:00Z",
    likeCount: 8,
    isLiked: true,
    children: [],
  },
  {
    id: "r3",
    author: mockUsers[0],
    contentMD:
      "The new App Router is amazing! Make sure to use Server Components where possible for better performance.",
    createdAt: "2025-01-21T16:45:00Z",
    likeCount: 15,
    isLiked: false,
    children: [],
  },
]

export const mockLikedPosts: Post[] = [
  {
    id: "l1",
    title: "Understanding React Server Components",
    slug: "understanding-react-server-components",
    excerpt: "A deep dive into React Server Components and how they work with Next.js 15.",
    contentMD: "# React Server Components\n\nLet's explore how RSC works...",
    tags: ["React", "Next.js", "Server Components"],
    author: mockUsers[1],
    createdAt: "2025-01-18T10:00:00Z",
    lastActivityAt: "2025-01-22T09:30:00Z",
    likeCount: 89,
    replyCount: 34,
    isSaved: false,
  },
  {
    id: "l2",
    title: "Tailwind CSS v4 - What's New?",
    slug: "tailwind-css-v4-whats-new",
    excerpt: "Exploring the new features and improvements in Tailwind CSS version 4.",
    contentMD: "# Tailwind CSS v4\n\nThe latest version brings exciting changes...",
    tags: ["CSS", "Tailwind", "Design"],
    author: mockUsers[2],
    createdAt: "2025-01-17T14:30:00Z",
    lastActivityAt: "2025-01-21T18:20:00Z",
    likeCount: 56,
    replyCount: 19,
    isSaved: true,
  },
]

export const mockSavedPosts: Post[] = [
  mockPosts[0], // The React performance post
  mockPosts[2], // The TypeScript generics post
  {
    id: "s1",
    title: "Building a Design System with Radix UI",
    slug: "building-design-system-radix-ui",
    excerpt: "Learn how to create a scalable design system using Radix UI primitives and Tailwind CSS.",
    contentMD: "# Design System with Radix UI\n\nRadix UI provides unstyled, accessible components...",
    tags: ["Design System", "Radix UI", "React"],
    author: mockUsers[1],
    createdAt: "2025-01-16T11:00:00Z",
    lastActivityAt: "2025-01-20T14:45:00Z",
    likeCount: 78,
    replyCount: 28,
    isSaved: true,
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "REPLY",
    message: 'Sarah Chen replied to your thread "How to optimize React performance"',
    createdAt: "2025-01-22T15:45:00Z",
    read: false,
    link: "/t/optimize-react-performance-usememo-usecallback",
  },
  {
    id: "2",
    type: "LIKE",
    message: "Mike Johnson liked your comment",
    createdAt: "2025-01-22T14:30:00Z",
    read: false,
    link: "/t/optimize-react-performance-usememo-usecallback#comment-2",
  },
  {
    id: "3",
    type: "MENTION",
    message: 'You were mentioned in "TypeScript generics explained"',
    createdAt: "2025-01-22T10:15:00Z",
    read: true,
    link: "/t/typescript-generics-practical-examples",
  },
]
