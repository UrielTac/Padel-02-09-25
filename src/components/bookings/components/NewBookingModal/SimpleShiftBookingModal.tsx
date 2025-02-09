import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { SimpleShiftBooking } from "./SimpleShiftBooking"
import { ModalHeader } from "./components/ModalHeader"
import { ModalFooter } from "./components/ModalFooter"
import { useBookingState } from "./hooks/useBookingState"
import { bookingService } from "@/services/bookingService"
import { useDateContext } from "@/contexts/DateContext"
import { useBranchContext } from "@/contexts/BranchContext"
import { useCourts } from "@/hooks/useCourts"
import { useItems } from "@/hooks/useItems"
import { timeToMinutes } from "@/lib/time-utils"
import { toast } from "sonner"
import type { 
  Selection, 
  BookingStep, 
  BookingCreationData, 
  Court, 
  RentalItem, 
  Participant,
  PaymentMethodEnum,
  PaymentStatusEnum 
} from "@/types/bookings"
import type { RentalSelection } from "@/types/items"
import { useQueryClient } from '@tanstack/react-query'
import { useRentalContext } from "@/contexts/RentalContext"

interface TimeSelection {
  startTime: string
  endTime: string
}

interface BookingParticipant extends Participant {
  firstName?: string
  lastName?: string
}

interface SimpleShiftBookingProps {
  currentStep: BookingStep
  selectedCourts: string[]
  timeSelection?: TimeSelection
  onCourtSelect: (courts: string[]) => void
  onTimeSelect: (time: TimeSelection) => void
  onValidationChange: (isValid: boolean) => void
  onPaymentChange: (details: PaymentDetails) => void
  onParticipantChange: (participants: BookingParticipant[]) => void
  onRentalChange: (rentals: RentalSelection[]) => void
  participants: BookingParticipant[]
  startTime?: string
  endTime?: string
}

interface PaymentDetails {
  totalAmount: number
  deposit: number
  courtPrice: number
  rentalItemsPrice: number
  paymentStatus: PaymentStatusEnum
  paymentMethod: PaymentMethodEnum
  isPaid: boolean
  manualPrice?: number
}

const initialPaymentDetails: PaymentDetails = {
  totalAmount: 0,
  deposit: 0,
  courtPrice: 0,
  rentalItemsPrice: 0,
  paymentStatus: 'pending' as PaymentStatusEnum,
  paymentMethod: 'cash' as PaymentMethodEnum,
  isPaid: false
}

