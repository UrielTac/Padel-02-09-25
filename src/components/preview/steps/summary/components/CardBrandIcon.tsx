import { cn } from "@/lib/utils";

interface CardBrandIconProps {
  brand: string;
  className?: string;
}

const BRAND_ICONS = {
  visa: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102h2.037zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.039.756.367 1.01.603 1.006.931-.005.503-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.563m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.544l-2.904 6.952h2.036l.403-1.118h2.479l.234 1.118m-2.144-2.604l1.02-2.815.587 2.815h-1.607zm-4.988-4.892l-1.602 7.496H11.44l1.601-7.496h2.033z"/>
    </svg>
  ),
  mastercard: (
    <svg className="w-full h-full" viewBox="0 0 24 24">
      <path fill="#EA001B" d="M15.245 17.831h-6.49V6.168h6.49v11.663z"/>
      <path fill="#FFA200" d="M9.224 12c0-2.366 1.11-4.473 2.832-5.832a7.942 7.942 0 00-4.832-1.636C3.179 4.532 0 7.711 0 11.756S3.179 19.224 7.224 19.224c1.85 0 3.555-.632 4.908-1.692A7.948 7.948 0 019.224 12z"/>
      <path fill="#00A2E5" d="M24 11.756c0 4.045-3.179 7.224-7.224 7.224-1.85 0-3.555-.632-4.908-1.692a7.948 7.948 0 002.908-6.144c0-2.366-1.11-4.473-2.832-5.832a7.942 7.942 0 014.832-1.636C20.821 4.532 24 7.711 24 11.756z"/>
    </svg>
  ),
  amex: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.998 7.466v8.945H0V7.466h23.998zM1.014 9.137l1.492 3.321h.093V9.137h1.726v4.742H2.669l-1.539-3.321h-.093v3.321H0V9.137h1.014zm6.923 0l.415 3.321h.093l.415-3.321h2.049v4.742H9.614v-3.321h-.093l-.6 3.321H7.799l-.6-3.321h-.093v3.321H5.811V9.137h2.126zm6.319 0l1.492 3.321h.093V9.137h1.726v4.742h-1.656l-1.539-3.321h-.093v3.321h-1.726V9.137h1.703zm6.319 0l.415 3.321h.093l.415-3.321H24v4.742h-1.295v-3.321h-.093l-.6 3.321h-1.122l-.6-3.321h-.093v3.321h-1.295V9.137h2.126z"/>
    </svg>
  ),
  discover: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.998 7.466v8.945H0V7.466h23.998zM2.454 9.137v4.742h1.726V9.137H2.454zm6.319 0v4.742h1.726V9.137H8.773zm6.319 0v4.742h1.726V9.137h-1.726zm6.319 0v4.742H24V9.137h-2.589z"/>
    </svg>
  ),
  unknown: (
    <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 16h-2v-2h2v2zm0-4h-2V8h2v6z"/>
    </svg>
  )
};

export function CardBrandIcon({ brand, className }: CardBrandIconProps) {
  // Normalizar el nombre de la marca
  const normalizedBrand = brand.toLowerCase();
  
  // Obtener el icono correspondiente o el de desconocido
  const icon = BRAND_ICONS[normalizedBrand as keyof typeof BRAND_ICONS] || BRAND_ICONS.unknown;

  return (
    <div 
      className={cn(
        "w-8 h-8 flex items-center justify-center",
        "rounded-lg bg-white/10 p-1.5",
        className
      )}
    >
      {icon}
    </div>
  );
} 