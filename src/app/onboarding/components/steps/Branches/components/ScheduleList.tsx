import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Trash2, Plus } from "lucide-react"
import { SectionTitle } from "@/components/ui/section-title"

export interface ScheduleRange {
  start: string
  end: string
}

export interface ScheduleDay {
  enabled: boolean
  ranges: ScheduleRange[]
}

export interface ScheduleData {
  [key: string]: ScheduleDay
}

export const daysTranslations: { [key: string]: string } = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

interface ScheduleListProps {
  schedule: ScheduleData
  onScheduleChange: (schedule: ScheduleData) => void
}

export function ScheduleList({ schedule, onScheduleChange }: ScheduleListProps) {
  const handleDayToggle = (day: string, enabled: boolean) => {
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        enabled
      }
    })
  }

  const handleScheduleChange = (day: string, field: string, value: string, rangeIndex: number = 0) => {
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        ranges: schedule[day].ranges.map((range, idx) => 
          idx === rangeIndex 
            ? { ...range, [field]: value }
            : range
        )
      }
    })
  }

  const addSecondRange = (day: string) => {
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        ranges: [...schedule[day].ranges, { start: '16:00', end: '22:00' }]
      }
    })
  }

  const removeSecondRange = (day: string, rangeIndex: number) => {
    onScheduleChange({
      ...schedule,
      [day]: {
        ...schedule[day],
        ranges: schedule[day].ranges.filter((_, idx) => idx !== rangeIndex)
      }
    })
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Horarios"
        subtitle="Establece los horarios de apertura y cierre"
        tooltip="Define los horarios de operación para cada día de la semana. Puedes marcar días como cerrados o establecer diferentes horarios según el día."
      />
      <div className="space-y-2 border rounded-lg divide-y">
        {Object.entries(schedule).map(([day, daySchedule]) => (
          <div key={day} className="flex items-center gap-4 p-3">
            <div className="w-28">
              <span className="text-xs font-medium text-gray-700">{daysTranslations[day]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={`checkbox-${day}`}
                checked={daySchedule.enabled}
                onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                className="h-3.5 w-3.5 rounded-[4px] border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
              />
              <Label htmlFor={`checkbox-${day}`} className="text-xs text-gray-600">
                {daySchedule.enabled ? 'Abierto' : 'Cerrado'}
              </Label>
            </div>
            {daySchedule.enabled && (
              <div className="flex-1">
                <div className="space-y-2">
                  {daySchedule.ranges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={range.start}
                          onChange={(e) => handleScheduleChange(day, 'start', e.target.value, index)}
                          className="w-32 h-8 text-sm"
                        />
                        <span className="text-sm text-gray-500">a</span>
                        <Input
                          type="time"
                          value={range.end}
                          onChange={(e) => handleScheduleChange(day, 'end', e.target.value, index)}
                          className="w-32 h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center">
                        {daySchedule.ranges.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSecondRange(day, index)}
                            className="h-8 w-8 p-0 ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {(daySchedule.ranges.length === 1 || index === daySchedule.ranges.length - 1) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addSecondRange(day)}
                            className="h-8 w-8 p-0 ml-2"
                          >
                            <Plus className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 