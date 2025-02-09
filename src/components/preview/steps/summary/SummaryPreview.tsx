import { FormStepField } from "@/types/form-steps";
import { PreviewContainer } from "../../layout/PreviewContainer";
import { NavigationButtons } from "../../layout/NavigationButtons";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSummaryState } from "./hooks/useSummaryState";
import { PAYMENT_METHODS, AVAILABLE_COUPONS } from "./constants";
import { PriceBreakdown } from "./components/PriceBreakdown";
import { PaymentSection } from "./components/PaymentSection";
import { PaymentTypeSection } from "./components/PaymentTypeSection";
import { CouponsSection } from "./components/CouponsSection";
import { ItemsDetailsModal } from "./modals/ItemsDetailsModal";
import { PaymentMethodModal } from "./modals/PaymentMethodModal";
import { PaymentTypeModal } from "./modals/PaymentTypeModal";
import { CouponsModal } from "./modals/CouponsModal";
import { TotalPrice } from "./components/TotalPrice";
import { PreviewPopup } from "../../shared/PreviewPopup";
import { useState, useEffect } from "react";
import { SummaryStepField } from "@/components/steps/summary/types";
import { PaymentMethod, Coupon, PaymentConfig } from "./types";
import { StripeProvider } from "@/providers/StripeProvider";
import { useFormConfig } from '@/hooks/useFormConfig';
import { Loader2 } from "lucide-react";

interface SummaryPreviewProps {
  field: SummaryStepField;
  theme: 'light' | 'dark';
  viewType: "mobile" | "desktop";
  onNext: () => void;
  onPrev: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isPublicView?: boolean;
  slug: string;
}

export function SummaryPreview({ 
  field, 
  theme, 
  viewType,
  onNext,
  onPrev,
  isFirstStep,
  isLastStep,
  isPublicView = false,
  slug
}: SummaryPreviewProps) {
  const { empresaId, isLoading: isConfigLoading, error: configError } = useFormConfig(slug);
  const [isValidForNextStep, setIsValidForNextStep] = useState(false);
  const [showStripeError, setShowStripeError] = useState(false);
  const [stripeInitialized, setStripeInitialized] = useState(false);

  const { 
    calculations,
    showItemsDetails,
    showPaymentMethods,
    showPaymentTypes,
    showCouponsPanel,
    setShowItemsDetails,
    setShowPaymentMethods,
    setShowPaymentTypes,
    setShowCouponsPanel,
    handleApplyCoupon,
    handleSelectPaymentMethod,
    handleSelectPaymentType,
    handleRemoveCoupon,
    appliedCoupon,
    selectedPaymentMethod,
    selectedPaymentType,
    couponCode,
    setCouponCode,
    couponError,
    setCouponError
  } = useSummaryState();

  const [showPopup, setShowPopup] = useState(false);

  const selectedPaymentMethodData = selectedPaymentMethod 
    ? PAYMENT_METHODS.find(m => m.id === selectedPaymentMethod) ?? null
    : null;

  useEffect(() => {
    const validateStep = () => {
      const isValid = Boolean(
        selectedPaymentType && 
        selectedPaymentMethodData
      );
      setIsValidForNextStep(isValid);
    };

    validateStep();
  }, [selectedPaymentType, selectedPaymentMethodData]);

  useEffect(() => {
    if (!isConfigLoading) {
      if (!empresaId) {
        console.error('[SummaryPreview] Error: No se encontró el ID de empresa');
        setShowStripeError(true);
      } else {
        console.log('[SummaryPreview] ID de empresa encontrado:', empresaId);
        setStripeInitialized(true);
      }
    }
  }, [empresaId, isConfigLoading]);

  const handleNext = () => {
    if (!isValidForNextStep) {
      setCouponError('Por favor, selecciona un método de pago');
      return;
    }
    onNext();
  };

  const handleModalAction = (action: () => void) => {
    if (!isPublicView) {
      setShowPopup(true);
      return;
    }
    action();
  };

  // Renderizar el contenido relacionado con pagos
  const renderStripeContent = () => {
    if (isConfigLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Cargando configuración de pagos...
            </p>
          </div>
        </div>
      );
    }

    if (!empresaId || showStripeError) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-red-500">
            {configError?.message || 'No se pudo cargar el método de pago'}
          </p>
        </div>
      );
    }

    if (!stripeInitialized) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">
            Inicializando sistema de pagos...
          </p>
        </div>
      );
    }

    return (
      <StripeProvider empresaId={empresaId}>
        <PaymentSection
          theme={theme}
          selectedMethod={selectedPaymentMethodData}
          onShowMethods={() => handleModalAction(() => setShowPaymentMethods(true))}
          onRemoveMethod={() => handleSelectPaymentMethod(null)}
          viewType={viewType}
          empresaId={empresaId}
        />

        <PaymentMethodModal
          isOpen={Boolean(showPaymentMethods && isPublicView)}
          onClose={() => setShowPaymentMethods(false)}
          theme={theme}
          viewType={viewType}
          onSelect={handleSelectPaymentMethod}
          empresaId={empresaId}
          isPublicView={isPublicView}
        />

        <PaymentTypeModal
          isOpen={Boolean(showPaymentTypes && isPublicView)}
          onClose={() => setShowPaymentTypes(false)}
          theme={theme}
          viewType={viewType}
          onSelect={(type: string, config?: PaymentConfig) => {
            handleSelectPaymentType(type);
            if (config?.paymentMethodId) {
              handleSelectPaymentMethod(config.paymentMethodId);
            }
          }}
          isPublicView={isPublicView}
        />
      </StripeProvider>
    );
  };

  return (
    <PreviewContainer 
      viewType={viewType} 
      theme={theme}
      onNext={handleNext}
      onPrev={onPrev}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      nextLabel="Reservar"
      prevLabel="Volver"
      isPublicView={isPublicView}
      isNextDisabled={!isValidForNextStep}
    >
      <div className="min-h-full flex flex-col">
        <div className="flex-1">
          <div className="pb-24">
            <div className="space-y-4 px-4 pt-6">
              <TotalPrice total={calculations.total} theme={theme} />

              <PriceBreakdown
                theme={theme}
                calculations={calculations}
                onShowItemsDetails={() => handleModalAction(() => setShowItemsDetails(true))}
              />

              <CouponsSection
                theme={theme}
                appliedCoupon={appliedCoupon}
                onShowCoupons={() => handleModalAction(() => setShowCouponsPanel(true))}
                onRemoveCoupon={handleRemoveCoupon}
              />

              <PaymentTypeSection
                theme={theme}
                selectedType={selectedPaymentType}
                onShowTypes={() => handleModalAction(() => setShowPaymentTypes(true))}
                onRemoveType={() => handleSelectPaymentType(null)}
              />

              {renderStripeContent()}
            </div>
          </div>
        </div>

        <ItemsDetailsModal
          isOpen={Boolean(showItemsDetails && isPublicView)}
          onClose={() => setShowItemsDetails(false)}
          theme={theme}
          viewType={viewType}
          items={calculations.selectedItems}
          isPublicView={isPublicView}
        />

        <CouponsModal
          isOpen={Boolean(showCouponsPanel && isPublicView)}
          onClose={() => setShowCouponsPanel(false)}
          theme={theme}
          viewType={viewType}
          onApply={(code: string) => handleApplyCoupon(code as any)}
          availableCoupons={AVAILABLE_COUPONS}
          isPublicView={isPublicView}
        />

        <PreviewPopup
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          theme={theme}
        />
      </div>
    </PreviewContainer>
  );
} 