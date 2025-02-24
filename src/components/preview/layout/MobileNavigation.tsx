import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  theme: 'light' | 'dark';
  onPrev?: () => void;
  isPublicView?: boolean;
  className?: string;
}

export function MobileNavigation({ 
  theme,
  onPrev,
  isPublicView = false,
  className
}: MobileNavigationProps) {
  if (!isPublicView || !onPrev) return null;

  return (
    <div className={cn(
      "absolute top-6 left-0 right-0 z-50",
      className
    )}>
      <button
        onClick={onPrev}
        className={cn(
          theme === 'dark'
            ? "text-white hover:opacity-70"
            : "text-black hover:opacity-70"
        )}
      >
        <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  );
} 