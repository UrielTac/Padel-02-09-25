"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StepContainerProps {
  children: ReactNode
  className?: string
  contentClassName?: string
  stepId?: string
  /**
   * Si el contenido debe centrarse verticalmente
   * @default true
   */
  centered?: boolean
}

/**
 * Contenedor principal para todos los pasos del proceso de registro
 * Proporciona layout, animaciones y scroll cuando es necesario
 */
export function StepContainer({ 
  children, 
  className,
  contentClassName,
  stepId = 'step-container',
  centered = true
}: StepContainerProps) {
  return (
    <motion.div
      key={stepId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        // Layout base
        "w-full h-full",
        "max-w-[var(--container-default)]",
        "max-h-[calc(90vh-3rem)]", // Reducido el espacio para la navegación
        // Centrado y scroll
        "mx-auto",
        "overflow-auto scrollbar-custom",
        // Padding horizontal responsivo
        "px-[var(--padding-container-mobile)]",
        "sm:px-[var(--padding-container-tablet)]",
        "lg:px-[var(--padding-container-desktop)]",
        // Padding inferior para la navegación
        "pb-20", // Reducido el espacio para los botones
        className
      )}
    >
      <div className={cn(
        // Layout del contenido
        "w-full h-full",
        "flex flex-col",
        // Centrado condicional
        centered && "justify-center",
        // Espaciado usando variables CSS
        "gap-[var(--gap-medium)]",
        // Padding vertical reducido
        "py-[var(--padding-section-mobile)]",
        "sm:py-[var(--padding-section-tablet)]",
        contentClassName
      )}>
        {children}
      </div>
    </motion.div>
  )
} 