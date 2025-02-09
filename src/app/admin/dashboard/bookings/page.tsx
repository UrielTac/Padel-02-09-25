"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BookingsTable } from "@/components/bookings/BookingsTable"
import { CourtsTable } from "@/components/bookings/CourtsTable"
import { ClassesTable } from "@/components/bookings/classes/ClassesTable"
import { useAuth } from "@/contexts/AuthContext"
import { useBranchContext } from "@/contexts/BranchContext"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePathname } from "next/navigation"

export default function BookingsPage() {
  const { isLoading: isLoadingAuth, user } = useAuth()
  const { isLoading: isLoadingBranch, currentBranch } = useBranchContext()
  const queryClient = useQueryClient()
  const pathname = usePathname()
  
  const isLoading = isLoadingAuth || isLoadingBranch

  // Efecto para refrescar los datos cuando se monta el componente o cambia la ruta
  useEffect(() => {
    if (!isLoading && user && currentBranch) {
      // Invalidar las queries relacionadas con reservas
      queryClient.invalidateQueries(['bookings'])
      queryClient.invalidateQueries(['courts'])
      queryClient.invalidateQueries(['classes'])
    }
  }, [pathname, user, currentBranch, isLoading, queryClient])

  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      <main className="absolute inset-0 lg:left-[240px]">
        <div className="absolute inset-[8px]">
          <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] w-full h-full overflow-auto scrollbar-none">
            <div className="px-6 py-4">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                    <p className="text-sm text-gray-500">Cargando...</p>
                  </div>
                </div>
              ) : !user ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-gray-500">No hay sesión activa</p>
                  </div>
                </div>
              ) : !currentBranch ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-gray-500">No hay una sede seleccionada</p>
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="bookings" className="flex flex-col h-full">
                  <div className="flex-none mb-4">
                    <TabsList>
                      <TabsTrigger 
                        value="bookings"
                        className="data-[state=inactive]:text-gray-500"
                      >
                        Reservaciones
                      </TabsTrigger>
                      <TabsTrigger 
                        value="courts"
                        className="data-[state=inactive]:text-gray-500"
                      >
                        Canchas
                      </TabsTrigger>
                      <TabsTrigger 
                        value="classes"
                        className="data-[state=inactive]:text-gray-500"
                      >
                        Clases
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="bookings" className="flex-1">
                    <div className="h-full overflow-auto scrollbar-none">
                      <BookingsTable key={`bookings-${currentBranch.id}`} />
                    </div>
                  </TabsContent>

                  <TabsContent value="courts" className="flex-1">
                    <div className="h-full overflow-auto scrollbar-none">
                      <CourtsTable key={`courts-${currentBranch.id}`} />
                    </div>
                  </TabsContent>

                  <TabsContent value="classes" className="flex-1">
                    <div className="h-full overflow-auto scrollbar-none">
                      <ClassesTable key={`classes-${currentBranch.id}`} />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 