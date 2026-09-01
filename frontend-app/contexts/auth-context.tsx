"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/auth"
import { getAuthToken, setAuthToken, removeAuthToken, getCurrentUser, loginUser, registerUser, checkUsername  } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkUsernameAvailable: (username: string) => Promise<{ valid: boolean; available: boolean; message: string | undefined; }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken()
      if (token) {
        try {
          const userData = await getCurrentUser(token)
          setUser(userData)
        } catch (error) {
          console.error("[v0] Failed to get user:", error)
          removeAuthToken()
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const { user: userData, token } = await loginUser(username, password)
      setAuthToken(token)
      setUser(userData)
      console.log(userData);
      router.push("/")
    } catch (error) {
      throw error
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      const { user: userData, token } = await registerUser(username, email, password)
      setAuthToken(token)
      setUser(userData)
      router.push("/")
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    removeAuthToken()
    setUser(null)
    router.push("/login")
  }

  const checkUsernameAvailable = async (username: string) => {
    try {
      const { valid, available, message } = await checkUsername(username)
      return { valid, available, message };
    } catch (error) {
      console.error("Failed to check username:", error)
      throw error
    }
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkUsernameAvailable,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
