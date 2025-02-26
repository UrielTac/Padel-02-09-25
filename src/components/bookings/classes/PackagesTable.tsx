"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { usePackages } from "../hooks/usePackages"
import type { Database } from "@/types/supabase"
import { IconTrash, IconInfoCircle, IconEye, IconEyeOff } from "@tabler/icons-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { NewPackageModal } from "../components/NewPackageModal/NewPackageModal"
import { EditPackageModal } from "../components/NewPackageModal/EditPackageModal"
import { createSupabaseClient } from '@/lib/supabase'
import Image from "next/image"

const supabase = createSupabaseClient()

export function PackagesTable() {
  const [isNewPackageModalOpen, setIsNewPackageModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Database['public']['Tables']['packages']['Row'] | null>(null)
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({})
  
  const { 
    data: packages = [], 
    isLoading, 
    error, 
    updatePackageStatus,
    refetch: refetchPackages 
  } = usePackages({
    enabled: true
  })

  const handleDeletePackage = async (packageId: string) => {
    try {
      await updatePackageStatus(packageId, 'archived')
      setPopoverOpen(prev => ({ ...prev, [packageId]: false }))
      await refetchPackages()
    } catch (error: any) {
      // El error ya es manejado por updatePackageStatus
    }
  }

  const handlePackageClick = (packageItem: Database['public']['Tables']['packages']['Row']) => {
    setEditingPackage(packageItem)
  }

  // Renderizado condicional para estados de carga y error
  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="text-center py-10">
          <p className="text-gray-500">Cargando paquetes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="text-center py-10">
          <p className="text-red-500">Error al cargar los paquetes: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* Header de Paquetes - Actualizado */}
      <div className="space-y-6 bg-transparent p-4 rounded-lg shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-medium text-gray-800">Lista de Paquetes</h3>
              </div>
              <Button 
                onClick={() => setIsNewPackageModalOpen(true)}
                variant="outline"
                className="px-4 py-2 bg-white hover:bg-gray-50 rounded-md border border-gray-200"
              >
                Crear Paquete
              </Button>
            </div>
            <p className="text-xs text-gray-600">Administra los paquetes de sesiones para tus clientes y crea planes de suscripción a clases para una mejor experiencia.</p>
          </div>
        </div>

        {/* Lista de Paquetes */}
        <div className="space-y-3">
          {packages.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No hay paquetes registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map((packageItem) => (
                <div
                  key={packageItem.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    "bg-white hover:bg-gray-50",
                    "border border-gray-200 hover:border-gray-300",
                    "transition-all duration-200",
                    "cursor-pointer"
                  )}
                  onClick={() => handlePackageClick(packageItem)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-md font-medium text-gray-800">{packageItem.name}</h4>
                      {packageItem.tag && (
                        <span className="text-xs text-blue-800">
                          {packageItem.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {packageItem.class_count} {packageItem.class_count === 1 ? 'sesión' : 'sesiones'} • 
                      Expira en {packageItem.expiration_days} días • 
                      ${packageItem.price}
                    </p>
                  </div>

                  <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                    <Popover 
                      open={popoverOpen[packageItem.id]} 
                      onOpenChange={(open) => {
                        if (!open) setPopoverOpen(prev => ({ ...prev, [packageItem.id]: false }))
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          className="p-1.5 text-gray-500 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <IconEye className="w-4 h-4" />
                          <span className="sr-only">{packageItem.isActive ? 'Ocultar paquete' : 'Mostrar paquete'}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="end">
                        <div className="text-sm">
                          <p>¿Desea {packageItem.isActive ? 'ocultar' : 'mostrar'} este paquete?</p>
                          <p className="text-gray-500 text-xs mt-1">{packageItem.isActive ? 'El paquete no será visible para nuevos usuarios.' : 'El paquete volverá a estar visible para los usuarios.'}</p>
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updatePackageStatus(
                                    packageItem.id, 
                                    packageItem.isActive ? 'inactive' : 'active'
                                  )
                                  setPopoverOpen(prev => ({ ...prev, [packageItem.id]: false }))
                                } catch (error: any) {
                                  // El error ya es manejado por updatePackageStatus
                                }
                              }}
                            >
                              Confirmar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPopoverOpen(prev => ({ ...prev, [packageItem.id]: false }))}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <NewPackageModal
        isOpen={isNewPackageModalOpen}
        onClose={() => {
          setIsNewPackageModalOpen(false)
          refetchPackages()
        }}
      />

      {editingPackage && (
        <EditPackageModal
          isOpen={!!editingPackage}
          onClose={() => setEditingPackage(null)}
          packageData={editingPackage}
          onSuccess={() => {
            setEditingPackage(null)
            refetchPackages()
          }}
        />
      )}
    </div>
  )
}
