"use client"

import { useEffect, useState } from "react"

export function AuthLoading() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-8 relative z-10">
        {/* Animated orbiting dots */}
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin"></div>
          <div
            className="absolute inset-4 rounded-full border-2 border-transparent border-b-primary border-l-primary/50 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
          <div
            className="absolute inset-8 rounded-full border-2 border-transparent border-t-primary/30 animate-spin"
            style={{ animationDuration: "2s" }}
          ></div>

          {/* Center logo/icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-primary/50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading text with gradient */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Loading your forum
          </p>
          <div className="flex gap-1 justify-center">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s" }}></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></span>
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }}></span>
          </div>
        </div>

        {/* Subtle background animation */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
      </div>
    </div>
  )
}
