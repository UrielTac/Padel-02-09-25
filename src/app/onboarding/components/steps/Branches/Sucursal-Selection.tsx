'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, PenLine, HelpCircle, Trash2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Branch {
  id: string
  name: string
  courts: number
  schedule: {
    open: string
    close: string
  }
  data?: {
    name: string
    address: string
    phone: string
    email: string
    courts: any[]
  }
}

interface SucursalSelectionProps {
  onNext: () => void
  onConfigureBranch: () => void
}

export function SucursalSelection({ onNext, onConfigureBranch }: SucursalSelectionProps) {
  const { completeAndAdvance, branches, setBranches, setCurrentBranchId } = useOnboarding()
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)

  const hasConfiguredBranch = branches.some(branch => branch.data !== undefined)

  const handleAddBranch = () => {
    if (branches.length < 5) {
      const newBranch = {
        id: crypto.randomUUID(),
        name: `Sede ${branches.length + 1}`,
        courts: 2,
        schedule: {
          open: '08:00',
          close: '21:00'
        }
      }
      setBranches([...branches, newBranch])
    }
  }

  const handleDeleteBranch = (branch: Branch) => {
    setBranchToDelete(branch)
  }

  const confirmDelete = () => {
    if (branchToDelete) {
      setBranches(branches.filter(b => b.id !== branchToDelete.id))
      setBranchToDelete(null)
    }
  }

  const handleConfigureBranch = (branchId: string) => {
    setCurrentBranchId(branchId)
    onConfigureBranch()
  }

  const handleContinue = () => {
    if (hasConfiguredBranch) {
      completeAndAdvance(1)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Título y subtítulo */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Configura tus Sucursales
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-0 h-auto hover:bg-transparent"
                >
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Aquí puedes agregar y configurar las diferentes sedes de tu club. Cada sede puede tener sus propias pistas y configuraciones.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Agrega y gestiona las sucursales de tu empresa
        </p>
      </div>

      {/* Contenedor de sucursales */}
      <div className="space-y-4">
        <AnimatePresence>
          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden hover:border-black hover:border transition-all duration-200">
                <div className="p-6 flex justify-between items-center">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      {branch.data?.name || branch.name}
                    </h3>
                    <div className="space-y-1">
                      {branch.data ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {branch.data.courts.length} {branch.data.courts.length === 1 ? 'pista' : 'pistas'} configuradas
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {branch.data.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {branch.data.phone} · {branch.data.email}
                          </p>
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Configuración guardada
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Sede sin configurar
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleConfigureBranch(branch.id)}
                    >
                      <PenLine className="h-4 w-4" />
                      {branch.data ? 'Editar' : 'Configurar'}
                    </Button>
                    {branches.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteBranch(branch)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Botón de agregar sede */}
        {branches.length < 5 && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 w-full justify-center py-6 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
              onClick={handleAddBranch}
            >
              <Plus className="h-4 w-4" />
              Agregar nueva sede
            </Button>
          </motion.div>
        )}
      </div>

      {/* Botón de continuar y mensaje de validación */}
      <div className="pt-4">
        {!hasConfiguredBranch && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 mb-2"
          >
            * Debes configurar al menos una sede antes de continuar
          </motion.p>
        )}
        <div className="flex justify-end">
          <Button 
            onClick={handleContinue} 
            className="px-8"
            disabled={!hasConfiguredBranch}
          >
            Continuar
          </Button>
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={branchToDelete !== null} onOpenChange={() => setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la sede "{branchToDelete?.name}" y no se puede deshacer.
              Todos los datos asociados a esta sede se perderán permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBranchToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
