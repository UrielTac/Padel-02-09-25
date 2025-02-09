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
      {/* Header de Paquetes */}
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-900">Lista de Paquetes</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconInfoCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Gestiona los paquetes de sesiones disponibles</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button 
              onClick={() => setIsNewPackageModalOpen(true)}
              variant="outline"
              className="px-4 py-2 bg-white hover:bg-gray-50 rounded-md border border-gray-200"
            >
              Crear Paquete
            </Button>
          </div>
          <p className="text-sm text-gray-500">Administra los paquetes de sesiones para tus clientes</p>
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
                    "flex items-center justify-between p-4 rounded-lg",
                    "bg-white hover:bg-gray-50",
                    "border border-gray-200 hover:border-gray-300",
                    "transition-all duration-200",
                    "cursor-pointer"
                  )}
                  onClick={() => handlePackageClick(packageItem)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-medium text-gray-900">{packageItem.name}</h4>
                      {packageItem.tag && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {packageItem.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  packageItem.status === 'inactive' 
                                    ? "text-gray-600 hover:text-gray-700 hover:bg-gray-50" 
                                    : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                )}
                              >
                                {packageItem.status === 'inactive' ? (
                                  <IconEyeOff className="h-4 w-4" />
                                ) : (
                                  <IconEye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {packageItem.status === 'inactive' ? 'Mostrar paquete' : 'Ocultar paquete'}
                                </span>
                              </Button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{packageItem.status === 'inactive' ? 'Mostrar paquete' : 'Ocultar paquete'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <PopoverContent className="w-auto p-3" align="end">
                        <div className="text-sm">
                          <p>¿Desea {packageItem.status === 'inactive' ? 'mostrar' : 'ocultar'} este paquete?</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {packageItem.status === 'inactive' 
                              ? 'El paquete volverá a estar visible para los usuarios' 
                              : 'El paquete no será visible para nuevos usuarios pero se mantendrá activo para los usuarios actuales'}
                          </p>
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updatePackageStatus(
                                    packageItem.id, 
                                    packageItem.status === 'inactive' ? 'active' : 'inactive'
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

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="p-1.5 text-gray-500 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="end">
                        <div className="text-sm">
                          <p>¿Está seguro que desea eliminar este paquete?</p>
                          <p className="text-gray-500 text-xs mt-1">Esta acción no se puede deshacer</p>
                          <div className="flex justify-end gap-2 mt-2">
                            <button 
                              className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                              onClick={() => handleDeletePackage(packageItem.id)}
                            >
                              Eliminar
                            </button>
                            <button 
                              className="px-2 py-1 text-xs bg-gray-100 rounded-md hover:bg-gray-200"
                              onClick={() => setPopoverOpen(prev => ({ ...prev, [packageItem.id]: false }))}>
                              Cancelar
                            </button>
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
