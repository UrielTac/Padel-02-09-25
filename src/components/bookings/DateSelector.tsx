"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { cn } from "@/lib/utils"

interface DateSelectorProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  className?: string
}

export function DateSelector({ selectedDate, onDateChange, className }: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDateSelect = (date: Date) => {
    onDateChange(date)
    setIsOpen(false)
  }

  // Función para capitalizar la primera letra
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // Función para formatear la fecha
  const formatDate = (date: Date) => {
    const month = capitalizeFirstLetter(format(date, "MMM", { locale: es }))
    const day = format(date, "d")
    const year = format(date, "yyyy").slice(-2)
    return `${month} ${day} '${year}`
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center px-3 py-2 bg-white hover:bg-gray-50",
          "border border-gray-200 rounded-md transition-colors duration-200",
          "text-sm font-medium text-black"
        )}
      >
        {formatDate(selectedDate)}
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2"
          style={{ zIndex: 10000 }}
        >
          <div 
            className="bg-white rounded-lg border border-gray-200 shadow-lg" 
            style={{ width: '320px' }}
          >
            <CustomCalendar
              selected={selectedDate}
              onSelect={handleDateSelect}
            />
          </div>
        </div>
      )}
    </div>
  )
} 