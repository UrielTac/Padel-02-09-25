import { Button } from "@/components/ui/button"
import { IconSettings, IconRefresh } from "@tabler/icons-react"
import { DateSelector } from "../DateSelector"
import { cn } from "@/lib/utils"

interface TableHeaderProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  onConfigClick: () => void
  onCreateClassClick: () => void
  onRefreshClick: () => void
  isRefreshing?: boolean
}

export function TableHeader({
  selectedDate,
  onDateChange,
  onConfigClick,
  onCreateClassClick,
  onRefreshClick,
  isRefreshing = false
}: TableHeaderProps) {
  return (
    <div className="p-4 flex justify-between items-center">
      <div className="flex items-center">
      </div>

      <div className="flex items-center gap-2">
        {/* DateSelector */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          className="shadow-none"
        />

        {/* Botón de Actualizar */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "p-2 bg-white hover:bg-gray-50 rounded-md border border-gray-200",
            "relative overflow-hidden",
            "transition-colors duration-200"
          )}
          onClick={onRefreshClick}
          disabled={isRefreshing}
        >
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-transform duration-200",
            isRefreshing && "[&>svg]:animate-spin-once"
          )}>
            <IconRefresh 
              className="h-5 w-5 text-gray-600"
              stroke={1.5}
            />
          </div>
        </Button>

        {/* Botón de Configuración */}
        <Button
          variant="outline"
          size="icon"
          className="p-2 bg-white hover:bg-gray-50 rounded-md border border-gray-200"
          onClick={onConfigClick}
        >
          <IconSettings className="h-5 w-5 text-gray-600" stroke={1.5} />
        </Button>

        {/* Botón de Crear Clase */}
        <Button 
          onClick={onCreateClassClick}
          variant="outline"
          className="px-4 py-2 bg-white hover:bg-gray-50 rounded-md border border-gray-200"
        >
          Crear Clase
        </Button>
      </div>
    </div>
  )
} 