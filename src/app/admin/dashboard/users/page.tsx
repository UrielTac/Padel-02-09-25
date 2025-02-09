"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MembersTable } from "@/components/usersSection/MembersTable"
import { useAuth } from "@/contexts/AuthContext"
import { useBranchContext } from "@/contexts/BranchContext"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/appStore"

export default function UsersPage() {
  const { user, isLoading: isLoadingAuth } = useAuth()
  const { currentBranch, isLoading: isLoadingBranch } = useBranchContext()
  const router = useRouter()
  const { currentBranch: appStoreBranch } = useAppStore()

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push('/admin/login')
    }
  }, [user, isLoadingAuth, router])

  // Estado de carga general
  const isLoading = isLoadingAuth || isLoadingBranch

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!user) return null

  // Verificar que tengamos una sede seleccionada
  if (!currentBranch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">No hay una sede seleccionada</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="border-b border-slate-200/10">
          <TabsTrigger value="members">Miembros</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <div className="bg-card">
            <MembersTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
