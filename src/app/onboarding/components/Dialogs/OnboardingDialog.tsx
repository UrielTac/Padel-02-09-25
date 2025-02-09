'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

const stepContent = [
  {
    title: "Bienvenido a la sección de configuración",
    description: "Configura tu club de pádel en unos sencillos pasos y comienza a gestionar tus reservas y obtener tu link propio.",
    image: "/images/Dialog1.jpg"
  },
  {
    title: "Configura tus Sedes",
    description: "Añade los detalles de tu sedes, horarios y pistas disponibles para empezar a recibir reservas.",
    image: "/images/Dialog2.jpg"
  },
  {
    title: "Gestiona los Pagos",
    description: "Conecta tu cuenta bancaria y configura Stripe para procesar pagos de forma segura.",
    image: "/images/Dialog3.jpg"
  },
  {
    title: "¡Listo para Empezar!",
    description: "Una vez completada la configuración, podrás comenzar a utilizar tu link propio para recibir reservas",
    image: "/images/Dialog4.jpg"
  },
]

export function OnboardingDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = stepContent.length

  useEffect(() => {
    setIsOpen(true)
  }, [])

  const handleContinue = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  return (
    <Dialog 
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogContent 
        className="gap-0 p-0"
        showCloseButton={false}
      >
        <div className="p-2">
          <img 
            src={stepContent[step - 1].image}
            alt={stepContent[step - 1].title}
            className="w-full h-[216px] rounded-lg object-cover"
          />
        </div>
        <div className="space-y-6 px-6 pb-6 pt-3">
          <DialogHeader>
            <DialogTitle>{stepContent[step - 1].title}</DialogTitle>
            <DialogDescription>{stepContent[step - 1].description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5 max-sm:order-1">
              {[...Array(totalSteps)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-black",
                    index + 1 === step ? "bg-black" : "opacity-20"
                  )}
                />
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Omitir
              </Button>
              {step < totalSteps ? (
                <Button className="group" type="button" onClick={handleContinue}>
                  Siguiente
                  <ArrowRight
                    className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Button>
              ) : (
                <Button type="button" onClick={() => setIsOpen(false)}>Entendido</Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}