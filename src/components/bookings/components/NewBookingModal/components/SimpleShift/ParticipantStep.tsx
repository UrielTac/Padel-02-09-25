"use client"

import { useState } from 'react'
import { useParticipantSearch } from '@/components/bookings/hooks/useParticipantSearch'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ParticipantStepProps {
  participants: Array<{
    id: string
    fullName: string
    email?: string
  }>
  onParticipantAdd: (participant: any) => void
  onParticipantRemove: (participantId: string) => void
}

export function ParticipantStep({
  participants,
  onParticipantAdd,
  onParticipantRemove
}: ParticipantStepProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: searchResults, isLoading } = useParticipantSearch(searchTerm)

  const handleParticipantSelect = (participant: any) => {
    // Formatear el participante como lo espera el servicio de reservas
    onParticipantAdd({
      id: participant.id,
      fullName: `${participant.first_name} ${participant.last_name}`.trim(),
      email: participant.email,
      role: 'player' // Rol por defecto
    })
    setSearchTerm('')
  }

  return (
    <div className="space-y-6">
      {/* Lista de participantes seleccionados */}
      <div className="space-y-3">
        {participants.map(participant => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-center justify-between",
              "p-3 rounded-lg",
              "bg-gray-50 border border-gray-100"
            )}
          >
            <div>
              <p className="font-medium text-sm">{participant.fullName}</p>
              {participant.email && (
                <p className="text-xs text-gray-500">{participant.email}</p>
              )}
            </div>
            <button
              onClick={() => onParticipantRemove(participant.id)}
              className="text-red-500 hover:text-red-600 text-sm"
            >
              Eliminar
            </button>
          </motion.div>
        ))}
      </div>

      {/* Buscador */}
      <div className="space-y-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar participante..."
          className={cn(
            "w-full px-3 py-2",
            "rounded-lg",
            "border border-gray-200",
            "focus:outline-none focus:ring-2 focus:ring-gray-200",
            "transition-all duration-200"
          )}
        />

        {/* Resultados de búsqueda */}
        {searchTerm.length >= 2 && (
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-gray-500">Buscando...</p>
            ) : searchResults?.length === 0 ? (
              <p className="text-sm text-gray-500">No se encontraron resultados</p>
            ) : (
              <div className="space-y-2">
                {searchResults?.map(result => (
                  <button
                    key={result.id}
                    onClick={() => handleParticipantSelect(result)}
                    className={cn(
                      "w-full text-left",
                      "p-3 rounded-lg",
                      "bg-white border border-gray-200",
                      "hover:bg-gray-50",
                      "transition-colors duration-200"
                    )}
                  >
                    <p className="font-medium text-sm">
                      {`${result.first_name} ${result.last_name}`.trim()}
                    </p>
                    {result.email && (
                      <p className="text-xs text-gray-500">{result.email}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 