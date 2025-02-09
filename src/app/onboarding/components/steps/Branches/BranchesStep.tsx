'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { ArrowLeft, Check, Trash2, Plus, Phone } from "lucide-react"
import { useOnboarding } from "../../../context/OnboardingContext"
import { useState, useEffect } from "react"
import * as RPNInput from "react-phone-number-input"
import flags from "react-phone-number-input/flags"
import 'react-phone-number-input/style.css'
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
import { CourtsList, type CourtData } from "./components/CourtsList"
import { ScheduleList, type ScheduleData } from "./components/ScheduleList"
import { SectionTitle } from "@/components/ui/section-title"

// Variantes de animación
const fadeInVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
}

const buttonVariants = {
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: {
    scale: 0.98
  }
}

// Datos iniciales
const initialSchedule: ScheduleData = {
  monday: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  tuesday: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  wednesday: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  thursday: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  friday: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  saturday: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] },
  sunday: { enabled: true, ranges: [{ start: '09:00', end: '18:00' }] }
}

const daysTranslations: { [key: string]: string } = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

interface BranchesStepProps {
  onReturnToSelection: () => void
}

// Función auxiliar para validar una pista
const isCourtValid = (court: CourtData) => {
  return (
    court.name.trim() !== '' &&
    court.sports.length > 0 &&
    court.type !== '' &&
    court.characteristics.length > 0 &&
    court.durations.length > 0 &&
    court.prices.length > 0 &&
    court.prices.every(price => price.price !== '' && price.duration !== '')
  )
}

// Componentes del input de teléfono
const PhoneInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        className={cn("-ms-px rounded-s-none shadow-none focus-visible:z-10", className)}
        ref={ref}
        {...props}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: { label: string; value: RPNInput.Country | undefined }[];
};

const CountrySelect = ({ disabled, value, onChange, options }: CountrySelectProps) => {
  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as RPNInput.Country);
  };

  return (
    <div className="relative inline-flex items-center self-stretch rounded-s-lg border border-input bg-background py-2 pe-2 ps-3 text-muted-foreground transition-shadow focus-within:z-10 focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 hover:bg-accent hover:text-foreground has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
      <div className="inline-flex items-center gap-1" aria-hidden="true">
        <FlagComponent country={value} countryName={value} aria-hidden="true" />
      </div>
      <select
        disabled={disabled}
        value={value}
        onChange={handleSelect}
        className="absolute inset-0 text-sm opacity-0"
        aria-label="Select country"
      >
        <option key="default" value="">
          Seleccionar país
        </option>
        {options
          .filter((x) => x.value)
          .map((option, i) => (
            <option key={option.value ?? `empty-${i}`} value={option.value}>
              {option.label} {option.value && `+${RPNInput.getCountryCallingCode(option.value)}`}
            </option>
          ))}
      </select>
    </div>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="w-5 overflow-hidden rounded-sm">
      {Flag ? <Flag title={countryName} /> : <Phone size={16} aria-hidden="true" />}
    </span>
  );
};

