"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TimeSelector } from "@/components/ui/time-selector"
import { IconPlus, IconTrash, IconLoader, IconBuilding, IconClock, IconMapPin, IconPhone } from "@tabler/icons-react"
import { Branch, BranchFormData } from "@/types/branch"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface EditBranchModalProps {
  branch: Branch | null
  isOpen: boolean
  onClose: () => void
  onSave: (branchId: string, data: BranchFormData) => void
}

const DAYS = [
  { id: 'monday', label: 'Lunes' },
  { id: 'tuesday', label: 'Martes' },
  { id: 'wednesday', label: 'Miércoles' },
  { id: 'thursday', label: 'Jueves' },
  { id: 'friday', label: 'Viernes' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' }
]

export function EditBranchModal({ branch, isOpen, onClose, onSave }: EditBranchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    address: '',
    phone: '',
    manager: '',
    isActive: true,
    schedule: DAYS.map(day => ({
      day: day.id,
      isOpen: true,
      timeRanges: [{
        openTime: '08:00',
        closeTime: '22:00'
      }]
    }))
  })

  // Cargar datos de la sede cuando se abre el modal
  useEffect(() => {
    if (branch) {
      const schedule = DAYS.map(day => {
        const daySchedule = branch.opening_hours[day.id]
        return {
          day: day.id,
          isOpen: daySchedule?.isOpen ?? false,
          timeRanges: daySchedule?.timeRanges ?? [{
            openTime: '08:00',
            closeTime: '22:00'
          }]
        }
      })

      setFormData({
        name: branch.name,
        address: branch.address || '',
        phone: branch.phone || '',
        manager: branch.manager_id || '',
        isActive: branch.is_active,
        schedule
      })
    }
  }, [branch])

  const handleSave = async () => {
    if (!branch) return

    try {
      setIsSubmitting(true)
      await onSave(branch.id, formData)
      toast({
        title: "Sede actualizada",
        description: "Los cambios se han guardado correctamente",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!branch) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-white overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="divide-y divide-gray-100"
        >
          <DialogHeader className="p-6 bg-white sticky top-0 z-10">
            <DialogTitle className="text-xl font-semibold">
              Editar Sede
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
            <Accordion type="single" collapsible defaultValue="details" className="space-y-4">
              {/* Información General */}
              <AccordionItem value="details" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:text-black">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <IconBuilding className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Información General</h3>
                      <p className="text-sm text-gray-500">Datos básicos de la sede</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre de la sede</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Sede Principal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Ej: Av. Principal #123"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Ej: +34 600 000 000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manager">Encargado</Label>
                      <Input
                        id="manager"
                        value={formData.manager || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                        placeholder="Ej: Juan Pérez"
                      />
                      <p className="text-xs text-gray-500">
                        Persona responsable de la gestión de esta sede
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Estado</Label>
                        <div className="text-sm text-gray-500">
                          Determina si la sede está activa
                        </div>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Horarios */}
              <AccordionItem value="schedule" className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:text-black">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <IconClock className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Horarios</h3>
                      <p className="text-sm text-gray-500">Configuración de horarios por día</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4 pt-4">
                    {formData.schedule.map((daySchedule, dayIndex) => (
                      <div
                        key={daySchedule.day}
                        className="p-4 rounded-lg border bg-white space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>{DAYS.find(d => d.id === daySchedule.day)?.label}</Label>
                            <div className="text-sm text-gray-500">
                              Configura los horarios para este día
                            </div>
                          </div>
                          <Switch
                            checked={daySchedule.isOpen}
                            onCheckedChange={(checked) => {
                              const newSchedule = [...formData.schedule]
                              newSchedule[dayIndex].isOpen = checked
                              setFormData(prev => ({ ...prev, schedule: newSchedule }))
                            }}
                          />
                        </div>

                        {daySchedule.isOpen && (
                          <div className="space-y-3 pl-6">
                            {daySchedule.timeRanges.map((timeRange, rangeIndex) => (
                              <div key={rangeIndex} className="flex items-center gap-3">
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-gray-500">Apertura</Label>
                                    <TimeSelector
                                      value={timeRange.openTime}
                                      onChange={(time) => {
                                        const newSchedule = [...formData.schedule]
                                        newSchedule[dayIndex].timeRanges[rangeIndex].openTime = time
                                        setFormData(prev => ({ ...prev, schedule: newSchedule }))
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-gray-500">Cierre</Label>
                                    <TimeSelector
                                      value={timeRange.closeTime}
                                      onChange={(time) => {
                                        const newSchedule = [...formData.schedule]
                                        newSchedule[dayIndex].timeRanges[rangeIndex].closeTime = time
                                        setFormData(prev => ({ ...prev, schedule: newSchedule }))
                                      }}
                                    />
                                  </div>
                                </div>

                                {daySchedule.timeRanges.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newSchedule = [...formData.schedule]
                                      newSchedule[dayIndex].timeRanges.splice(rangeIndex, 1)
                                      setFormData(prev => ({ ...prev, schedule: newSchedule }))
                                    }}
                                    className="h-9 w-9 text-gray-400 hover:text-red-500"
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newSchedule = [...formData.schedule]
                                newSchedule[dayIndex].timeRanges.push({
                                  openTime: '08:00',
                                  closeTime: '22:00'
                                })
                                setFormData(prev => ({ ...prev, schedule: newSchedule }))
                              }}
                              className="w-full"
                            >
                              <IconPlus className="h-4 w-4 mr-2" />
                              Agregar horario
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="p-6 bg-gray-50 sticky bottom-0 z-10">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !formData.name || !formData.address || !formData.phone}
                className="min-w-[100px] bg-black hover:bg-gray-800 text-white"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 