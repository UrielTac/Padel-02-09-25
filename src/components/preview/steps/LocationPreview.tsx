import { FormStepField } from "@/types/form-steps";
import { LocationStepField, LocationStepSettings } from "@/components/steps/location/types";
import { PreviewContainer } from "../layout/PreviewContainer";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { NavigationButtons } from "../layout/NavigationButtons";
import { MapPin, Check, Loader2, Clock } from "lucide-react";
import { useLocationBranches } from "@/hooks/use-location-branches";
import { formatScheduleRange } from "@/lib/utils/schedule";
import { useForm } from "@/contexts/FormContext";
import { useFormConfig } from "@/hooks/useFormConfig";
import { MobileNavigation } from "../layout/MobileNavigation";
import { MobileNextButton } from "../layout/MobileNextButton";

interface LocationPreviewProps {
  field: LocationStepField;
  theme: 'light' | 'dark';
  viewType: "mobile" | "desktop";
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isPublicView?: boolean;
  slug?: string;
}

export function LocationPreview({ 
  field, 
  theme, 
  viewType,
  onNext,
  onPrev,
  isFirstStep,
  isLastStep,
  isPublicView,
  slug
}: LocationPreviewProps) {
  const defaultSettings: LocationStepSettings = {
    isActive: true,
    showMap: false,
    showAddress: true,
    showDirections: false,
    defaultLocation: { lat: 0, lng: 0 },
    showBranches: true,
    showSchedule: true,
    showContactInfo: false,
    allowMultipleBranches: false
  };
  
  const { settings = defaultSettings } = field || {};
  const { state, setLocation } = useForm();
  
  // Validar que el slug esté presente
  if (!slug) {
    console.error('[LocationPreview] Error: slug es requerido');
    return null;
  }

  const { empresaId, isLoading: isLoadingConfig, error: configError } = useFormConfig(slug);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(state.location.branchId);
  
  console.log('[LocationPreview] Estado inicial:', {
    empresaId,
    settings,
    isLoadingConfig,
    configError: configError?.message,
    selectedLocation,
    slug // Agregamos el slug al logging
  });

  const { branches, isLoading: isLoadingBranches, error: branchesError, isEmpty } = useLocationBranches(
    settings,
    empresaId
  );

  // Efecto para sincronizar el estado local con el contexto
  useEffect(() => {
    console.log('[LocationPreview] Sincronizando estado:', {
      contextBranchId: state.location.branchId,
      selectedLocation
    });

    if (state.location.branchId) {
      setSelectedLocation(state.location.branchId);
    }
  }, [state.location.branchId]);

  // Efecto para actualizar el contexto cuando cambia la selección local
  useEffect(() => {
    if (selectedLocation) {
      const selectedBranch = branches.find(branch => branch.id === selectedLocation);
      if (selectedBranch) {
        console.log('[LocationPreview] Actualizando ubicación:', {
          id: selectedBranch.id,
          name: selectedBranch.name
        });
        setLocation({
          branchId: selectedLocation,
          branchName: selectedBranch.name
        });
      }
    }
  }, [selectedLocation, branches, setLocation]);

  const isLoading = isLoadingConfig || isLoadingBranches;
  const error = configError || branchesError;

  const getErrorMessage = () => {
    if (configError) {
      console.error('[LocationPreview] Error de configuración:', configError);
      return 'Error al cargar la configuración del formulario';
    }
    if (branchesError) {
      console.error('[LocationPreview] Error al cargar sucursales:', branchesError);
      return branchesError.message || 'Error al cargar las sucursales';
    }
    if (!empresaId) {
      console.error('[LocationPreview] empresa_id no disponible');
      return 'No se pudo identificar la empresa';
    }
    console.error('[LocationPreview] Error desconocido');
    return 'Error desconocido al cargar las sucursales';
  };

  const handleNext = () => {
    if (selectedLocation) {
      console.log('[LocationPreview] Avanzando al siguiente paso:', {
        selectedLocation,
        branchName: branches.find(b => b.id === selectedLocation)?.name
      });
      onNext();
    }
  };

  return (
    <PreviewContainer 
      viewType={viewType} 
      theme={theme}
      onNext={handleNext}
      onPrev={onPrev}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      isPublicView={isPublicView}
      isNextDisabled={!selectedLocation}
      hideNavigation={viewType === "mobile" && isPublicView}
    >
      <div className="min-h-full flex flex-col relative">
        {viewType === "mobile" && (
          <>
            <MobileNextButton
              theme={theme}
              onNext={handleNext}
              isDisabled={!selectedLocation}
              isPublicView={isPublicView}
              viewType={viewType}
            />
          </>
        )}
        <div className={cn(
          "flex-1",
          viewType === "mobile" && isPublicView && "pt-8 pb-24"
        )}>
          <div className="pb-24">
            <div className="pb-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-1"
              >
                <h1 className={cn(
                  "text-lg font-semibold transition-colors",
                  theme === 'dark' ? "text-white" : "text-gray-900"
                )}>
                  {field.title || "Seleccionar Sucursal"}
                </h1>
                <p className={cn(
                  "text-sm transition-colors px-6",
                  theme === 'dark' ? "text-gray-400" : "text-gray-500"
                )}>
                  {field.description || "Elige la sucursal más cercana a tu ubicación"}
                </p>
              </motion.div>
            </div>

            <div className="pt-4">
              <div className="space-y-3 px-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className={cn(
                      "text-sm",
                      theme === 'dark' ? "text-red-400" : "text-red-500"
                    )}>
                      {getErrorMessage()}
                    </p>
                  </div>
                ) : isEmpty ? (
                  <div className="text-center py-8">
                    <p className={cn(
                      "text-sm",
                      theme === 'dark' ? "text-gray-400" : "text-gray-500"
                    )}>
                      {!empresaId 
                        ? "No se pudo identificar la empresa" 
                        : "No hay sucursales disponibles"}
                    </p>
                  </div>
                ) : (
                  branches.map((branch, index) => {
                    const isSelected = selectedLocation === branch.id;
                    
                    return (
                      <motion.button
                        key={branch.id}
                        onClick={() => setSelectedLocation(branch.id)}
                        className={cn(
                          "w-full h-auto text-sm font-medium rounded-xl p-3",
                          "transition-all duration-200 ease-in-out",
                          theme === 'dark' 
                            ? isSelected
                              ? "bg-zinc-800 hover:bg-neutral-800 text-white"
                              : "bg-neutral-900 hover:bg-neutral-800 text-gray-200"
                            : isSelected
                              ? "bg-gray-100 hover:bg-gray-200 text-gray-900"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                        )}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ 
                          opacity: 1,
                          scale: 1,
                          transition: { delay: index * 0.1 }
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 text-left">
                            <h3 className={cn(
                              "font-medium text-sm transition-colors mb-1",
                              theme === 'dark' ? "text-white" : "text-gray-900"
                            )}>
                              {branch.name}
                            </h3>
                            <div className="space-y-0.5">
                              {settings.showAddress && branch.address && (
                                <p className={cn(
                                  "text-[11px] transition-colors text-left",
                                  theme === 'dark' ? "text-gray-400" : "text-gray-500"
                                )}>
                                  {branch.address}
                                </p>
                              )}
                              {settings.showSchedule && branch.opening_hours && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <p className={cn(
                                    "text-[10px] transition-colors text-left",
                                    theme === 'dark' ? "text-gray-500" : "text-gray-500"
                                  )}>
                                    {formatScheduleRange(branch.opening_hours)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center">
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 20
                                }}
                                className={cn(
                                  "rounded-full flex items-center justify-center",
                                  theme === 'dark' 
                                    ? "bg-white" 
                                    : "bg-black",
                                  "h-5 w-5"
                                )}
                              >
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                    delay: 0.1
                                  }}
                                >
                                  <Check 
                                    className={cn(
                                      "h-3 w-3",
                                      theme === 'dark' 
                                        ? "text-black" 
                                        : "text-white"
                                    )} 
                                    strokeWidth={2.5}
                                  />
                                </motion.div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PreviewContainer>
  );
} 