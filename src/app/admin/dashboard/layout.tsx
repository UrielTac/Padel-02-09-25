import React from 'react'
import { Sidebar } from '@/components/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:pl-[240px]">
        <div className="container p-8">{children}</div>
      </main>
    </div>
  )
}
