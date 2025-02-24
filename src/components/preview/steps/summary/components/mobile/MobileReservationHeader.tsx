import { cn } from "@/lib/utils";
import { TotalPrice } from "../TotalPrice";

interface MobileReservationHeaderProps {
  theme: 'light' | 'dark';
  total: number;
}

export function MobileReservationHeader({
  theme,
  total
}: MobileReservationHeaderProps) {
  return (
    <div className={cn(
      "w-full bg-white dark:bg-neutral-900",
      "min-h-[300px] flex items-center justify-center",
      "relative"
    )}>
      <TotalPrice theme={theme} total={total} />
    </div>
  );
} 