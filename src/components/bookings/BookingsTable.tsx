"use client"

import { useState, useRef, useEffect } from "react"
import { useBranches } from '@/hooks/useBranches'
import { useCourts } from "@/hooks/useCourts"
import { useBookingSelection } from "./hooks/useBookingSelection"
import { useBookingState } from "./hooks/useBookingState"
import { useTimeSlots } from "./hooks/useTimeSlots"
import { useTableNavigation } from "./hooks/useTableNavigation"
import { useBookingModals } from "./hooks/useBookingModals"
import { TableHeader } from "./components/TableHeader"
import { TableBody } from "./components/TableBody"
import { TableNavigationButtons } from "./components/TableNavigationButtons"
import { ConfigurationMenu } from "./components/ConfigurationMenu"
import { NewBookingModal } from "./components/NewBookingModal/NewBookingModal"
import { SimpleShiftBookingModal } from "./components/NewBookingModal/SimpleShiftBookingModal"
import { ViewBookingModal } from "./components/ViewBookingModal/ViewBookingModal"
import { timeToMinutes } from "./utils"
import { Z_LAYERS } from "@/constants/zIndex"
import { useBookings } from "@/hooks/useBookings"

export function BookingsTable() {
  // Estados principales
  const { currentBranch } = useBranches()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [configMenuOpen, setConfigMenuOpen] = useState(false)
  const [configButtonPosition, setConfigButtonPosition] = useState({ x: 0, y: 0 })
  const configButtonRef = useRef<HTMLButtonElement>(null)
  const [tableConfig, setTableConfig] = useState({
    colors: {
      shift: '#FBD950',
      class: '#60A5FA',
      blocked: '#EF4444',
    }
  })

  // Custom hooks
  const { data: allCourts = [] } = useCourts({ 
    branchId: currentBranch?.id,
    onlyActive: true
  })

  const {
    bookings,
    isLoading,
    isError,
    selectedBooking,
    setSelectedBooking,
    handleBookingCreated
  } = useBookingState({
    selectedDate,
    branchId: currentBranch?.id
  })

  const { timeSlots, isOpen } = useTimeSlots({ selectedDate })

  const {
    visibleCourtsStart,
    tableContainerRef,
    handleTableNavigation,
    getCourtColumnWidth
  } = useTableNavigation({
    totalCourts: allCourts.length
  })

  const {
    showSimpleShiftModal,
    setShowSimpleShiftModal,
    showNewBookingModal,
    setShowNewBookingModal,
    handleSimpleShiftModalClose,
    handleNewBookingModalClose,
    guests,
    currentGuest,
    handleAddGuest,
    handleRemoveGuest,
    resetFormStates
  } = useBookingModals({
    onModalClose: () => setSelection(null)
  })

  const visibleCourts = allCourts.slice(
    visibleCourtsStart,
    visibleCourtsStart + 4
  )

  const {
    selection,
    isMouseDown,
    isDragging,
    handleCellMouseDown,
    handleCellMouseMove,
    handleMouseUp,
    isSlotSelected,
    setSelection
  } = useBookingSelection({
    visibleCourts,
    onSelectionComplete: () => setShowSimpleShiftModal(true)
  })

  // Función para verificar si una celda tiene una reserva existente
  const getExistingBooking = (courtId: string, time: string) => {
    return bookings.find(booking => 
      booking.courtId === courtId &&
      timeToMinutes(time) >= timeToMinutes(booking.startTime) &&
      timeToMinutes(time) < timeToMinutes(booking.endTime)
    ) || null
  }

  // Actualizar el manejador del botón de configuración
  const handleConfigButtonClick = () => {
    if (configButtonRef.current) {
      const rect = configButtonRef.current.getBoundingClientRect()
      setConfigButtonPosition({ x: rect.left, y: rect.bottom })
      setConfigMenuOpen(true)
    }
  }

  // Agregar efecto para manejar eventos globales del mouse
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseUp)
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [handleMouseUp])

  // Renderizado condicional
  if (!currentBranch) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Selecciona una sede para ver las canchas disponibles</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando reservas...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error al cargar las reservas</p>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ zIndex: Z_LAYERS.TABLE_BASE }}>
      <TableHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onConfigClick={handleConfigButtonClick}
        onCreateClassClick={() => setShowNewBookingModal(true)}
      />

      <ConfigurationMenu
        isOpen={configMenuOpen}
        onClose={() => setConfigMenuOpen(false)}
        position={configButtonPosition}
        currentConfig={tableConfig}
        onConfigChange={setTableConfig}
      />

      <div className="p-4 overflow-x-auto select-none">
        <div ref={tableContainerRef} className="overflow-x-auto border rounded-lg">
          <TableBody
            timeSlots={timeSlots}
            visibleCourts={visibleCourts}
            selection={selection}
            isMouseDown={isMouseDown}
            isDragging={isDragging}
            getExistingBooking={getExistingBooking}
            onMouseDown={handleCellMouseDown}
            onMouseMove={handleCellMouseMove}
            onMouseEnter={handleCellMouseMove}
            onBookingClick={setSelectedBooking}
            isSlotSelected={isSlotSelected}
            getCourtColumnWidth={getCourtColumnWidth}
          />
        </div>
      </div>

      <TableNavigationButtons
        totalItems={allCourts.length}
        visibleItems={4}
        currentStart={visibleCourtsStart}
        onNavigate={handleTableNavigation}
        className="border-t border-gray-200 bg-white py-3"
      />

      <NewBookingModal 
        isOpen={showNewBookingModal}
        onClose={handleNewBookingModalClose}
        initialBookingType="class"
        disableTypeSelection
      />

      <SimpleShiftBookingModal
        isOpen={showSimpleShiftModal}
        onClose={handleSimpleShiftModalClose}
        selection={selection}
        onBookingCreated={handleBookingCreated}
      />

      <ViewBookingModal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
      />
    </div>
  )
}