"use client"

import { AuthProvider } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { ClassRegistrationProvider } from '@/components/classes-registration/context/ClassRegistrationContext'

interface ClassesLayoutProps {
  children: React.ReactNode
}

export default function ClassesLayout({ children }: ClassesLayoutProps) {
  return (
    <AuthProvider>
      <ClassRegistrationProvider empresaId="default">
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
      </ClassRegistrationProvider>
    </AuthProvider>
  )
} 