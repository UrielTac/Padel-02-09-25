import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { IconCircleCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { ViewBookingModal } from '../ViewBookingModal/ViewBookingModal'
import { SelectedBooking } from '@/types/bookings'

export function BookingsTable() {
  const { toast } = useToast()
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking | null>(null)

  const handleCancelSuccess = () => {
    toast({
      title: "Reserva cancelada",
      description: (
        <div className="flex items-center gap-2">
          <IconCircleCheck className="h-4 w-4 text-green-600" />
          <span>La reserva ha sido cancelada exitosamente</span>
        </div>
      ),
      className: cn(
        "bg-white border-gray-200",
        "data-[state=open]:animate-in",
        "data-[state=closed]:animate-out",
        "data-[swipe=end]:animate-out",
        "data-[state=closed]:fade-out-80",
        "slide-in-from-right-full"
      ),
    })
  }

  return (
    <>
      {/* ... resto del código ... */}
      <ViewBookingModal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        setSelectedBooking={setSelectedBooking}
        onCancelSuccess={handleCancelSuccess}
      />
    </>
  )
} 