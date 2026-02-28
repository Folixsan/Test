import { useState, useEffect } from "react";
import { Mail } from "lucide-react";

interface PageLoaderProps {
  onComplete: () => void;
}

export function PageLoader({ onComplete }: PageLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Faster at start, slower near end
        const increment = prev < 70 ? 15 : prev < 90 ? 5 : 2;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      // Start exit animation
      setTimeout(() => {
        setIsExiting(true);
      }, 200);
      
      // Complete after exit animation
      setTimeout(() => {
        onComplete();
      }, 700);
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-background flex flex-col items-center justify-center transition-all duration-500 ${
        isExiting ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Logo animation */}
      <div className="relative mb-8">
        <div 
          className={`w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center transition-all duration-700 ${
            progress < 100 ? "animate-pulse-soft" : "scale-110"
          }`}
        >
          <Mail className="w-8 h-8 text-background" />
        </div>
        
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl bg-foreground/20 blur-xl transition-opacity duration-500"
          style={{ opacity: progress / 200 }}
        />
      </div>

      {/* Brand name with letter animation */}
      <div className="flex items-center gap-1 mb-8 overflow-hidden">
        {"tempmail".split("").map((letter, index) => (
          <span
            key={index}
            className="text-2xl font-bold tracking-tight transition-all duration-500"
            style={{
              opacity: progress > index * 10 ? 1 : 0,
              transform: progress > index * 10 ? "translateY(0)" : "translateY(20px)",
              transitionDelay: `${index * 50}ms`,
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-48 h-0.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading text */}
      <p className="mt-4 text-sm text-muted-foreground">
        {progress < 100 ? "Loading..." : "Ready"}
      </p>
    </div>
  );
}
