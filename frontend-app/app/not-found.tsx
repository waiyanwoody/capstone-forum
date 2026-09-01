"use client"

import Link from "next/link"
import { Home, Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"

export default function NotFound() {
  const lottieRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Lottie animation dynamically
    import("lottie-web").then((lottie) => {
      if (lottieRef.current) {
        lottie.default.loadAnimation({
          container: lottieRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "https://lottie.host/b68d2566-3e6f-4a4e-9b3e-d8c9e0f5c5e5/kQMzXdKZqJ.json", // 404 animation
        })
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        {/* Lottie Animation */}
        <div className="relative flex items-center justify-center">
          <div ref={lottieRef} className="w-full max-w-md h-64 sm:h-80" />
        </div>

        {/* Content */}
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent animate-gradient">
            Page Not Found
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto text-balance">
            The page you're looking for doesn't exist or has been moved to another location.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up">
          <Button asChild size="lg" className="gap-2 group">
            <Link href="/">
              <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent group">
            <Link href="/search">
              <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Search Forum
            </Link>
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="pt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in">
          <ArrowLeft className="h-4 w-4 animate-pulse" />
          <span>Use the navigation above to find your way back</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0.5;
          }
          90% {
            opacity: 0.3;
          }
        }
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out 0.4s both;
        }
      `}</style>
    </div>
  )
}
