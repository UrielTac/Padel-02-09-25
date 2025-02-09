import { cn } from "@/lib/utils";
import { NavigationButtons } from "./NavigationButtons";

interface PreviewContainerProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  viewType: "mobile" | "desktop";
  onNext?: () => void;
  onPrev?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isNextDisabled?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  hideNavigation?: boolean;
  isPublicView?: boolean;
}

export function PreviewContainer({
  children,
  theme,
  viewType,
  onNext,
  onPrev,
  isFirstStep,
  isLastStep,
  isNextDisabled,
  nextLabel = "Siguiente",
  prevLabel = "Volver",
  hideNavigation,
  isPublicView = false
}: PreviewContainerProps) {
  // Vista pública - Solo contenido sin botones de navegación
  if (isPublicView) {
    return (
      <div className={cn(
        "relative flex flex-col h-full",
        theme === 'dark' ? "bg-black" : "bg-white"
      )}>
        <div className={cn(
          "flex-1 overflow-y-auto",
          viewType === "mobile" 
            ? "px-3" 
            : "px-4 md:px-6 lg:px-8",
          "text-base md:text-lg"
        )}>
          {children}
        </div>
      </div>
    );
  }

  // Vista de configuración
  return (
    <div className={cn(
      "relative flex flex-col h-full",
      theme === 'dark' ? "bg-black" : "bg-white"
    )}>
      <div className={cn(
        "flex-1 overflow-y-auto",
        viewType === "mobile" ? "px-3" : "px-4",
        !hideNavigation && "pb-20"
      )}>
        {children}
      </div>

      {!hideNavigation && onNext && onPrev && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 z-10",
          "bg-gradient-to-t from-white dark:from-black to-transparent",
          "pt-4 pb-3",
          viewType === "mobile" ? "px-3" : "px-4"
        )}>
          <NavigationButtons
            onNext={onNext}
            onPrev={onPrev}
            isFirstStep={isFirstStep || false}
            isLastStep={isLastStep || false}
            theme={theme}
            viewType={viewType}
            isNextDisabled={isNextDisabled}
            nextLabel={nextLabel}
            prevLabel={prevLabel}
            isPreview={true}
          />
        </div>
      )}
    </div>
  );
} 