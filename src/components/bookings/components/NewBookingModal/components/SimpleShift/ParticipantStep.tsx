import { useState, useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { IconSearch, IconPlus, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { memberService } from "@/services/memberService"
import { SingleSelect } from "@/components/ui/single-select"
import type { Participant } from "../../types"
import { toast } from "sonner"

interface ParticipantStepProps {
  participants: Participant[]
  onParticipantAdd: (participant: Participant) => void
  onParticipantRemove: (participantId: string) => void
}

const genderOptions = [
  { id: "male", name: "Hombre" },
  { id: "female", name: "Mujer" },
  { id: "not_specified", name: "Prefiero no decirlo" }
] as const

interface NewMemberForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
}

export function ParticipantStep({
  participants,
  onParticipantAdd,
  onParticipantRemove
}: ParticipantStepProps) {
  const [showNewUserForm, setShowNewUserForm] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{
    id: string
    fullName: string
    email?: string | null
    phone?: string | null
  }>>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const [newMemberForm, setNewMemberForm] = useState<NewMemberForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: ''
  })

  const handleMemberSearch = useCallback((search: string) => {
    setMemberSearch(search)

    // Limpiar el timeout anterior si existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!search.trim()) {
      setSearchResults([])
      return
    }

    // Debounce la búsqueda para evitar demasiadas llamadas
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      const { data, error } = await memberService.searchMembers(search)
      setIsSearching(false)
      
      if (error) {
        console.error('Error buscando miembros:', error)
        return
      }

      setSearchResults(data || [])
    }, 300)
  }, [])

  // Limpiar el timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleCreateMember = async () => {
    try {
      // Validaciones
      if (!newMemberForm.firstName.trim() || !newMemberForm.lastName.trim()) {
        toast.error('El nombre y apellido son requeridos')
        return
      }

      if (newMemberForm.email && !isValidEmail(newMemberForm.email)) {
        toast.error('El formato del email no es válido')
        return
      }

      const result = await memberService.createMember({
        first_name: newMemberForm.firstName,
        last_name: newMemberForm.lastName,
        email: newMemberForm.email,
        phone: newMemberForm.phone,
        gender: newMemberForm.gender as 'male' | 'female' | 'not_specified',
        status: 'Sin Plan'
      })

      if (result) {
        onParticipantAdd({
          id: result.id,
          fullName: `${result.first_name} ${result.last_name}`.trim(),
          email: result.email || '',
          dni: ''
        })
        
        // Limpiar el formulario
        setNewMemberForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: ''
        })

        // Cambiar a modo búsqueda
        setShowNewUserForm(false)
        
        toast.success('Miembro creado exitosamente')
      }
    } catch (error: any) {
      console.error('Error creando miembro:', error)
      toast.error(error.message || 'Error al crear el miembro')
    }
  }

  return (
    <div className="space-y-6">
      {/* Lista de participantes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Participantes
            </span>
            {participants.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                {participants.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowNewUserForm(!showNewUserForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-white bg-gray-100 hover:bg-gray-900 rounded-full transition-all duration-200"
          >
            {showNewUserForm ? (
              <>
                <IconSearch className="w-3.5 h-3.5" />
                Buscar existente
              </>
            ) : (
              <>
                <IconPlus className="w-3.5 h-3.5" />
                Crear nuevo
              </>
            )}
          </button>
        </div>

        {/* Lista de participantes agregados */}
        {participants.length > 0 && (
          <div className="grid gap-2">
            {participants.map(participant => (
              <div 
                key={participant.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] group hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-900">
                      {participant.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{participant.fullName}</span>
                    <span className="text-xs text-gray-500">
                      {participant.email || participant.dni}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onParticipantRemove(participant.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar participantes */}
        <div className="mt-4">
          {showNewUserForm ? (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 p-4 bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]"
            >
              <div className="space-y-3">
                {/* Nombre y Apellido */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={newMemberForm.firstName}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className={cn(
                        "w-full px-2 py-2",
                        "rounded-lg",
                        "border border-gray-200 bg-white",
                        "focus:outline-none focus:border-gray-300",
                        "transition-colors duration-200",
                        "text-sm"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={newMemberForm.lastName}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className={cn(
                        "w-full px-2 py-2",
                        "rounded-lg",
                        "border border-gray-200 bg-white",
                        "focus:outline-none focus:border-gray-300",
                        "transition-colors duration-200",
                        "text-sm"
                      )}
                    />
                  </div>
                </motion.div>

                {/* Email y Teléfono */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newMemberForm.email}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, email: e.target.value }))}
                      className={cn(
                        "w-full px-2 py-2",
                        "rounded-lg",
                        "border border-gray-200 bg-white",
                        "focus:outline-none focus:border-gray-300",
                        "transition-colors duration-200",
                        "text-sm"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      className={cn(
                        "w-full px-2 py-2",
                        "rounded-lg",
                        "border border-gray-200 bg-white",
                        "focus:outline-none focus:border-gray-300",
                        "transition-colors duration-200",
                        "text-sm"
                      )}
                    />
                  </div>
                </motion.div>

                {/* Género */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-gray-700">
                    Género
                  </label>
                  <SingleSelect
                    value={newMemberForm.gender}
                    onChange={(value) => setNewMemberForm(prev => ({ ...prev, gender: value }))}
                    options={genderOptions}
                    placeholder="Seleccione el género"
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateMember}
                  disabled={!newMemberForm.firstName.trim() || !newMemberForm.lastName.trim()}
                  className={cn(
                    "w-full p-2 rounded-lg text-sm font-medium transition-all duration-200",
                    newMemberForm.firstName.trim() && newMemberForm.lastName.trim()
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Crear Miembro
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Buscar Miembro
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => handleMemberSearch(e.target.value)}
                    className={cn(
                      "w-full px-3 py-2",
                      "rounded-lg",
                      "border border-gray-200 bg-white",
                      "focus:outline-none focus:border-gray-300",
                      "transition-colors duration-200",
                      "placeholder:text-gray-400",
                      "text-sm"
                    )}
                    placeholder="Buscar por nombre, email o teléfono..."
                  />
                </div>
              </div>

              {/* Resultados de búsqueda */}
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <span className="animate-pulse">Buscando...</span>
                  </div>
                </motion.div>
              )}

              {!isSearching && memberSearch.trim() && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100 overflow-hidden"
                >
                  {searchResults.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        onParticipantAdd({
                          id: member.id,
                          fullName: member.fullName,
                          email: member.email || '',
                          dni: ''
                        })
                        setMemberSearch('')
                        setSearchResults([])
                      }}
                      className={cn(
                        "w-full p-3 text-left flex flex-col gap-0.5",
                        "transition-colors duration-150 ease-in-out",
                        "hover:bg-gray-50"
                      )}
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {member.fullName}
                      </span>
                      <div className="flex flex-col">
                        {member.email && (
                          <span className="text-xs text-gray-500">
                            {member.email}
                          </span>
                        )}
                        {member.phone && (
                          <span className="text-xs text-gray-500">
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {!isSearching && memberSearch.trim() && searchResults.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      No se encontraron miembros
                    </p>
                    <button
                      onClick={() => setShowNewUserForm(true)}
                      className="mt-2 text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      ¿Deseas crear un nuevo miembro?
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {!showNewUserForm && participants.length === 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[13px] text-gray-400 text-center"
          >
            Agrega al menos un participante para continuar
          </motion.p>
        )}
      </div>
    </div>
  )
} 