export function BranchesStep({ onReturnToSelection }: BranchesStepProps) {
  const { completeAndAdvance, currentBranchId, updateBranchData, branches } = useOnboarding()
  const [isSuccess, setIsSuccess] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [formData, setFormData] = useState<BranchFormData>(() => {
    // Si hay un currentBranchId, buscar los datos guardados
    if (currentBranchId) {
      const branch = branches.find(b => b.id === currentBranchId)
      if (branch?.data) {
        return branch.data
      }
    }
    // Si no hay datos guardados, usar los valores iniciales
    return {
      name: '',
      address: '',
      phone: '',
      email: '',
      schedule: initialSchedule,
      courts: [{
        id: 'court-1',
        name: 'Pista 1',
        sports: [],
        type: '',
        characteristics: [],
        durations: ['60'],
        prices: [{
          duration: '60',
          price: '10',
          timeRanges: []
        }]
      }]
    }
  })

  // Efecto para actualizar el formulario cuando cambia la sede seleccionada
  useEffect(() => {
    if (currentBranchId) {
      const branch = branches.find(b => b.id === currentBranchId)
      if (branch?.data) {
        setFormData(branch.data)
      }
    }
  }, [currentBranchId, branches])

  // Manejadores de eventos
  const handleInputChange = (field: keyof BranchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleScheduleChange = (day: string, field: string, value: string, rangeIndex: number = 0) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          ranges: prev.schedule[day].ranges.map((range, idx) => 
            idx === rangeIndex 
              ? { ...range, [field]: value }
              : range
          )
        }
      }
    }))
  }

  const addSecondRange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          ranges: [...prev.schedule[day].ranges, { start: '16:00', end: '22:00' }]
        }
      }
    }))
  }

  const removeSecondRange = (day: string, rangeIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          ranges: prev.schedule[day].ranges.filter((_, idx) => idx !== rangeIndex)
        }
      }
    }))
  }

  // Función para validar el formulario completo
  const isFormValid = () => {
    const basicInfoValid = 
      formData.name.trim() !== '' &&
      formData.address.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.email.trim() !== ''

    const hasValidCourt = formData.courts.some(isCourtValid)

    return basicInfoValid && hasValidCourt
  }

  const handleSave = () => {
    if (currentBranchId && isFormValid()) {
      updateBranchData(currentBranchId, formData)
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onReturnToSelection()
      }, 2000)
    }
  }

  // Función para verificar si hay cambios sin guardar
  const hasUnsavedChanges = () => {
    if (!currentBranchId) return false
    
    const currentBranch = branches.find(b => b.id === currentBranchId)
    if (!currentBranch?.data) return formData.name !== '' || formData.address !== '' || formData.phone !== '' || formData.email !== ''
    
    return JSON.stringify(currentBranch.data) !== JSON.stringify(formData)
  }

  const handleReturn = () => {
    if (hasUnsavedChanges()) {
      setShowExitDialog(true)
    } else {
      onReturnToSelection()
    }
  }

  return (
    <motion.div
      className="p-6"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInVariants}
    >
      <div className="relative">
        <div className="max-w-5xl mx-auto w-full px-8 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReturn}
            className="text-gray-600 hover:text-gray-900 -ml-2 h-8 text-sm"
          >
            Volver
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent" />
      </div>

      <div className={cn(
        "max-w-5xl mx-auto flex-1 overflow-y-auto px-8",
        "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
        "scrollbar-thumb-rounded-md hover:scrollbar-thumb-gray-400"
      )}>
        <div className="space-y-2 mb-0">
          <h2 className="text-xl font-medium">Información de la sede</h2>
          <p className="text-sm text-gray-500">
            Completa los datos básicos de tu sede
          </p>
        </div>

        {/* Formulario */}
        <div className="space-y-8 py-8">
          {/* Campos del formulario */}
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-sm">Nombre de la sede</Label>
              <Input
                id="name"
                placeholder="Ej: Club Deportivo Central"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="address" className="text-sm">Dirección</Label>
              <Input
                id="address"
                placeholder="Ej: Calle Principal 123"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="phone" className="text-sm">Teléfono</Label>
                <RPNInput.default
                  className="flex rounded-lg shadow-sm shadow-black/5"
                  international
                  flagComponent={FlagComponent}
                  countrySelectComponent={CountrySelect}
                  inputComponent={PhoneInput}
                  id="phone"
                  placeholder="Ingresa el número de teléfono"
                  value={formData.phone}
                  onChange={(value: string | undefined) => handleInputChange('phone', value || '')}
                  defaultCountry="ES"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: sede@club.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Horarios */}
          <ScheduleList 
            schedule={formData.schedule}
            onScheduleChange={(schedule) => setFormData(prev => ({ ...prev, schedule }))}
          />

          {/* Pistas */}
          <CourtsList 
            courts={formData.courts}
            onCourtsChange={(courts) => setFormData(prev => ({ ...prev, courts }))}
          />

          {/* Botón de guardar */}
          <div className="flex justify-end gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handleReturn}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Button
              onClick={handleSave}
              className="gap-2"
              disabled={!currentBranchId || !isFormValid()}
            >
              <Check className="h-4 w-4" />
              Guardar Sede
            </Button>
          </div>

          {/* Mensaje de validación */}
          {!isFormValid() && (
            <p className="text-sm text-red-500 mt-2">
              * Debes completar todos los campos obligatorios y configurar al menos una pista correctamente.
            </p>
          )}

          {/* Diálogo de confirmación de salida */}
          <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de salir?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tienes cambios sin guardar. Si sales ahora, perderás todos los cambios realizados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowExitDialog(false)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowExitDialog(false)
                    onReturnToSelection()
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Salir sin guardar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Mensaje de éxito */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg"
            >
              ¡Sede guardada con éxito!
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
} 