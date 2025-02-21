import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useForm } from "@/contexts/FormContext";

interface ReservationDetailsProps {
  theme: 'light' | 'dark';
}

export function ReservationDetails({ theme }: ReservationDetailsProps) {
  const { state } = useForm();
  const { location, shift } = state;

  if (!shift.date || !shift.startTime || !shift.endTime) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className={cn(
          "text-lg font-semibold leading-tight",
          theme === 'dark' ? "text-white/90" : "text-gray-900"
        )}>
          {location.branchName || "No seleccionada"}
        </p>
        <div>
          <p className={cn(
            "text-[14px]",
            theme === 'dark' ? "text-gray-400" : "text-gray-500"
          )}>
            {format(new Date(shift.date), "EEEE d 'de' MMMM", { locale: es })}
            <span className={cn(
              "text-[14px] ml-1",
              theme === 'dark' ? "text-gray-500" : "text-gray-400"
            )}>
              • {shift.startTime} - {shift.endTime} • {shift.courtName}
            </span>
          </p>
        </div>
      </div>

      {/* Línea divisoria sutil */}
      <div className={cn(
        "border-b",
        theme === 'dark' 
          ? "border-neutral-800/50" 
          : "border-gray-200/70"
      )} />
    </div>
  );
} 