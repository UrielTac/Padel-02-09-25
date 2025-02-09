import { theme } from '@/config/theme'
import type { ThemeBreakpoint, ThemeContainer, ThemeSpacing } from '@/config/theme'

/**
 * Obtiene una variable CSS del tema
 */
export function getCssVar(variable: string): string {
  return `var(--${variable})`
}

/**
 * Obtiene un valor de breakpoint del tema
 */
export function getBreakpoint(breakpoint: ThemeBreakpoint): string {
  return getCssVar(`breakpoint-${breakpoint}`)
}

/**
 * Obtiene un valor de contenedor del tema
 */
export function getContainer(size: ThemeContainer = '2xl'): string {
  return getCssVar(`container-${size}`)
}

/**
 * Obtiene un valor de espaciado del tema
 */
export function getSpacing(space: ThemeSpacing): string {
  return getCssVar(`spacing-${space}`)
}

/**
 * Genera una media query para un breakpoint específico
 */
export function mediaQuery(breakpoint: ThemeBreakpoint): string {
  return `@media (min-width: ${getBreakpoint(breakpoint)})`
}

/**
 * Genera clases de Tailwind para padding responsivo
 */
export function responsivePadding(type: 'page' | 'container' | 'section'): string {
  return `
    p-[var(--padding-${type}-mobile)]
    sm:p-[var(--padding-${type}-tablet)]
    lg:p-[var(--padding-${type}-desktop)]
  `
}

/**
 * Genera clases de Tailwind para gap responsivo
 */
export function responsiveGap(size: 'small' | 'medium' | 'large' | 'xlarge'): string {
  return `gap-[var(--gap-${size})]`
}

/**
 * Genera clases de Tailwind para márgenes responsivos
 */
export function responsiveMargin(direction: 'x' | 'y' | 't' | 'b' | 'l' | 'r'): string {
  const prefix = direction === 'x' ? 'mx' : direction === 'y' ? 'my' : `m${direction}`
  return `
    ${prefix}-[var(--padding-container-mobile)]
    sm:${prefix}-[var(--padding-container-tablet)]
    lg:${prefix}-[var(--padding-container-desktop)]
  `
}

/**
 * Genera clases de Tailwind para bordes redondeados
 */
export function getBorderRadius(size: 'sm' | 'default' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'): string {
  return `rounded-[var(--radius-${size})]`
}

/**
 * Genera clases de Tailwind para z-index
 */
export function getZIndex(layer: 'negative' | 'elevate' | 'sticky' | 'header' | 'dropdown' | 'modal' | 'toast' | 'tooltip'): string {
  return `z-[var(--z-${layer})]`
}

/**
 * Genera clases de Tailwind para transiciones
 */
export function getTransition(speed: 'fast' | 'normal' | 'slow'): string {
  return `transition-all duration-[var(--transition-${speed})] ease-[var(--transition-timing)]`
} 