"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CompanyData {
  name: string
  email: string
  phone: string
  website: string
}

export function CompanySettings() {
  const [formData, setFormData] = useState<CompanyData>({
    name: "Padel Club",
    email: "info@padelclub.com",
    phone: "+34 123 456 789",
    website: "www.padelclub.com"
  })

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    console.log("Guardando cambios:", formData)
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center mb-6">
        <h3 className="text-xl font-medium">Información de la Empresa</h3>
      </div>

      <div className="max-w-[800px] space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2 max-w-[400px]">
              <label className="text-sm text-gray-600">
                Nombre de la empresa
              </label>
              <input
                type="text"
                placeholder="Ej: Padel Club"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  "border border-gray-200 bg-white",
                  "focus:outline-none focus:border-gray-300",
                  "transition-colors duration-200",
                  "placeholder:text-gray-400",
                  "text-sm"
                )}
              />
            </div>

            <div className="space-y-2 max-w-[400px]">
              <label className="text-sm text-gray-600">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="Ej: info@padelclub.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  "border border-gray-200 bg-white",
                  "focus:outline-none focus:border-gray-300",
                  "transition-colors duration-200",
                  "placeholder:text-gray-400",
                  "text-sm"
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 max-w-[400px]">
              <label className="text-sm text-gray-600">
                Teléfono
              </label>
              <input
                type="tel"
                placeholder="Ej: +34 123 456 789"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  "border border-gray-200 bg-white",
                  "focus:outline-none focus:border-gray-300",
                  "transition-colors duration-200",
                  "placeholder:text-gray-400",
                  "text-sm"
                )}
              />
            </div>

            <div className="space-y-2 max-w-[400px]">
              <label className="text-sm text-gray-600">
                Sitio web
              </label>
              <input
                type="text"
                placeholder="Ej: www.padelclub.com"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  "border border-gray-200 bg-white",
                  "focus:outline-none focus:border-gray-300",
                  "transition-colors duration-200",
                  "placeholder:text-gray-400",
                  "text-sm"
                )}
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-start">
          <Button 
            onClick={handleSave}
            className="bg-black hover:bg-gray-800 text-white transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            Guardar cambios
          </Button>
        </div>

        {/* Línea divisoria */}
        <div className="border-t mt-12" />
      </div>
    </div>
  )
} 