export function SimpleShiftBookingModal({ 
  isOpen, 
  onClose,
  selection
}: SimpleShiftBookingModalProps) {
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [isStepValid, setIsStepValid] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [participants, setParticipants] = useState<BookingParticipant[]>([])
  const { selectedDate } = useDateContext()
  const { currentBranch } = useBranchContext()
  const { rentals, totalPrice: rentalItemsPrice } = useRentalContext()
  const { data: courts = [] } = useCourts({ branchId: currentBranch?.id })
  const { data: items = [] } = useItems(currentBranch?.id)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(() => {
    const durationInMinutes = selection 
      ? timeToMinutes(selection.endTime) - timeToMinutes(selection.startTime)
      : 0
    const numberOfCourts = selection?.selections.length || 0
    const courtPrice = durationInMinutes * numberOfCourts * 100

    return {
      totalAmount: courtPrice,
      deposit: courtPrice,
      courtPrice: courtPrice,
      rentalItemsPrice: 0,
      paymentStatus: 'completed' as PaymentStatusEnum,
      paymentMethod: 'cash' as PaymentMethodEnum,
      isPaid: false
    }
  })

  const {
    currentStep,
    selectedCourts,
    timeSelection,
    handleContinue,
    handleBack,
    resetState,
    setSelectedCourts,
    setTimeSelection,
  } = useBookingState({
    initialBookingType: 'shift',
    disableTypeSelection: true,
    initialStep: 'participants'
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && selection) {
      const durationInMinutes = timeToMinutes(selection.endTime) - timeToMinutes(selection.startTime)
      console.log('Calculando duración para timeSelection:', {
        startTime: selection.startTime,
        endTime: selection.endTime,
        slots: selection.slots,
        durationInMinutes,
        calculatedFromSlots: selection.slots * 15
      })

      setSelectedCourts(selection.selections.map(sel => sel.courtId))
      setTimeSelection({
        startTime: selection.startTime,
        endTime: selection.endTime,
        duration: durationInMinutes
      })
    }
  }, [isOpen, selection, setSelectedCourts, setTimeSelection])

  useEffect(() => {
    switch (currentStep) {
      case 'participants':
        setIsStepValid(participants.length > 0)
        break
      case 'rentals':
        setIsStepValid(true) // Los rentals son opcionales
        break
      case 'payment':
        setIsStepValid(true) // La validación del pago se maneja en el componente PaymentStep
        break
      case 'confirmation':
        setIsStepValid(true)
        break
      default:
        setIsStepValid(false)
    }
  }, [currentStep, participants.length])

  // Efecto para reset cuando se cierra el modal
  useEffect(() => {
    let isMounted = true;

    if (!isOpen && isMounted) {
      // Usar un timeout para asegurar que el reset ocurra después de la animación
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          resetState();
          setParticipants([]);
          setIsStepValid(false);
        }
      }, 300); // Tiempo de la animación de cierre

      return () => {
        clearTimeout(timeoutId);
        isMounted = false;
      };
    }
  }, [isOpen, resetState]);

  // Memoizar cálculos de precios
  const calculatedPrices = useMemo(() => {
    if (!selection || !courts.length) return { courtPrice: 0, rentalPrice: rentalItemsPrice, total: 0 };

    const durationInMinutes = timeToMinutes(selection.endTime) - timeToMinutes(selection.startTime);
    const courtPrice = selection.selections.reduce((total, sel) => {
      const court = courts.find((c: Court) => c.id === sel.courtId);
      if (!court?.duration_pricing) return total;
      return total + (Number(court.duration_pricing[durationInMinutes.toString()]) || 0);
    }, 0);

    const total = courtPrice + rentalItemsPrice;

    return {
      courtPrice,
      rentalPrice: rentalItemsPrice,
      total
    };
  }, [selection, courts, rentalItemsPrice]);

  // Efecto optimizado para actualizar payment details
  useEffect(() => {
    if (!selection) return;

    const { total: newTotal } = calculatedPrices;
    if (Math.abs(newTotal - paymentDetails.totalAmount) <= 0.01) return;

    let newDeposit = paymentDetails.deposit;
    if (paymentDetails.paymentStatus === 'completed') {
      newDeposit = newTotal;
    } else if (paymentDetails.deposit === 0 || paymentDetails.deposit > newTotal) {
      newDeposit = Math.ceil(newTotal * 0.3);
    }

    const newPaymentDetails: PaymentDetails = {
      ...paymentDetails,
      totalAmount: newTotal,
      deposit: newDeposit,
      courtPrice: calculatedPrices.courtPrice,
      rentalItemsPrice: calculatedPrices.rentalPrice
    };

    setPaymentDetails(newPaymentDetails);
  }, [selection, calculatedPrices, paymentDetails]);

  // Efecto para confirmar la reserva
  useEffect(() => {
    if (currentStep === 'confirmation' && !isProcessing && selection && selectedDate && timeSelection) {
      setIsProcessing(true)
      handleConfirmBooking()
        .catch(error => {
          console.error('Error al confirmar la reserva:', error)
          toast.error(error.message || 'Error al crear la reserva')
        })
        .finally(() => {
          setIsProcessing(false)
        })
    }
  }, [currentStep, isProcessing, selection, selectedDate, timeSelection])

  // Función para calcular el precio total de los rentals
  const calculateRentalTotalPrice = useCallback((rentals: RentalSelection[]) => {
    const total = rentals.reduce((total, rental) => {
      if (!rental.quantity || !rental.pricePerUnit) return total
      return total + (rental.quantity * rental.pricePerUnit)
    }, 0)
    console.log('Calculando precio total de rentals:', { rentals, total })
    return total
  }, [])

  const handleConfirmBooking = useCallback(async () => {
    if (!selection || !selectedDate || !timeSelection) {
      toast.error('Faltan datos requeridos para la reserva');
      return;
    }

    try {
      const bookingData: BookingCreationData = {
        courtId: selectedCourts[0],
        date: selectedDate.toISOString().split('T')[0],
        startTime: timeSelection.startTime,
        endTime: timeSelection.endTime,
        courtPrice: calculatedPrices.courtPrice,
        rentalItemsPrice: calculatedPrices.rentalPrice,
        paymentStatus: paymentDetails.paymentStatus,
        paymentMethod: paymentDetails.paymentMethod,
        depositAmount: Math.min(paymentDetails.deposit, calculatedPrices.total),
        participants: participants.map(p => ({
          id: p.id,
          memberId: p.id,
          role: 'player',
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Sin nombre'
        })),
        rentalItems: rentals
      };

      const bookingResult = await bookingService.createBooking(bookingData);
      if (bookingResult.error) throw new Error(bookingResult.error.message);

      await queryClient.invalidateQueries({
        queryKey: ['bookings', selectedDate.toISOString().split('T')[0], currentBranch?.id]
      });
      
      toast.success('Reserva creada exitosamente');
      onClose();
    } catch (error: any) {
      console.error('Error al crear la reserva:', error);
      toast.error(error.message || 'Error al crear la reserva');
      handleBack();
    }
  }, [selection, selectedDate, timeSelection, calculatedPrices, paymentDetails, participants, rentals, selectedCourts, currentBranch?.id]);

  const handleBackAction = () => {
    if (currentStep === 'participants') {
      onClose()
    } else {
      handleBack()
    }
  }

  const handleContinueAction = async () => {
    if (currentStep === 'confirmation') {
      // Solo cerramos el modal cuando el usuario hace clic en Aceptar
      onClose()
    } else {
      handleContinue()
    }
  }

  const handleRentalChange = (newRentals: RentalSelection[]) => {
    // Esta función ya no es necesaria ya que usamos el contexto
    console.log('Rentals actualizados via contexto:', newRentals)
  }

  if (!selection || !mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
          />
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ 
              x: "100%", 
              opacity: 0,
              transition: {
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
            transition={{ 
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l z-50"
          >
            <div className="h-full flex flex-col">
              <ModalHeader 
                currentStep={currentStep}
                selectedBookingType="shift"
              />

              <div className="flex-1 overflow-y-auto">
                <SimpleShiftBooking
                  currentStep={currentStep}
                  selectedCourts={selectedCourts}
                  timeSelection={timeSelection}
                  onCourtSelect={setSelectedCourts}
                  onTimeSelect={setTimeSelection}
                  onValidationChange={setIsStepValid}
                  onPaymentChange={setPaymentDetails}
                  onRentalChange={handleRentalChange}
                  participants={participants}
                  onParticipantChange={setParticipants}
                  startTime={timeSelection?.startTime}
                  endTime={timeSelection?.endTime}
                />
              </div>

              <ModalFooter
                currentStep={currentStep}
                onBack={handleBackAction}
                onContinue={handleContinueAction}
                isValid={isStepValid}
                isSimpleShift={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
} 