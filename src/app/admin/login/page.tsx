'use client'

import { AdminLoginForm } from '@/components/auth/AdminLoginForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        </h2>
      </div>
      <AdminLoginForm />
    </div>
  )
} 