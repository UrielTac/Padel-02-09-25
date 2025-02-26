import { cn } from "@/lib/utils";
import { TotalPrice } from "../TotalPrice";
import { motion } from "framer-motion";

interface MobileReservationHeaderProps {
  theme: 'light' | 'dark';
  total: number;
}

export function MobileReservationHeader({
  theme,
  total
}: MobileReservationHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "w-full bg-white dark:bg-neutral-900",
        "min-h-[300px] flex items-center justify-center",
        "relative"
      )}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.4,
          delay: 0.2,
          ease: "easeOut"
        }}
      >
        <TotalPrice theme={theme} total={total} />
      </motion.div>
    </motion.div>
  );
} 