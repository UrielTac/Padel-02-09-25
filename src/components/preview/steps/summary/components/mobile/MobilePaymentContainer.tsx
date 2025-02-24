import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PriceBreakdown } from "../PriceBreakdown";
import { PaymentTypeSection } from "../PaymentTypeSection";
import { PaymentSection } from "../PaymentSection";
import { withResponsiveView } from "../../hoc/withResponsiveView";
import { PaymentMethod, PaymentTypeEnum, SelectedItem } from "../../types";
import { MobileNavigation } from "@/components/preview/layout/MobileNavigation";
import { MobileNextButton } from "@/components/preview/layout/MobileNextButton";
import { MobileReservationHeader } from "./MobileReservationHeader";
import { useState, useEffect } from "react";
import { ReservationDetails } from "../ReservationDetails";

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

  if (viewType !== 'mobile') return null;

  const handleNext = () => {
    if (currentView === 'details') {
      setCurrentView('payment');
      return;
    }

    if (!selectedPaymentType || !selectedPaymentMethod) return;
    onNext();
  };

  const isMobilePublic = viewType === "mobile" && isPublicView;

  // Animaciones mejoradas para las transiciones
  const fadeAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { 
      duration: 0.3,
      ease: "easeInOut"
    }
  };

  useEffect(() => {
    if (currentView === 'details') {
        console.log('ReservationDetails se está montando');
    }
  }, [currentView]);

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
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

      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col">
          <MobileReservationHeader
            theme={theme}
            total={calculations.total}
          />

          <motion.div
            initial={false}
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
                  {...fadeAnimation}
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
                  {...fadeAnimation}
                  className="divide-y divide-gray-100 dark:divide-gray-800"
                >
                  <div className="px-6 py-6">
                    <PriceBreakdown
                      theme={theme}
                      calculations={calculations}
                      onShowItemsDetails={onShowItemsDetails}
                      viewType={viewType}
                      hideDetails={true}
                    />
                  </div>
                  <div className="px-6 py-6">
                    <PaymentTypeSection
                      theme={theme}
                      selectedType={selectedPaymentType}
                      onShowTypes={onShowPaymentTypes}
                      onRemoveType={onRemovePaymentType}
                    />
                  </div>
                  <div className="px-6 py-6 pb-24">
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
      </div>
    </div>
  );
}

// Aplicar el HOC con opciones específicas para móvil
export const MobilePaymentContainer = withResponsiveView(MobilePaymentContainerBase, {
  fullWidth: true,
  disableWrapper: true
});