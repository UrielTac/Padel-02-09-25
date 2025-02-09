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
    <div className="space-y-1">
      <p className={cn(
        "text-sm font-semibold",
        theme === 'dark' ? "text-white" : "text-gray-900"
      )}>
        {location.branchName || "No seleccionada"}
      </p>
      <div className="space-y-0.5">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-gray-400" : "text-gray-500"
        )}>
          {format(new Date(shift.date), "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <p className={cn(
          "text-xs",
          theme === 'dark' ? "text-gray-500" : "text-gray-500"
        )}>
          {shift.startTime} - {shift.endTime} • {shift.courtName}
        </p>
      </div>
    </div>
  );
} 