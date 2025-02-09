"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useClassRegistration } from '../context/ClassRegistrationContext'
import { UserPackageService } from '../services'
import { StepContainer } from '../shared/StepContainer'
import { StepHeader, StepSection, StepGrid, StepActions } from '../shared/StepSection'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { useUserPackages } from '../hooks/useUserPackages'
import type { Database } from '@/types/supabase'
import type { UserPackageFromDB, ClassSession } from '../types/models'

const SESSIONS_PER_PAGE = 4

export function SessionStep() {
  // 1. Estados locales
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [validBranchNames, setValidBranchNames] = useState<string[]>([])
  const [isPackageValidForClass, setIsPackageValidForClass] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isInitializing, setIsInitializing] = useState(true)

  // 2. Hooks y contexto
  const { state, selectSession, deselectSession, goToStep } = useClassRegistration()
  const { activePackage, isLoading: isLoadingPackage } = useUserPackages()
  const supabase = createClientComponentClient<Database>()

  // 3. Memos para datos derivados
  const currentSessions = useMemo(() => {
    console.log('Sessions en state:', state.selectedClass?.sessions)
    if (!state.selectedClass?.sessions) return []
    const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE
    const endIndex = startIndex + SESSIONS_PER_PAGE
    const sessions = state.selectedClass.sessions.slice(startIndex, endIndex)
    console.log('Sessions procesadas:', sessions)
    return sessions
  }, [state.selectedClass?.sessions, currentPage])

  const totalPages = useMemo(() => {
    if (!state.selectedClass?.sessions) return 0
    return Math.ceil(state.selectedClass.sessions.length / SESSIONS_PER_PAGE)
  }, [state.selectedClass?.sessions])

  // 4. Funciones memorizadas
  const checkPackageValidity = useCallback(async () => {
    if (!activePackage || !state.selectedClass?.branchInfo?.id) {
      setIsPackageValidForClass(false)
      return
    }

    const branchIds = activePackage.package?.branch_ids || []
    
    try {
      const { data: branches } = await supabase
        .from('sedes')
        .select('name')
        .in('id', branchIds)

      if (branches) {
        setValidBranchNames(branches.map(branch => branch.name))
      }

      const isValid = branchIds.includes(state.selectedClass.branchInfo.id)
      setIsPackageValidForClass(isValid)
    } catch (error) {
      console.error('Error al verificar sedes válidas:', error)
      setIsPackageValidForClass(false)
    }
  }, [activePackage, state.selectedClass?.branchInfo?.id, supabase])

  // 5. Efecto principal
  useEffect(() => {
    const initializeStep = async () => {
      if (state.isGuest || isLoadingPackage) {
        setIsInitializing(false)
        return
      }

      await checkPackageValidity()
      setIsInitializing(false)
    }

    initializeStep()
  }, [state.isGuest, isLoadingPackage, checkPackageValidity])

  // 6. Funciones de manejo de eventos
  const handleSessionClick = useCallback((sessionId: string) => {
    // Si la sesión ya está seleccionada, la deseleccionamos
    if (state.selectedSessions.includes(sessionId)) {
      deselectSession(sessionId)
      return
    }

    // Si hay otra sesión seleccionada, primero la deseleccionamos
    if (state.selectedSessions.length > 0) {
      state.selectedSessions.forEach(id => deselectSession(id))
    }

    // Seleccionamos la nueva sesión
    selectSession(sessionId)
  }, [state.selectedSessions, selectSession, deselectSession])

  // 7. Funciones de formato
  const formatSessionDate = useCallback((dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    
    const dayName = format(date, 'EEEE', { locale: es })
    const dayNumber = format(date, 'd', { locale: es })
    const monthName = format(date, 'MMMM', { locale: es })
    
    return {
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      dayNumber,
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1)
    }
  }, [])

  // 8. Early returns
  if (isInitializing || isLoadingPackage) {
    return (
      <StepContainer stepId="session-loading" centered>
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <p className="text-sm text-gray-500">
            Cargando información de la sesión...
          </p>
        </div>
      </StepContainer>
    )
  }

  if (!state.selectedClass) {
    return (
      <StepContainer stepId="no-class-selected" centered>
        <div className="text-center space-y-4">
          <div className="bg-yellow-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              No hay clase seleccionada
            </h2>
            <p className="text-sm text-yellow-700">
              Por favor, selecciona una clase antes de continuar.
            </p>
          </div>
        </div>
      </StepContainer>
    )
  }

  // 9. Variables computadas
  const isLongDescription = (state.selectedClass?.description?.length ?? 0) > 150
  const displayDescription = showFullDescription 
    ? state.selectedClass?.description 
    : state.selectedClass?.description?.slice(0, 150) + '...'

  // 10. Render principal
  return (
    <StepContainer stepId="session-selection">
      <div className="w-full max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
        <StepHeader 
          title="Elige tus sesiones"
          subtitle="Selecciona las sesiones a las que deseas asistir"
        />

        <div className="mt-6 flex flex-col gap-4 max-w-[800px] mx-auto">
          {/* Información del paquete activo si existe */}
          {activePackage && (
            <div className={cn(
              "w-full max-w-[800px] mx-auto",
              "rounded-lg p-4",
              isPackageValidForClass ? "bg-blue-50/80" : "bg-yellow-50/80"
            )}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-sm font-medium",
                    isPackageValidForClass ? "text-blue-800" : "text-yellow-800"
                  )}>
                    Paquete activo: {activePackage.package?.name}
                  </h3>
                  {isPackageValidForClass && (
                    <span className="text-sm text-blue-600">
                      {activePackage.sessions_left} {activePackage.sessions_left === 1 ? 'sesión' : 'sesiones'} disponibles
                    </span>
                  )}
                </div>
                
                {isPackageValidForClass ? (
                  <p className="text-xs text-blue-500">
                    Válido hasta {format(new Date(activePackage.expires_at), 'd MMMM yyyy', { locale: es })}
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-yellow-700">
                      Este paquete no es válido para esta clase ya que pertenece a otra sede.
                    </p>
                    <p className="text-xs text-yellow-600">
                      Sedes válidas: {validBranchNames.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información de la clase */}
          <div className="w-full max-w-[800px] mx-auto rounded-lg border border-gray-200 bg-white p-5">
            <div className="space-y-4">
              {/* Encabezado y detalles principales */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {state.selectedClass.title}
                </h2>
                
                {state.selectedClass.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {displayDescription}
                    {isLongDescription && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="ml-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        {showFullDescription ? 'Ver menos' : 'Ver más'}
                      </button>
                    )}
                  </p>
                )}
              </div>

              {/* Características de la clase */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  <span>{state.selectedClass.is_recurring ? 'Clase recurrente' : 'Clase única'}</span>
                  {state.selectedClass.branchInfo && (
                    <>
                      <span>•</span>
                      <span>Sede: {state.selectedClass.branchInfo.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grid de sesiones */}
          <div className="w-full max-w-[800px] mx-auto">
            <StepGrid className="grid-cols-1">
              {currentSessions.map((session) => {
                const { dayName, dayNumber, month } = formatSessionDate(session.date)
                const isSelected = state.selectedSessions.includes(session.id)

                return (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session.id)}
                    className={cn(
                      // Clases base
                      "w-full",
                      "rounded-lg border p-4 text-left transition-all",
                      "hover:border-blue-200 hover:bg-blue-50/50",
                      // Layout
                      "grid grid-cols-1 md:grid-cols-3 items-center",
                      "gap-4",
                      // Estados
                      isSelected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                        : "border-gray-200 bg-white",
                      // Accesibilidad
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    )}
                    aria-pressed={isSelected}
                    title={isSelected ? "Sesión seleccionada" : "Seleccionar sesión"}
                  >
                    {/* Fecha y hora */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {dayName}, {dayNumber} de {month}
                      </p>
                      <p className="text-sm text-gray-600">
                        {session.startTime} - {session.endTime}
                      </p>
                    </div>

                    {/* Instructor y cancha */}
                    <div className="space-y-1">
                      {session.instructor && (
                        <p className="text-sm text-gray-600 truncate">
                          <span className="font-medium">Instructor:</span> {session.instructor}
                        </p>
                      )}
                      {session.courts && session.courts.length > 0 && (
                        <p className="text-sm text-gray-600 truncate">
                          <span className="font-medium">Cancha:</span> {session.courts[0].name}
                        </p>
                      )}
                    </div>

                    {/* Precio y cupos */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {typeof session.price === 'number' 
                          ? session.price.toLocaleString('es-AR', {
                              style: 'currency',
                              currency: 'ARS',
                            })
                          : 'Precio no disponible'
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        {session.spotsLeft} {session.spotsLeft === 1 ? 'cupo' : 'cupos'} disponibles
                      </p>
                    </div>
                  </button>
                )
              })}
            </StepGrid>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "h-8 w-8 rounded-full text-sm font-medium",
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </StepContainer>
  )
}