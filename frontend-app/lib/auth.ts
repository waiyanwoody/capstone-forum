"use client";

import { ApiErrorResponse, ApiHttpError, parseOrFallback } from "./http";
import { PostSummary } from "./types";

export interface User {
  id: string | number;
  email: string;
  fullname: string;
  username: string;
  role?: string;
  created_at?: string;
  email_verified?: boolean;
  email_verified_at?: string;
  avatar_path?: string;
  bio?: string;
  reputation?: number;
  posts?: PostSummary[];
  followed?: boolean;
  isFriend: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// check username available
export const checkUsername = async (
  username: string
): Promise<{ valid: boolean; available: boolean; message?: string }> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const response = await fetch(
    `${apiUrl}/auth/check-username?username=${encodeURIComponent(username)}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to check username");
  }

  return response.json();
};

// Store token in localStorage
export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
};

// Get token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

// Remove token from localStorage
export const removeAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
};

// Mock API calls - replace with real API endpoints
export const loginUser = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = (await parseOrFallback(response)) as ApiErrorResponse | null;
    // If the API returns a proper JSON error → ApiHttpError is thrown.
    if (data && typeof data.status === "number") throw new ApiHttpError(data);
    // If it returns plain text or no body → a normal Error is thrown.
    throw new Error(`Login failed (${response.status})`);
  }

  return (await response.json()) as AuthResponse;
};

export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const response = await fetch(`${apiUrl}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const data = (await parseOrFallback(response)) as ApiErrorResponse | null;
    if (data && typeof data.status === "number") throw new ApiHttpError(data);
    throw new Error(`Register failed (${response.status})`);
  }

  return (await response.json()) as AuthResponse;
};

export const getCurrentUser = async (): Promise<User> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const token = getAuthToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${apiUrl}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = (await parseOrFallback(response)) as ApiErrorResponse | null;
    if (data && typeof data.status === "number") throw new ApiHttpError(data);
    throw new Error(`Failed to fetch current user (${response.status})`);
  }

  return (await response.json()) as User;
};

// Fetch with authentication
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  return fetch(url, { ...options, headers });
};

export const requestPasswordReset = async (
  identifier: string
): Promise<{ message: string }> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const response = await fetch(`${apiUrl}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier }),
  });

  if (!response.ok) {
    const data = (await parseOrFallback(response)) as ApiErrorResponse | null;
    if (data && typeof data.status === "number") throw new ApiHttpError(data);
    throw new Error(`Forgot password request failed (${response.status})`);
  }

  return response.json();
};

export const resetPassword = async (
  identifier: string,
  otp: string,
  newPassword: string
): Promise<{ message: string }> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const response = await fetch(`${apiUrl}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier, otp, newPassword }),
  });

  if (!response.ok) {
    const data = (await parseOrFallback(response)) as ApiErrorResponse | null;
    if (data && typeof data.status === "number") throw new ApiHttpError(data);
    throw new Error(`Reset password failed (${response.status})`);
  }

  return response.json();
};
