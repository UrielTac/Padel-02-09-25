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
import { useState, useEffect, useCallback } from "react";
import { SummaryStepField } from "@/components/steps/summary/types";
import { PaymentMethod, Coupon, PaymentConfig } from "./types";
import { StripeProvider } from "@/providers/StripeProvider";
import { useFormConfig } from '@/hooks/useFormConfig';
import { Loader2 } from "lucide-react";
import { StripeConfigProvider } from "@/contexts/StripeConfigContext";
import { useSummaryBooking } from './hooks/use-summary-booking';
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useForm } from '@/contexts/FormContext';

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
  const { state, setPayment } = useForm();

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

  const {
    isValid,
    hasWarnings,
    validationErrors,
    isProcessing
  } = useSummaryBooking({
    onSuccess: () => {
      toast.success('Configuración completada');
    },
    onError: (error) => {
      toast.error(error.message);
      setShowStripeError(true);
    }
  });

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

  useEffect(() => {
    if (selectedPaymentMethod && selectedPaymentType) {
      setPayment({
        method: selectedPaymentMethod.type,
        type: selectedPaymentType,
        config: {
          paymentMethodId: selectedPaymentMethod.id,
          brand: selectedPaymentMethod.brand,
          last4: selectedPaymentMethod.last4
        }
      });
    }
  }, [selectedPaymentMethod, selectedPaymentType, setPayment]);

  const handleNext = useCallback(() => {
    console.log('[SummaryPreview] Intentando avanzar:', {
      isValid,
      hasWarnings,
      selectedPaymentType,
      selectedPaymentMethod
    });

    if (!isValid) {
      const errors = validationErrors
        .map(err => err.message)
        .join('\n');
      toast.error(`Por favor, verifica los siguientes campos:\n${errors}`);
      return;
    }

    if (hasWarnings) {
      toast('Tienes advertencias pendientes', {
        icon: '⚠️',
        style: {
          background: '#fff7ed',
          color: '#9a3412',
          border: '1px solid #fdba74'
        }
      });
    }

    if (!selectedPaymentType || !selectedPaymentMethod) {
      toast.error('Por favor, completa la configuración de pago');
      return;
    }

    console.log('[SummaryPreview] Configuración válida, permitiendo navegación');
    onNext();
  }, [
    isValid,
    validationErrors,
    hasWarnings,
    selectedPaymentType,
    selectedPaymentMethod,
    onNext
  ]);

  const handleModalAction = (action: () => void) => {
    if (!isPublicView) {
      setShowPopup(true);
      return;
    }
    action();
  };

  const handleReservar = async () => {
    if (!isValid) {
      console.warn('Formulario inválido, no se puede proceder');
      return;
    }

    if (!selectedPaymentMethod || !selectedPaymentType) {
      toast.error('Por favor, completa la configuración de pago');
      return;
    }

    console.log('Formulario válido, procediendo a farewell');
    await onNext();
  };

  return (
    <PreviewContainer 
      viewType={viewType} 
      theme={theme}
      onNext={handleReservar}
      onPrev={onPrev}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      nextLabel="Reservar"
      prevLabel="Volver"
      isPublicView={isPublicView}
      isNextDisabled={!isValid || isProcessing}
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

      {isProcessing && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <p className="text-sm text-gray-500 mt-2">Procesando reserva...</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <Button
          onClick={handleReservar}
          disabled={!isValid}
          className="w-full"
        >
          Reservar
        </Button>
      </div>
    </PreviewContainer>
  );
} 