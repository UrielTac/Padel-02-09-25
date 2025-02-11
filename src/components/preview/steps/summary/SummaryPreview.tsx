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
import { StripeConfigProvider } from "@/contexts/StripeConfigContext";

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

  useEffect(() => {
    const validateStep = () => {
      const isValid = Boolean(
        selectedPaymentType && 
        selectedPaymentMethod
      );
      setIsValidForNextStep(isValid);
    };

    validateStep();
  }, [selectedPaymentType, selectedPaymentMethod]);

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
      {empresaId && stripeInitialized ? (
        <StripeConfigProvider empresaId={empresaId}>
          <StripeProvider empresaId={empresaId}>
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

                    <PaymentSection
                      theme={theme}
                      selectedMethod={selectedPaymentMethod}
                      onShowMethods={() => handleModalAction(() => setShowPaymentMethods(true))}
                      onRemoveMethod={() => handleSelectPaymentMethod(null)}
                      viewType={viewType}
                      empresaId={empresaId}
                    />
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
                onApply={handleApplyCoupon}
                couponCode={couponCode || ''}
                setCouponCode={setCouponCode}
                error={couponError || ''}
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
                    const paymentMethod: PaymentMethod = {
                      id: config.paymentMethodId,
                      brand: 'card',
                      last4: '',
                      expMonth: 0,
                      expYear: 0,
                      name: 'Tarjeta',
                      description: 'Tarjeta de crédito/débito',
                      type: 'card'
                    };
                    handleSelectPaymentMethod(paymentMethod);
                  }
                }}
                onShowCardModal={() => setShowPaymentMethods(true)}
                isPublicView={isPublicView}
                empresaId={empresaId || ''}
              />

              <PaymentMethodModal
                isOpen={Boolean(showPaymentMethods && isPublicView)}
                onClose={() => setShowPaymentMethods(false)}
                theme={theme}
                viewType={viewType}
                onSelect={handleSelectPaymentMethod}
                empresaId={empresaId || ''}
                isPublicView={isPublicView}
              />

              <PreviewPopup
                isOpen={showPopup}
                onClose={() => setShowPopup(false)}
                theme={theme}
              />
            </div>
          </StripeProvider>
        </StripeConfigProvider>
      ) : (
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

                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">
                    {isConfigLoading ? 'Cargando configuración de pagos...' :
                     !empresaId ? 'No se pudo cargar el método de pago' :
                     'Inicializando sistema de pagos...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PreviewContainer>
  );
} 