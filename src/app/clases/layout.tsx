"use client"

import { AuthProvider } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <main className={cn(
        "h-screen w-full",
        "bg-white",
        "flex items-center justify-center",
        "overflow-hidden"
      )}>
        <div className={cn(
          "w-full h-full",
          "max-w-[var(--container-default)]",
          "flex items-center justify-center",
          "px-[var(--padding-container-mobile)]",
          "sm:px-[var(--padding-container-tablet)]",
          "lg:px-[var(--padding-container-desktop)]"
        )}>
          {children}
        </div>
      </main>
    </AuthProvider>
  )
} 