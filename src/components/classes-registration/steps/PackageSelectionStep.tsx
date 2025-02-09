"use client"

import { useState, useMemo } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { usePackages } from '../hooks'
import { useClassRegistration } from '../context'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { ErrorMessage } from '../shared/ErrorMessage'
import { StepContainer } from '../shared/StepContainer'
import { StepHeader, StepSection, StepGrid, StepActions } from '../shared/StepSection'
import { cn } from '@/lib/utils'
import type { Organization, ClassPackage } from '../types/models'

interface PackageSelectionStepProps {
  organization: Organization
}

// Aumentamos el número de paquetes por página para mostrar 4 en una vista
const PACKAGES_PER_PAGE = 4

export function PackageSelectionStep({ organization }: PackageSelectionStepProps) {
  const { state, dispatch, goToStep } = useClassRegistration()
  const { packages = [], isLoading, error, createUserPackage } = usePackages(organization.id)
  const [currentPage, setCurrentPage] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  // Calcular el número total de páginas
  const totalPages = Math.ceil(packages.length / PACKAGES_PER_PAGE)

  // Obtener los paquetes de la página actual
  const currentPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * PACKAGES_PER_PAGE
    const endIndex = startIndex + PACKAGES_PER_PAGE
    return packages.slice(startIndex, endIndex)
  }, [packages, currentPage])

  const handlePackageClick = async (packageId: string) => {
    try {
      setIsProcessing(true)
      
      // Crear el paquete de usuario
      const userPackage = await createUserPackage(packageId)
      
      if (userPackage) {
        // Actualizar el estado con el paquete seleccionado
        const selectedPackage = packages.find(p => p.id === packageId)
        if (selectedPackage) {
          dispatch({ type: 'SET_SELECTED_PACKAGE', payload: selectedPackage })
        }
      }
    } catch (error) {
      console.error('Error al procesar el paquete:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Funciones de navegación
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  if (isLoading) {
    return (
      <StepContainer stepId="package-loading">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-sm text-gray-500">
            Cargando paquetes disponibles...
          </p>
        </div>
      </StepContainer>
    )
  }

  if (error) {
    return (
      <StepContainer stepId="package-error">
        <ErrorMessage error={{
          type: 'LOAD_ERROR',
          message: 'Error al cargar los paquetes disponibles'
        }} />
      </StepContainer>
    )
  }

  if (!packages || packages.length === 0) {
    return (
      <StepContainer stepId="no-packages">
        <div className="text-center space-y-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              No hay paquetes disponibles
            </h2>
            <p className="text-sm text-yellow-700">
              En este momento no hay paquetes disponibles. Por favor, intenta más tarde.
            </p>
          </div>
        </div>
      </StepContainer>
    )
  }

  return (
    <StepContainer stepId="package-selection" centered={false}>
      <StepHeader 
        title="Elige tu paquete"
        subtitle="Selecciona un paquete de clases para continuar"
      />

      <div className="w-full max-w-3xl mx-auto">
        {/* Grid de paquetes en dos columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentPackages.map((packageItem: ClassPackage) => {
            const isSelected = state.selectedPackage?.id === packageItem.id
            
            return (
              <button
                key={packageItem.id}
                onClick={() => handlePackageClick(packageItem.id)}
                disabled={isProcessing}
                className={cn(
                  "relative w-full rounded-lg border text-left",
                  "transition-all duration-200",
                  isProcessing ? "opacity-50 cursor-not-allowed" : "hover:shadow-sm hover:border-gray-300",
                  isSelected
                    ? "bg-gray-50 border-gray-900/10 ring-1 ring-gray-900/5"
                    : "bg-white border-gray-200"
                )}
              >
                {/* Contenedor principal con padding reducido */}
                <div className="p-3 sm:p-4">
                  {/* Encabezado del paquete */}
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-medium text-gray-900 flex-1">
                        {packageItem.title}
                      </h3>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${packageItem.price.toLocaleString('es-AR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {packageItem.numberOfClasses} {packageItem.numberOfClasses === 1 ? 'clase' : 'clases'}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {packageItem.description}
                    </p>
                  </div>

                  {/* Información principal en grid */}
                  <div className="mt-3">
                    <div>
                      <p className="font-medium text-gray-700">Duración</p>
                      <p className="text-gray-600">{packageItem.expiration_days} días</p>
                    </div>
                  </div>

                  {/* Sedes disponibles simplificadas */}
                  {packageItem.branches && packageItem.branches.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Sedes disponibles
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {packageItem.branches.map((branch, index) => (
                          <span key={branch.id}>
                            {branch.name}
                            {index < packageItem.branches.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}

                  {/* Características en línea */}
                  {packageItem.features && packageItem.features.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600">
                        {packageItem.features.map((feature, index) => (
                          <span key={index}>
                            {feature.text}
                            {index < packageItem.features.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Sistema de paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 rounded-lg",
                    "text-sm font-medium",
                    "transition-colors duration-200",
                    currentPage === page
                      ? "bg-gray-100 text-gray-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-600"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </StepContainer>
  )
}