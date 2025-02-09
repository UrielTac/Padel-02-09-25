"use client"

import { IconCopy, IconExternalLink, IconInfoCircle, IconLink } from "@tabler/icons-react"
import { useCompanyLink } from "../hooks/useCompanyLink"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CompanyLinkSectionProps {
  branchId?: string
}

export function CompanyLinkSection({ branchId }: CompanyLinkSectionProps) {
  const { companyLink, isLoading, error, copyToClipboard, generateLink, hasExistingLink } = useCompanyLink({ branchId })

  if (!branchId) {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-40 bg-gray-100 rounded" />
          <div className="h-4 w-60 bg-gray-100 rounded mt-2" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-sm text-red-500">Error al cargar el link de la empresa</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {!hasExistingLink ? (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-900">Tu link de clases</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Genera un link para que tus clientes puedan ver y reservar tus clases</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-gray-500">No tienes un link generado para tus clases</p>
          </div>

          <Button
            onClick={generateLink}
            disabled={isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "bg-white hover:bg-white text-black border border-gray-200",
              "transition-colors duration-200"
            )}
          >
            <IconLink className="w-4 h-4" />
            <span>Generar link</span>
          </Button>
        </div>
      ) : (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-900">Tu link de clases</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Comparte este link con tus clientes para que puedan ver y reservar tus clases</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-gray-500">Comparte este enlace para que tus clientes puedan acceder a tus clases</p>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(
              "flex-1 px-3 py-2",
              "bg-gray-50 rounded-lg",
              "text-sm text-gray-600 font-mono",
              "border border-transparent",
              "hover:border-gray-200 transition-colors duration-200"
            )}>
              <span className="truncate">{companyLink}</span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={copyToClipboard}
                  className={cn(
                    "p-2 rounded-lg",
                    "bg-gray-50 hover:bg-gray-100",
                    "text-gray-600 hover:text-gray-900",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-gray-200"
                  )}
                >
                  <IconCopy className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copiar al portapapeles</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={companyLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "p-2 rounded-lg",
                    "bg-gray-50 hover:bg-gray-100",
                    "text-gray-600 hover:text-gray-900",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-gray-200"
                  )}
                >
                  <IconExternalLink className="w-4 h-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Abrir en nueva pestaña</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </TooltipProvider>
  )
} 