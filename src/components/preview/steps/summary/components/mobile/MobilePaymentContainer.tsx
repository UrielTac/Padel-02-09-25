import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PriceBreakdown } from "../PriceBreakdown";
import { PaymentTypeSection } from "../PaymentTypeSection";
import { PaymentSection } from "../PaymentSection";
import { withResponsiveView } from "../../hoc/withResponsiveView";
import { PaymentMethod, PaymentTypeEnum, SelectedItem, PaymentType, PAYMENT_TYPES } from "../../types";
import { MobileNavigation } from "@/components/preview/layout/MobileNavigation";
import { MobileNextButton } from "@/components/preview/layout/MobileNextButton";
import { MobileReservationHeader } from "./MobileReservationHeader";
import { useState, useEffect, useRef } from "react";
import { ReservationDetails } from "../ReservationDetails";
import { ChevronRight, ChevronDown, Check, X } from "lucide-react";
import { PaymentTypeList } from "../PaymentTypeList";
import { useStripeConnection } from "@/hooks/useStripeConnection";
import { toast } from "sonner";

// Filtrar solo los tipos de pago que queremos mostrar
const FILTERED_PAYMENT_TYPES = PAYMENT_TYPES.filter(type => 
  !['card', 'cash'].includes(type.id)
);

// Definir los tipos de vista disponibles
type ViewStep = 'details' | 'payment';

interface MobilePaymentContainerProps {
  theme: 'light' | 'dark';
  viewType: 'mobile' | 'desktop';
  calculations: {
    courtPrice: number;
    itemsTotal: number;
    discount: number;
    total: number;
    selectedItems: SelectedItem[];
  };
  selectedPaymentType: PaymentTypeEnum | null;
  selectedPaymentMethod: PaymentMethod | null;
  onShowItemsDetails: () => void;
  onShowPaymentTypes: () => void;
  onShowPaymentMethods: () => void;
  onRemovePaymentType: () => void;
  onRemovePaymentMethod: () => void;
  onNext: () => void;
  onPrev?: () => void;
  isPublicView?: boolean;
  empresaId: string;
}

// Componente para el título de la sección
function SectionTitle({
  title,
  subtitle,
  theme
}: {
  title: string;
  subtitle: string;
  theme: 'light' | 'dark';
}) {
  return (
    <div className="mb-6">
      <h2 className={cn(
        "text-xl font-semibold mb-1",
        theme === 'dark' ? "text-white" : "text-gray-900"
      )}>
        {title}
      </h2>
      <p className={cn(
        "text-sm",
        theme === 'dark' ? "text-gray-400" : "text-gray-600"
      )}>
        {subtitle}
      </p>
    </div>
  );
}

// Componente para mostrar un elemento de la lista de tipos de pago
function PaymentTypeItem({
  type,
  isSelected,
  onClick,
  theme
}: {
  type: PaymentType;
  isSelected: boolean;
  onClick: () => void;
  theme: 'light' | 'dark';
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg cursor-pointer transition-all",
        "flex items-center justify-between",
        theme === 'dark'
          ? isSelected ? "bg-neutral-700" : "hover:bg-neutral-800"
          : isSelected ? "bg-gray-100" : "hover:bg-gray-50",
      )}
    >
      <div className="space-y-1">
        <p className={cn(
          "text-sm font-medium",
          theme === 'dark' ? "text-white" : "text-gray-900"
        )}>
          {type.name}
        </p>
        <p className={cn(
          "text-xs",
          theme === 'dark' ? "text-gray-400" : "text-gray-500"
        )}>
          {type.description}
        </p>
      </div>
      {isSelected && (
        <Check className={cn(
          "h-5 w-5",
          theme === 'dark' ? "text-blue-400" : "text-blue-600"
        )} />
      )}
    </div>
  );
}

