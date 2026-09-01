"use client"

import type React from "react"

import { useContext, useEffect } from "react"
import { AuthContext } from "@/contexts/auth-context"
import { AuthLoading } from "./auth-loading"
import { useRouter } from "next/navigation"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const context = useContext(AuthContext)
    const router = useRouter();

  if (!context) {
    throw new Error("ProtectedRoute must be used within AuthProvider")
  }

    const { isAuthenticated, isLoading } = context;

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
        router.push("/login"); // Redirect to login if not authenticated
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return <AuthLoading />;
    }

    if (!isAuthenticated) {
        // While the redirect is happening, you can optionally return null or a loading state
        return null;
    }

  return <>{children}</>
}