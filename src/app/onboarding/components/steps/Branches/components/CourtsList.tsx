import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SingleSelect } from "@/components/ui/single-select"
import { MultiSelect } from "@/components/ui/multi-select"
import { cn } from "@/lib/utils"
import { Trash2, Check, HelpCircle, Plus, ChevronDown, PlusCircle } from "lucide-react"
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
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SectionTitle } from "@/components/ui/section-title"

// Tipos
export interface TimeRange {
  day: string
  start: string
  end: string
  percentage: string
}

export interface CourtPrice {
  duration: string
  price: string
  dayPrices?: DayPrice[]
  timeRanges?: TimeRange[]
}

export interface CourtData {
  id: string
  name: string
  sports: string[]
  type: string
  characteristics: string[]
  durations: string[]
  prices: CourtPrice[]
}

interface DayPrice {
  day: string
  timeRanges: TimeRange[]
}

// Opciones
const sportOptions = [
  { id: "padel", name: "Padel" },
  { id: "tenis", name: "Tenis" },
  { id: "badminton", name: "Badminton" },
  { id: "squash", name: "Squash" },
  { id: "pickleball", name: "Pickleball" }
]

const courtTypeOptions = [
  { id: "interior", name: "Interior" },
  { id: "exterior", name: "Exterior" },
  { id: "cubierta", name: "Cubierta" }
]

const durationOptions = [
  { id: '60', name: '60min' },
  { id: '90', name: '90min' },
  { id: '120', name: '120min' },
]

const characteristicsOptions = [
  { id: 'cristal-estandar', name: 'Cristal Estándar' },
  { id: 'cristal-panoramico', name: 'Cristal Panorámico' },
  { id: 'muro-hormigon', name: 'Muro de Hormigón' },
  { id: 'cesped-sintetico', name: 'Césped Sintético' },
  { id: 'tierra-batida', name: 'Tierra Batida' },
  { id: 'hormigon-pulido', name: 'Hormigón Pulido' },
  { id: 'goma-profesional', name: 'Goma Profesional' }
]

export const daysTranslations: { [key: string]: string } = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

// Función auxiliar para obtener el texto de las opciones seleccionadas
const getSelectedOptionsLabel = (selectedIds: string[], options: { id: string, name: string }[]) => {
  if (selectedIds.length === 0) return ""
  const selectedNames = selectedIds.map(id => options.find(opt => opt.id === id)?.name).filter(Boolean)
  return selectedNames.join(", ")
}

interface CourtsListProps {
  courts: CourtData[]
  onCourtsChange: (courts: CourtData[]) => void
}

