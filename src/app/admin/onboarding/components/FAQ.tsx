import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqItems = [
  {
    question: "¿Cómo reservaran mis clientes?",
    answer: "Los clientes podrán reservar las pistas disponibles en tu sede directamente desde el link que te proporcionaremos al finalizar el onboarding."
  },
  {
    question: "¿Cómo funciona el sistema de pagos?",
    answer: "El sistema de pagos se integra con Stripe para procesar pagos con tarjeta y también permite conexión directa con tu cuenta bancaria para transferencias."
  },
  {
    question: "¿Puedo tener múltiples sedes?",
    answer: "Sí, puedes configurar tantas sedes como necesites. Cada sede puede tener sus propios horarios, pistas y configuraciones específicas."
  },
  {
    question: "¿Cómo gestiono las reservas?",
    answer: "Las reservas se gestionan desde el panel de control. Podrás ver, confirmar y cancelar reservas, así como gestionar el calendario de disponibilidad."
  },
  {
    question: "¿Puedo utilziar el programa de manera gratuita?",
    answer: "Sí, puedes utilizar el programa de manera gratuita sin limites de tiempo."
  },
  {
    question: "¿Puedo actualizar los precios de mis pistas?",
    answer: "Sí, puedes actualizar los precios de tus pistas en cualquier momento desde el panel de control."
  },
  {
    question: "¿Puedo cambiar mi plan?",
    answer: "Sí, puedes cambiar tu plan en cualquier momento desde el panel de control. Los cambios se aplicarán en tu próxima facturación."
  },
  {
    question: "¿Cómo me comunico con el soporte?",
    answer: "Puedes comunicarte con el soporte a través de nuestro correo electrónico (info@pistas.es)"
  }
]

interface FAQDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FAQDialog({ open, onOpenChange }: FAQDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Preguntas frecuentes</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-6 max-h-[60vh]">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-sm">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  )
} 