// Componente para la lista desplegable de tipos de pago
function PaymentTypeDropdown({
  theme,
  isOpen,
  selectedType,
  onSelect,
  onClose
}: {
  theme: 'light' | 'dark';
  isOpen: boolean;
  selectedType: PaymentTypeEnum | null;
  onSelect: (type: PaymentTypeEnum) => void;
  onClose: () => void;
}) {
  // Referencia para detectar clics fuera del dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "absolute left-0 right-0 z-50 mt-2 origin-top",
        "rounded-lg shadow-lg",
        "overflow-hidden",
        theme === 'dark' ? "bg-neutral-900" : "bg-white",
        "border",
        theme === 'dark' ? "border-neutral-700" : "border-gray-200"
      )}
    >
      <div className="max-h-[300px] overflow-y-auto py-2 space-y-1">
        {FILTERED_PAYMENT_TYPES.map((type) => (
          <PaymentTypeItem
            key={type.id}
            type={type}
            isSelected={selectedType === type.id}
            onClick={() => {
              onSelect(type.id as PaymentTypeEnum);
              onClose();
            }}
            theme={theme}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Componente para la selección de tipo de pago
function PaymentTypeSelector({
  theme,
  selectedType,
  onSelect,
  empresaId,
  onShowPaymentTypes,
  onShowCardModal,
  onRemovePaymentType
}: {
  theme: 'light' | 'dark';
  selectedType: PaymentTypeEnum | null;
  onSelect: (type: PaymentTypeEnum) => void;
  empresaId: string;
  onShowPaymentTypes: () => void;
  onShowCardModal?: () => void;
  onRemovePaymentType?: () => void;
}) {
  const [showOptions, setShowOptions] = useState(false);
  const { isConnected, isLoading, error } = useStripeConnection(empresaId);
  const [verifyingToast, setVerifyingToast] = useState<string | null>(null);
  
  // Buscar el tipo de pago seleccionado para mostrar su nombre
  const selectedPaymentTypeData = selectedType 
    ? FILTERED_PAYMENT_TYPES.find(type => type.id === selectedType) 
    : null;

  // Limpiar toast al cerrar las opciones
  useEffect(() => {
    if (!showOptions && verifyingToast) {
      toast.dismiss(verifyingToast);
      setVerifyingToast(null);
    }
  }, [showOptions, verifyingToast]);

  // Actualizar estado cuando cambia la conexión
  useEffect(() => {
    if (verifyingToast && !isLoading) {
      toast.dismiss(verifyingToast);
      setVerifyingToast(null);

      if (error) {
        toast.error('Error al verificar la conexión con Stripe');
      } else if (!isConnected) {
        toast.error('El club debe configurar Stripe para aceptar garantías');
      } else {
        // Establecemos directamente el tipo, igual que en PaymentTypeModal
        console.log("[PaymentTypeSelector] Conexión Stripe verificada, seleccionando garantía");
        onSelect('guarantee');
        
        // Mostramos inmediatamente el modal de tarjeta, replicando el comportamiento de PaymentTypeModal
        if (onShowCardModal) {
          setTimeout(() => {
            console.log("[PaymentTypeSelector] Mostrando modal de tarjeta para garantía");
            onShowCardModal();
            
            toast.success('Configurando garantía', {
              description: 'Por favor, completa los datos de tu tarjeta para continuar',
              duration: 5000
            });
          }, 150); // Tiempo suficiente para que se actualice el estado
        } else {
          toast.error('No se puede completar el proceso de garantía sin configurar una tarjeta');
        }
      }
    }
  }, [isLoading, error, isConnected, verifyingToast, onSelect, onShowCardModal]);

  const handleSelectType = (type: PaymentTypeEnum) => {
    // Para tipo garantía que requiere validación especial
    if (type === 'guarantee') {
      // Si está cargando la conexión, mostrar loading y salir
      if (isLoading) {
        const toastId = toast.loading('Verificando conexión con Stripe...').toString();
        setVerifyingToast(toastId);
        return;
      }

      // Validaciones de errores
      if (error) {
        toast.error('Error al verificar la conexión con Stripe');
        return;
      }

      if (!isConnected) {
        toast.error('El club debe configurar Stripe para aceptar garantías');
        return;
      }

      console.log(`[PaymentTypeSelector] Seleccionando garantía directamente`);
      
      // Informar al usuario que sigue un paso adicional
      toast.success('Tipo de pago seleccionado: Garantía', {
        description: 'A continuación deberás configurar una tarjeta para completar el proceso.'
      });

      // FLUJO CRÍTICO: Replicar exactamente el comportamiento de PaymentTypeModal.tsx
      // 1. Primero establecemos el tipo de pago (como hace el modal)
      onSelect(type);
      
      // 2. Cerramos las opciones de tipos de pago
      setShowOptions(false);
      
      // 3. Mostramos el modal de tarjeta con un pequeño retraso para asegurar
      // que el tipo se haya establecido correctamente
      if (onShowCardModal) {
        setTimeout(() => {
          console.log("[PaymentTypeSelector] Mostrando modal de tarjeta para garantía");
          onShowCardModal();
        }, 150);
      } else {
        toast.error('No se puede completar el proceso de garantía sin configurar una tarjeta');
      }
    } else {
      // Para otros tipos de pago, selección directa
      console.log(`[PaymentTypeSelector] Seleccionando tipo: ${type}`);
      onSelect(type);
      
      // Mostrar confirmación al usuario
      const typeName = FILTERED_PAYMENT_TYPES.find(t => t.id === type)?.name || type;
      toast.success(`Tipo de pago seleccionado: ${typeName}`);
      
      // Cerrar las opciones
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <p className={cn(
          "text-sm font-medium",
          theme === 'dark' ? "text-gray-300" : "text-gray-700"
        )}>
          Elige cómo deseas realizar el pago
        </p>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={cn(
            "text-sm transition-colors relative",
            theme === 'dark' ? "text-gray-400" : "text-gray-600",
            "group flex flex-col items-center"
          )}
        >
          <span className="flex items-center">
            {selectedPaymentTypeData ? 'Cambiar' : 'Seleccionar'}
            <ChevronDown className={cn(
              "ml-1 h-4 w-4 transition-transform",
              showOptions && "transform rotate-180"
            )} />
          </span>
          <span className={cn(
            "absolute -bottom-1 left-0 right-0",
            "border-b border-dashed", 
            theme === 'dark' ? "border-gray-400/50" : "border-gray-600/50",
            "group-hover:border-opacity-100"
          )}></span>
        </button>
      </div>

      {/* Mostrar el tipo seleccionado solamente si hay uno seleccionado */}
      {selectedPaymentTypeData && !showOptions && (
        <div
          className={cn(
            "p-4 rounded-lg transition-all",
            "border mt-1",
            theme === 'dark' ? "border-neutral-700 bg-neutral-800" : "border-gray-200 bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className={cn(
                "text-sm",
                theme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                {selectedPaymentTypeData.name}
              </p>
              <p className={cn(
                "text-xs",
                theme === 'dark' ? "text-gray-400" : "text-gray-500"
              )}>
                {selectedPaymentTypeData.description}
              </p>
            </div>
            
            {/* Botón para eliminar el tipo de pago seleccionado */}
            <button
              onClick={() => {
                // Aquí llamamos a onRemovePaymentType que viene de las props del componente padre
                // Para mantener consistencia con el comportamiento anterior
                if (onRemovePaymentType) {
                  onRemovePaymentType();
                  // Mostrar notificación de éxito al usuario
                  toast.success('Tipo de pago eliminado');
                }
              }}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                theme === 'dark' 
                  ? "text-gray-400 hover:bg-neutral-700"
                  : "text-gray-400 hover:bg-gray-100"
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mostrar la lista de opciones si está abierta */}
      {showOptions && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "mt-2 rounded-lg",
            theme === 'dark' 
              ? "bg-neutral-900 border-neutral-800" 
              : "bg-white border-gray-100",
            "border-[0.5px]",
            "shadow-sm"
          )}
        >
          <PaymentTypeList
            theme={theme}
            selectedType={selectedType}
            onSelect={handleSelectType}
            paymentTypes={FILTERED_PAYMENT_TYPES}
          />
        </motion.div>
      )}
    </div>
  );
}

function MobilePaymentContainerBase({
  theme,
  viewType,
  calculations,
  selectedPaymentType,
  selectedPaymentMethod,
  onShowItemsDetails,
  onShowPaymentTypes,
  onShowPaymentMethods,
  onRemovePaymentType,
  onRemovePaymentMethod,
  onNext,
  onPrev,
  isPublicView = false,
  empresaId
}: MobilePaymentContainerProps) {
  const [currentView, setCurrentView] = useState<ViewStep>('details');
  // Estado local para el tipo de pago seleccionado
  const [localSelectedType, setLocalSelectedType] = useState<PaymentTypeEnum | null>(selectedPaymentType);

  // Sincronizar el estado local con las props cuando cambian
  useEffect(() => {
    setLocalSelectedType(selectedPaymentType);
  }, [selectedPaymentType]);

  if (viewType !== 'mobile') return null;

  const handleNext = () => {
    if (currentView === 'details') {
      setCurrentView('payment');
      return;
    }

    if (!selectedPaymentType || !selectedPaymentMethod) return;
    onNext();
  };

  // Función para manejar la selección directa del tipo de pago
  const handlePaymentTypeSelect = (type: PaymentTypeEnum) => {
    console.log(`[MobilePaymentContainer] handlePaymentTypeSelect: ${type}`);
    
    // Actualizar el estado local inmediatamente
    setLocalSelectedType(type);
    
    // El tipo 'guarantee' requiere un tratamiento especial
    const isGuaranteeType = type === 'guarantee';

    // Paso 1: Eliminamos cualquier tipo seleccionado previamente si es diferente
    if (selectedPaymentType && selectedPaymentType.toString() !== type.toString()) {
      console.log(`[MobilePaymentContainer] Removiendo tipo actual: ${selectedPaymentType}`);
      onRemovePaymentType();
    }
    
    // ---------------------------------------------------------------
    // La clave para la solución está en entender el flujo completo:
    // 1. En PaymentTypeModal.tsx, al seleccionar garantía:
    //    - Se llama a onSelect('guarantee')
    //    - Se llama a onShowCardModal()
    // 2. En MobilePaymentContainer, esto se traduce en:
    //    - Se actualiza selectedPaymentType a 'guarantee'
    //    - Se muestra el modal de tarjeta con onShowPaymentMethods()
    // ---------------------------------------------------------------
    
    // Solución: Acceder directamente al PaymentTypeModal.tsx desde el exterior
    if (isGuaranteeType) {
      console.log(`[MobilePaymentContainer] Procesando selección de garantía`);
      
      // Paso 1: Informar al usuario que estamos procesando
      toast.loading('Verificando sistema de pago...', { id: 'guarantee-setup' });
      
      // Paso 2: Añadir un marcador en localStorage para que el PaymentTypeModal
      // sepa que debe seleccionar 'guarantee' automáticamente cuando se abra
      window.localStorage.setItem('auto_select_guarantee', 'true');
      window.localStorage.setItem('guarantee_selection_timestamp', Date.now().toString());
      
      // Paso 3: Abrir el modal de tipos de pago, que ahora verificará localStorage
      // y seleccionará automáticamente 'guarantee', realizando las acciones necesarias
      onShowPaymentTypes();
      
      // Paso 4: Añadir un listener global para detectar cuando se complete el proceso
      const handleGuaranteeSelected = () => {
        console.log('[MobilePaymentContainer] Evento guarantee-selection-completed capturado');
        
        // Limpiar el localStorage una vez completado
        window.localStorage.removeItem('auto_select_guarantee');
        window.localStorage.removeItem('guarantee_selection_timestamp');
        
        // Actualizar el toast
        toast.success('Garantía configurada correctamente', { id: 'guarantee-setup' });
        
        // Limpiar los listeners
        document.removeEventListener('guarantee-selection-completed', handleGuaranteeSelected);
        window.removeEventListener('guarantee-selection-completed', handleGuaranteeSelected);
      };
      
      // Registrar el listener en ambos contextos para garantizar compatibilidad
      document.addEventListener('guarantee-selection-completed', handleGuaranteeSelected);
      window.addEventListener('guarantee-selection-completed', handleGuaranteeSelected);
      
      // Establecer un tiempo máximo para los listeners y cerrar el toast automáticamente
      // para evitar que quede abierto indefinidamente si algo falla
      setTimeout(() => {
        document.removeEventListener('guarantee-selection-completed', handleGuaranteeSelected);
        window.removeEventListener('guarantee-selection-completed', handleGuaranteeSelected);
        
        // Verificar si el toast sigue activo y cerrarlo con un mensaje apropiado
        // Esto ocurrirá solo si el evento no se disparó correctamente
        if (window.localStorage.getItem('auto_select_guarantee')) {
          console.log('[MobilePaymentContainer] Tiempo máximo alcanzado, limpiando recursos');
          window.localStorage.removeItem('auto_select_guarantee');
          window.localStorage.removeItem('guarantee_selection_timestamp');
          toast.success('Proceso completado', { id: 'guarantee-setup' });
        }
      }, 5000); // 5 segundos como timeout, reducido de 10 segundos para una mejor experiencia
    } else {
      // Para otros tipos, abrir el modal normalmente
      onShowPaymentTypes();
    }
  };

  const isMobilePublic = viewType === "mobile" && isPublicView;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden"
    >
      {isMobilePublic && (
        <>
          <MobileNavigation
            theme={theme}
            onPrev={currentView === 'details' ? onPrev : () => setCurrentView('details')}
            isPublicView={isPublicView}
            className="absolute top-6 left-6 z-50"
          />
          <MobileNextButton
            theme={theme}
            onNext={handleNext}
            isDisabled={currentView === 'payment' && (!selectedPaymentType || !selectedPaymentMethod)}
            isPublicView={isPublicView}
            viewType={viewType}
            variant="default"
          />
        </>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-y-auto"
      >
        <div className="min-h-full flex flex-col">
          <MobileReservationHeader
            theme={theme}
            total={calculations.total}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.2,
              ease: "easeOut"
            }}
            className={cn(
              "flex-1 bg-white dark:bg-neutral-900",
              "rounded-t-[2rem] -mt-8",
              "shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)]",
              "dark:shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.5)]",
              "relative z-10"
            )}
          >
            <AnimatePresence mode="wait">
              {currentView === 'details' ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  className="divide-y divide-gray-100 dark:divide-gray-800"
                >
                  <div className="px-6 py-6">
                    <ReservationDetails
                      theme={theme}
                      calculations={calculations}
                      viewType={viewType}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                >
                  <div className="px-6 pt-6 pb-3">
                    {/* Titulo y subtitulo para la sección de pagos */}
                    <SectionTitle 
                      theme={theme}
                      title="Finaliza tu reserva"
                      subtitle="Configura los detalles de pago para confirmar tu reserva"
                    />
                    
                    <PriceBreakdown
                      theme={theme}
                      calculations={calculations}
                      onShowItemsDetails={onShowItemsDetails}
                      viewType={viewType}
                      hideDetails={true}
                    />
                  </div>
                  
                  <div className="px-6 py-4">
                    {/* Selector de tipo de pago con lista desplegable */}
                    <PaymentTypeSelector
                      theme={theme}
                      selectedType={localSelectedType || selectedPaymentType}
                      onSelect={handlePaymentTypeSelect}
                      empresaId={empresaId}
                      onShowPaymentTypes={onShowPaymentTypes}
                      onShowCardModal={onShowPaymentMethods}
                      onRemovePaymentType={onRemovePaymentType}
                    />
                  </div>
                  
                  {/* 
                    En vista móvil no necesitamos PaymentTypeSection porque:
                    1. PaymentTypeSelector ya muestra el tipo seleccionado
                    2. Evitamos duplicar información en la pantalla
                    3. El usuario aún puede cambiar el tipo usando PaymentTypeSelector
                    
                    Sin embargo, en caso de que este componente se reutilice en vista desktop 
                    o se necesite por cualquier motivo en el futuro, lo dejamos condicionalmente
                    visible solo cuando viewType no sea "mobile".
                  */}
                  {viewType !== 'mobile' && selectedPaymentType && (
                    <div className="px-6 py-4" data-payment-type-section>
                      <PaymentTypeSection
                        theme={theme}
                        selectedType={selectedPaymentType}
                        onShowTypes={onShowPaymentTypes}
                        onRemoveType={onRemovePaymentType}
                      />
                    </div>
                  )}
                  
                  <div className="px-6 py-4 pb-24">
                    {/* Título para la sección de método de pago */}
                    <div className="flex items-center justify-between mb-2">
                      <p className={cn(
                        "text-sm font-medium",
                        theme === 'dark' ? "text-gray-300" : "text-gray-700"
                      )}>
                        Selecciona tu método de pago
                      </p>
                    </div>
                    
                    <PaymentSection
                      theme={theme}
                      selectedMethod={selectedPaymentMethod}
                      onShowMethods={onShowPaymentMethods}
                      onRemoveMethod={onRemovePaymentMethod}
                      viewType={viewType}
                      empresaId={empresaId}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Aplicar el HOC con opciones específicas para móvil
export const MobilePaymentContainer = withResponsiveView(MobilePaymentContainerBase, {
  fullWidth: true,
  disableWrapper: true
});