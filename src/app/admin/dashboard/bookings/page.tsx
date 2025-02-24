"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BookingsTable } from "@/components/bookings/BookingsTable"
import { CourtsTable } from "@/components/bookings/CourtsTable"
import { ClassesTable } from "@/components/bookings/classes/ClassesTable"
import { useAuth } from "@/contexts/AuthContext"
import { useBranchContext } from "@/contexts/BranchContext"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

function LoadingState() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )
}

function NoSessionState() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500">No hay sesión activa</p>
      </div>
    </div>
  )
}

function NoBranchState() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500">No hay una sede seleccionada</p>
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const { isLoading: isLoadingAuth, user } = useAuth()
  const { isLoading: isLoadingBranch, currentBranch } = useBranchContext()
  
  const isLoading = isLoadingAuth || isLoadingBranch

  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      <main className="absolute inset-0 lg:left-[240px]">
        <div className="absolute inset-[8px]">
          <div className="bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] w-full h-full overflow-auto scrollbar-none">
            <div className="px-6 py-4">
              {isLoading ? (
                <LoadingState />
              ) : !user ? (
                <NoSessionState />
              ) : !currentBranch ? (
                <NoBranchState />
              ) : (
                <div className="px-6 py-4">
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
                        <Suspense fallback={<LoadingState />}>
                          <BookingsTable key={`bookings-${currentBranch.id}`} />
                        </Suspense>
                      </div>
                    </TabsContent>

                    <TabsContent value="courts" className="flex-1">
                      <div className="h-full overflow-auto scrollbar-none">
                        <Suspense fallback={<LoadingState />}>
                          <CourtsTable key={`courts-${currentBranch.id}`} />
                        </Suspense>
                      </div>
                    </TabsContent>

                    <TabsContent value="classes" className="flex-1">
                      <div className="h-full overflow-auto scrollbar-none">
                        <Suspense fallback={<LoadingState />}>
                          <ClassesTable key={`classes-${currentBranch.id}`} />
                        </Suspense>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 