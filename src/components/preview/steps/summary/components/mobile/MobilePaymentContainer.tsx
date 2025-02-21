import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PriceBreakdown } from "../PriceBreakdown";
import { PaymentTypeSection } from "../PaymentTypeSection";
import { PaymentSection } from "../PaymentSection";
import { withResponsiveView } from "../../hoc/withResponsiveView";
import { PaymentMethod, PaymentTypeEnum, SelectedItem } from "../../types";

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
  empresaId
}: MobilePaymentContainerProps) {
  if (viewType !== 'mobile') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-20"
    >
      {/* Separador */}
      <div className={cn(
        "border-b",
        theme === 'dark' ? "border-zinc-800" : "border-gray-200/50"
      )} />

      {/* Contenedor principal con padding consistente */}
      <div className="space-y-6 px-4">
        {/* PriceBreakdown sin borde inferior */}
        <PriceBreakdown
          theme={theme}
          calculations={calculations}
          onShowItemsDetails={onShowItemsDetails}
          className="bg-transparent hover:bg-transparent"
        />

        {/* Sección de Tipo de Pago */}
        <PaymentTypeSection
          theme={theme}
          selectedType={selectedPaymentType}
          onShowTypes={onShowPaymentTypes}
          onRemoveType={onRemovePaymentType}
        />

        {/* Sección de Método de Pago */}
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
  );
}

// Aplicar el HOC con estilos específicos para móvil
export const MobilePaymentContainer = withResponsiveView(MobilePaymentContainerBase, {
  styleKey: 'container'
}); 