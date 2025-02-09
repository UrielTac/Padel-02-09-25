"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react'
import { useClasses } from '../hooks'
import { useClassRegistration } from '../context'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { ErrorMessage } from '../shared/ErrorMessage'
import { StepContainer } from '../shared/StepContainer'
import { StepHeader, StepSection } from '../shared/StepSection'
import { cn } from '@/lib/utils'
import type { PublicClass } from '../types/models'
import { useRouter } from 'next/navigation'
import { LinkService } from '../services/linkService'

interface Filters {
  type: 'all' | 'single' | 'recurring'
  branchId: string | null
}

export function ClassSelectionStep() {
  const router = useRouter()
  const { state, selectClass, organization } = useClassRegistration()
  const { classes = [], isLoading, error } = useClasses(organization?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    type: 'all',
    branchId: null
  })
  const [companySlug, setCompanySlug] = useState<string | null>(null)
  const skipPackageRef = useRef(false)
  const linkService = new LinkService()

  // Efecto para obtener el slug de la empresa
  useEffect(() => {
    const fetchCompanySlug = async () => {
      if (organization?.id) {
        const link = await linkService.getCompanyLink(organization.id)
        if (link?.slug) {
          setCompanySlug(link.slug)
        }
      }
    }
    fetchCompanySlug()
  }, [organization?.id])

  // Obtener sedes únicas de las clases
  const uniqueBranches = useMemo(() => {
    const branches = new Map()
    classes.forEach(classItem => {
      if (classItem.branchInfo) {
        branches.set(classItem.branchInfo.id, classItem.branchInfo)
      }
    })
    return Array.from(branches.values())
  }, [classes])

  // Filtrar clases
  const filteredClasses = useMemo(() => {
    return classes.filter(classItem => {
      // Filtrar por búsqueda
      const matchesSearch = searchQuery === '' || 
        classItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classItem.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Filtrar por tipo de clase
      const matchesType = filters.type === 'all' || 
        (filters.type === 'single' && !classItem.is_recurring) ||
        (filters.type === 'recurring' && classItem.is_recurring)

      // Filtrar por sede
      const matchesBranch = !filters.branchId || 
        classItem.branchInfo?.id === filters.branchId

      return matchesSearch && matchesType && matchesBranch
    })
  }, [classes, searchQuery, filters])

  // Efecto para redirigir si no hay paquete seleccionado
  useEffect(() => {
    // Solo redirigir si:
    // - No hay paquete seleccionado
    // - No es usuario invitado
    // - No ha decidido explícitamente saltar la selección de paquete
    if (!state.selectedPackage && !state.isGuest && !state.skipPackageSelection) {
      // La redirección ahora se maneja a través de la navegación principal
      return
    }
  }, [state.selectedPackage, state.isGuest, state.skipPackageSelection])

  const handleClassClick = async (classData: PublicClass) => {
    try {
      // Solo actualizamos el estado con la clase seleccionada
      selectClass(classData)
    } catch (error) {
      console.error('Error al seleccionar la clase:', error)
    }
  }

  // Función para manejar la navegación al siguiente paso
  const handleNext = () => {
    if (state.selectedClass && companySlug) {
      // Actualizamos la URL y navegamos al siguiente paso
      const newUrl = `/clases/${companySlug}/${state.selectedClass.id}`
      router.push(newUrl, { scroll: false })
      goToStep('session')
    }
  }

  // Estado de carga inicial
  if (isLoading && !classes.length) {
    return (
      <StepContainer stepId="class-loading">
        <StepSection>
          <div className="text-center space-y-4">
            <LoadingSpinner />
            <p className="text-sm text-gray-500">
              Cargando clases disponibles...
            </p>
          </div>
        </StepSection>
      </StepContainer>
    )
  }

  // Estado de error
  if (error) {
    return (
      <StepContainer stepId="class-error">
        <StepSection>
          <ErrorMessage error={{
            type: 'LOAD_ERROR',
            message: 'Error al cargar las clases disponibles'
          }} />
        </StepSection>
      </StepContainer>
    )
  }

  // Estado sin clases disponibles
  if (!classes || classes.length === 0) {
    return (
      <StepContainer stepId="no-classes">
        <StepSection>
          <div className="text-center space-y-4">
            <div className="bg-yellow-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                No hay clases disponibles
              </h2>
              <p className="text-sm text-yellow-700">
                En este momento no hay clases disponibles. Por favor, intenta más tarde.
              </p>
            </div>
          </div>
        </StepSection>
      </StepContainer>
    )
  }

  return (
    <StepContainer stepId="class-selection">
      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
        <StepHeader 
          title="Elige tu clase"
          subtitle="Selecciona la clase a la que deseas asistir"
        />

        {/* Barra de búsqueda y filtros */}
        <div className="mt-6 space-y-4">
          <div className="flex gap-3">
            {/* Barra de búsqueda */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <IconSearch className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar clases..."
                className={cn(
                  "w-full pl-10 pr-4 py-2.5",
                  "bg-white border border-gray-200",
                  "rounded-lg text-sm text-gray-900",
                  "placeholder:text-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                  "transition-colors duration-200"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center"
                >
                  <IconX className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2.5 rounded-lg",
                "border border-gray-200",
                "text-sm font-medium",
                "flex items-center gap-2",
                "transition-colors duration-200",
                showFilters 
                  ? "bg-gray-100 text-gray-900 border-gray-300"
                  : "bg-white text-gray-700 hover:border-gray-300"
              )}
            >
              <IconFilter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
              {/* Tipo de clase */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Tipo de clase
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm",
                      "transition-colors duration-200",
                      filters.type === 'all'
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, type: 'single' }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm",
                      "transition-colors duration-200",
                      filters.type === 'single'
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    Clase única
                  </button>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, type: 'recurring' }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm",
                      "transition-colors duration-200",
                      filters.type === 'recurring'
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    Clase recurrente
                  </button>
                </div>
              </div>

              {/* Filtro por sede */}
              {uniqueBranches.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Sede
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, branchId: null }))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm",
                        "transition-colors duration-200",
                        !filters.branchId
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      Todas las sedes
                    </button>
                    {uniqueBranches.map(branch => (
                      <button
                        key={branch.id}
                        onClick={() => setFilters(prev => ({ ...prev, branchId: branch.id }))}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm",
                          "transition-colors duration-200",
                          filters.branchId === branch.id
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {branch.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de clases filtradas */}
        <div className="mt-6 flex flex-col gap-4">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                No se encontraron clases con los filtros seleccionados
              </p>
            </div>
          ) : (
            filteredClasses.map((classItem) => {
              const isSelected = state.selectedClass?.id === classItem.id
              const truncatedDescription = classItem.description?.length > 120 
                ? `${classItem.description.slice(0, 120)}...`
                : classItem.description
              
              return (
                <button
                  key={classItem.id}
                  onClick={() => handleClassClick(classItem)}
                  className={cn(
                    "w-full rounded-lg border text-left",
                    "transition-all duration-200",
                    isSelected
                      ? "bg-gray-50 border-gray-900/10 ring-1 ring-gray-900/5"
                      : "bg-white border-gray-200 hover:border-gray-300",
                    "hover:shadow-sm"
                  )}
                >
                  {/* Contenedor principal con padding adaptativo */}
                  <div className="p-4 sm:p-5">
                    {/* Encabezado con título y precio */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {classItem.title}
                          </h3>
                        </div>

                        {/* Precio y horario */}
                        {classItem.schedule.timeSlots[0] && (
                          <div className="text-right shrink-0">
                            <p className="text-lg font-semibold text-gray-900">
                              ${classItem.schedule.timeSlots[0].price.toLocaleString('es-AR')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {classItem.schedule.timeSlots[0].startTime} - {classItem.schedule.timeSlots[0].endTime}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Etiqueta y descripción truncada */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-gray-600">
                          {classItem.is_recurring ? 'Clase recurrente' : 'Clase única'}
                        </span>

                        {truncatedDescription && (
                          <p className="text-sm text-gray-500">
                            {truncatedDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Información del profesor y sede */}
                    <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
                      {classItem.instructor && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span className="font-medium">Profesor:</span>
                          <span className="truncate">{classItem.instructor}</span>
                        </div>
                      )}
                      {classItem.branchInfo && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span className="font-medium">Sede:</span>
                          <span className="truncate">{classItem.branchInfo.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Información adicional */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Días: </span>
                          <span className="truncate">{classItem.schedule.daysOfWeek.join(', ')}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">Cupos: </span>
                          <span>{classItem.schedule.timeSlots[0]?.spotsLeft || 0} disponibles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </StepContainer>
  )
} 