export function CourtsList({ courts, onCourtsChange }: CourtsListProps) {
  const [openCourtId, setOpenCourtId] = useState<string | null>(null)
  const [showAddCourtDialog, setShowAddCourtDialog] = useState(false)
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [customDuration, setCustomDuration] = useState('')
  const [currentCourtId, setCurrentCourtId] = useState<string | null>(null)

  // Manejadores de eventos
  const handleAddCourt = () => {
    const newCourt: CourtData = {
      id: `court-${courts.length + 1}`,
      name: `Pista ${courts.length + 1}`,
      sports: [],
      type: '',
      characteristics: [],
      durations: ['60'],
      prices: [{
        duration: '60',
        price: '10',
        timeRanges: []
      }]
    }
    onCourtsChange([...courts, newCourt])
    setShowAddCourtDialog(false)
  }

  const handleCopyPreviousCourt = () => {
    if (courts.length > 0) {
      const lastCourt = courts[courts.length - 1]
      const newCourt = {
        ...JSON.parse(JSON.stringify(lastCourt)),
        id: `court-${courts.length + 1}`,
        name: `Pista ${courts.length + 1}`
      }
      onCourtsChange([...courts, newCourt])
    }
    setShowAddCourtDialog(false)
  }

  const handleRemoveCourt = (courtId: string) => {
    if (courts.length <= 1) return
    onCourtsChange(courts.filter(court => court.id !== courtId))
  }

  const handleCourtChange = (courtId: string, field: keyof CourtData, value: any) => {
    if (field === 'durations') {
      const newDurations = value as string[]
      const court = courts.find(c => c.id === courtId)
      
      // Si no hay duraciones, mantener al menos una
      if (newDurations.length === 0) {
        newDurations.push('60')
      }

      // Crear un mapa de los precios existentes
      const existingPrices = court?.prices.reduce((acc, price) => {
        acc[price.duration] = price
        return acc
      }, {} as Record<string, CourtPrice>) || {}

      // Crear los nuevos precios manteniendo los existentes
      const updatedPrices = newDurations.map(duration => ({
        duration,
        price: existingPrices[duration]?.price || '10',
        timeRanges: existingPrices[duration]?.timeRanges || []
      }))

      onCourtsChange(courts.map(court => 
        court.id === courtId 
          ? {
              ...court,
              durations: newDurations,
              prices: updatedPrices
            }
          : court
      ))
    } else {
      onCourtsChange(courts.map(court => 
        court.id === courtId 
          ? { 
              ...court, 
              [field]: value
            }
          : court
      ))
    }
  }

  const handlePriceChange = (courtId: string, duration: string, price: string) => {
    onCourtsChange(courts.map(court => 
      court.id === courtId 
        ? {
            ...court,
            prices: court.prices.some(p => p.duration === duration)
              ? court.prices.map(p => p.duration === duration ? { ...p, price } : p)
              : [...court.prices, { duration, price }]
          }
        : court
    ))
  }

  const handleTimeRangeChange = (
    courtId: string, 
    durationId: string, 
    index: number, 
    updatedRange: TimeRange
  ) => {
    onCourtsChange(courts.map(court => 
      court.id === courtId 
        ? {
            ...court,
            prices: court.prices.map(price => 
              price.duration === durationId
                ? {
                    ...price,
                    timeRanges: (price.timeRanges || []).map((range, i) => 
                      i === index ? updatedRange : range
                    )
                  }
                : price
            )
          }
        : court
    ))
  }

  const handleTimeRangeAdd = (courtId: string, durationId: string, newRange: TimeRange) => {
    onCourtsChange(courts.map(court => 
      court.id === courtId 
        ? {
            ...court,
            prices: court.prices.map(price => 
              price.duration === durationId
                ? {
                    ...price,
                    timeRanges: [...(price.timeRanges || []), {
                      ...newRange,
                      percentage: '-10'
                    }]
                  }
                : price
            )
          }
        : court
    ))
  }

  const handleTimeRangeRemove = (courtId: string, durationId: string, index: number) => {
    onCourtsChange(courts.map(court => 
      court.id === courtId 
        ? {
            ...court,
            prices: court.prices.map(price => 
              price.duration === durationId
                ? {
                    ...price,
                    timeRanges: (price.timeRanges || []).filter((_, i) => i !== index)
                  }
                : price
            )
          }
        : court
    ))
  }

  const handleAddCustomDuration = (courtId: string) => {
    if (customDuration && parseInt(customDuration) > 0) {
      const newDurationId = customDuration
      const court = courts.find(c => c.id === courtId)
      
      if (court) {
        const currentDurations = [...court.durations]
        
        if (!currentDurations.includes(newDurationId)) {
          // Crear un mapa de los precios existentes
          const existingPrices = court.prices.reduce((acc, price) => {
            acc[price.duration] = price
            return acc
          }, {} as Record<string, CourtPrice>)

          // Agregar la nueva duración
          const updatedDurations = [...currentDurations, newDurationId]
          
          // Actualizar los precios manteniendo los existentes y agregando el nuevo
          const updatedPrices = updatedDurations.map(duration => ({
            duration,
            price: existingPrices[duration]?.price || '10',
            timeRanges: existingPrices[duration]?.timeRanges || []
          }))

          // Actualizar el estado
          onCourtsChange(courts.map(c => 
            c.id === courtId 
              ? {
                  ...c,
                  durations: updatedDurations,
                  prices: updatedPrices
                }
              : c
          ))
        }
      }
      
      // Limpiar el estado
      setCustomDuration('')
      setShowCustomDuration(false)
      setCurrentCourtId(null)
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Pistas"
        subtitle="Configura las pistas disponibles en esta sede"
        tooltip="Agrega y configura las pistas de tu sede. Puedes especificar tipos de pista, deportes disponibles y establecer precios según la duración y horarios."
      />
      <div className="space-y-6">
        {courts.map((court, index) => (
          <Collapsible 
            key={court.id}
            open={openCourtId === court.id}
            onOpenChange={(open) => {
              setOpenCourtId(open ? court.id : null)
            }}
          >
            <div className="border rounded-lg bg-white">
              <div className={cn(
                "flex items-center justify-between p-4",
                "hover:bg-gray-50/50 transition-colors",
                "border-b border-transparent",
                "data-[state=open]:border-gray-100"
              )}>
                <div className="flex items-center gap-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                      <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <div>
                    <h4 className="text-sm font-medium">{court.name}</h4>
                    <p className="text-xs text-gray-500">
                      {court.sports.length} deportes · {court.durations.length} duraciones
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCourt(court.id)}
                  className={cn(
                    "shrink-0",
                    index === 0 && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={index === 0}
                  title={index === 0 ? "No se puede eliminar la pista principal" : "Eliminar pista"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CollapsibleContent>
                <div className="p-6 animate-in fade-in-0 duration-200">
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Nombre de la pista</Label>
                        {index === 0 && (
                          <span className="text-xs text-gray-500 italic">
                            Pista principal (no se puede eliminar)
                          </span>
                        )}
                      </div>
                      <Input
                        value={court.name}
                        onChange={(e) => handleCourtChange(court.id, 'name', e.target.value)}
                        placeholder="Ej: Pista Central"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <Label>Deportes disponibles</Label>
                        <MultiSelect
                          value={court.sports}
                          onChange={(values) => handleCourtChange(court.id, 'sports', values)}
                          options={sportOptions}
                          placeholder={court.sports.length === 0 
                            ? "Seleccionar deportes" 
                            : getSelectedOptionsLabel(court.sports, sportOptions)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Tipo de pista</Label>
                        <SingleSelect
                          value={court.type}
                          onChange={(value) => handleCourtChange(court.id, 'type', value)}
                          options={courtTypeOptions}
                          placeholder="Seleccionar tipo"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Características de la Pista</Label>
                      <MultiSelect
                        value={court.characteristics}
                        onChange={(values) => handleCourtChange(court.id, 'characteristics', values)}
                        options={characteristicsOptions}
                        placeholder={court.characteristics.length === 0 
                          ? "Seleccionar características" 
                          : getSelectedOptionsLabel(court.characteristics, characteristicsOptions)}
                      />
                    </div>

                    {/* Duraciones disponibles */}
                    <div className="grid gap-2">
                      <Label>Duraciones disponibles</Label>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {durationOptions.map((duration) => (
                            <button
                              key={duration.id}
                              type="button"
                              onClick={() => {
                                const currentDurations = court.durations || []
                                if (currentDurations.includes(duration.id) && currentDurations.length <= 1) {
                                  return
                                }
                                const newDurations = currentDurations.includes(duration.id)
                                  ? currentDurations.filter(d => d !== duration.id)
                                  : [...currentDurations, duration.id]
                                handleCourtChange(court.id, 'durations', newDurations)
                              }}
                              className={cn(
                                "min-w-[80px] px-3 py-1.5 text-sm rounded-md",
                                "border transition-colors duration-200",
                                court.durations?.includes(duration.id)
                                  ? "bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200"
                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
                                court.durations?.includes(duration.id) && court.durations?.length === 1 && "cursor-not-allowed opacity-50"
                              )}
                            >
                              {duration.name}
                            </button>
                          ))}

                          {/* Duraciones personalizadas */}
                          {court.durations?.map((durationId) => {
                            if (durationOptions.find(d => d.id === durationId)) return null
                            return (
                              <button
                                key={durationId}
                                type="button"
                                onClick={() => {
                                  if (court.durations?.length <= 1) {
                                    return
                                  }
                                  const newDurations = court.durations?.filter(d => d !== durationId) || []
                                  handleCourtChange(court.id, 'durations', newDurations)
                                }}
                                className={cn(
                                  "min-w-[80px] px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200",
                                  court.durations?.length === 1 && "cursor-not-allowed opacity-50"
                                )}
                              >
                                {durationId}min
                              </button>
                            )
                          })}

                          {/* Botón para mostrar input de duración personalizada */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCustomDuration(true)
                              setCurrentCourtId(court.id)
                            }}
                            className={cn(
                              "flex items-center gap-1",
                              showCustomDuration && currentCourtId === court.id && "hidden"
                            )}
                          >
                            <PlusCircle className="h-4 w-4" />
                            <span>Personalizada</span>
                          </Button>
                        </div>

                        {/* Input para duración personalizada */}
                        {showCustomDuration && currentCourtId === court.id && (
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-[200px]">
                              <Input
                                type="number"
                                min="1"
                                placeholder="Duración en minutos"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                                className="pr-12"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                min
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAddCustomDuration(court.id)}
                            >
                              Agregar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowCustomDuration(false)
                                setCustomDuration('')
                                setCurrentCourtId(null)
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Precios específicos */}
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          Precios específicos
                          <span className="text-xs text-gray-500">(por duración)</span>
                        </Label>
                        <div className="min-h-[120px]">
                          {court.durations?.map((durationId) => {
                            const duration = durationOptions.find(d => d.id === durationId)
                            const specificPrice = court.prices?.find(p => p.duration === durationId)
                            
                            return (
                              <div key={durationId} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600 w-12">
                                    {duration?.name || `${durationId}min`}
                                  </span>
                                  <div className="relative flex-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={specificPrice?.price || ''}
                                      onChange={(e) => handlePriceChange(court.id, durationId, e.target.value)}
                                      className="pl-7"
                                    />
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                                  </div>
                                </div>

                                {/* Precios por día y rango horario */}
                                <div className="pl-8 mt-1.5 border-l border-dashed border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-[11px] px-0 text-gray-400 hover:text-gray-600"
                                      onClick={() => {
                                        const newTimeRange = {
                                          day: 'monday',
                                          start: '09:00',
                                          end: '22:00',
                                          percentage: '-10'
                                        }
                                        handleTimeRangeAdd(court.id, durationId, newTimeRange)
                                      }}
                                    >
                                      + Agregar precio especial
                                    </Button>
                                  </div>

                                  <div className="space-y-2 mt-1">
                                    {specificPrice?.timeRanges?.map((range, index) => {
                                      const basePrice = parseFloat(specificPrice.price || '0')
                                      const percentage = parseFloat(range.percentage || '0')
                                      const finalPrice = basePrice + (basePrice * (percentage / 100))
                                      
                                      return (
                                        <div key={index} className="relative space-y-1 pb-2">
                                          <div className="flex items-center gap-1.5">
                                            <div className="w-[120px]">
                                              <SingleSelect
                                                value={range.day}
                                                onChange={(value) => handleTimeRangeChange(court.id, durationId, index, { ...range, day: value })}
                                                options={Object.entries(daysTranslations).map(([key, name]) => ({ id: key, name }))}
                                                placeholder="Día"
                                                size="xs"
                                              />
                                            </div>

                                            <Input
                                              type="time"
                                              value={range.start}
                                              onChange={(e) => handleTimeRangeChange(court.id, durationId, index, { ...range, start: e.target.value })}
                                              className="w-20 h-8 text-[11px]"
                                            />
                                            <span className="text-[11px] text-gray-400">a</span>
                                            <Input
                                              type="time"
                                              value={range.end}
                                              onChange={(e) => handleTimeRangeChange(court.id, durationId, index, { ...range, end: e.target.value })}
                                              className="w-20 h-8 text-[11px]"
                                            />

                                            <div className="relative w-16">
                                              <Input
                                                type="text"
                                                placeholder="-10"
                                                value={range.percentage}
                                                onChange={(e) => {
                                                  const value = e.target.value.replace(/[^\d-]/g, '')
                                                  handleTimeRangeChange(court.id, durationId, index, { ...range, percentage: value })
                                                }}
                                                className="pl-2 pr-5 h-8 text-[11px] text-right"
                                              />
                                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-[11px]">%</span>
                                            </div>

                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                              onClick={() => handleTimeRangeRemove(court.id, durationId, index)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <div className="pl-1">
                                            <p className="text-[12px] text-gray-500">
                                              {daysTranslations[range.day].toLowerCase()} {range.start}-{range.end}: {finalPrice.toFixed(2)}€ ({percentage < 0 ? '-' : '+'}{Math.abs(percentage)}%)
                                            </p>
                                          </div>
                                          {index < (specificPrice?.timeRanges?.length ?? 0) - 1 && (
                                            <div className="absolute bottom-0 left-0 right-0 border-b border-dashed border-gray-100" />
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        <Button
          variant="outline"
          onClick={() => setShowAddCourtDialog(true)}
          className="w-full"
        >
          Añadir pista
        </Button>
      </div>

      {/* Diálogo para añadir pista */}
      <AlertDialog open={showAddCourtDialog} onOpenChange={setShowAddCourtDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Añadir nueva pista</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona cómo quieres añadir la nueva pista
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleAddCourt}
              className="w-full sm:w-auto"
            >
              Nueva pista
            </Button>
            <Button
              onClick={handleCopyPreviousCourt}
              className="w-full sm:w-auto bg-black hover:bg-black/90 text-white"
              disabled={courts.length === 0}
            >
              Copiar última pista
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 