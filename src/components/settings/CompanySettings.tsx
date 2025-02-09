"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { IconUpload } from "@tabler/icons-react"
import { Card } from "@/components/ui/card"

interface CompanyData {
  name: string
  description: string
  email: string
  phone: string
  website: string
  logo?: File | null
  enableNotifications: boolean
  enableBookingReminders: boolean
}

export function CompanySettings() {
  const [formData, setFormData] = useState<CompanyData>({
    name: "Padel Club",
    description: "Club deportivo especializado en pádel",
    email: "info@padelclub.com",
    phone: "+34 123 456 789",
    website: "www.padelclub.com",
    logo: null,
    enableNotifications: true,
    enableBookingReminders: true
  })

  const handleInputChange = (field: keyof CompanyData, value: string | boolean | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    console.log("Guardando cambios:", formData)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo de la empresa */}
        <div className="col-span-2 space-y-2">
          <label className="text-sm font-medium">Logo de la empresa</label>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
              {formData.logo ? (
                <img 
                  src={URL.createObjectURL(formData.logo)} 
                  alt="Logo" 
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <IconUpload className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <Button 
              variant="outline"
              onClick={() => document.getElementById('logo-input')?.click()}
              className="flex items-center px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200 text-sm font-medium text-black"
            >
              Cambiar logo
            </Button>
            <input
              id="logo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleInputChange('logo', e.target.files?.[0] || null)}
            />
          </div>
        </div>

        {/* Información básica */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre de la empresa</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full pb-2 border-b border-gray-300 focus:border-black outline-none transition-colors bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Correo electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pb-2 border-b border-gray-300 focus:border-black outline-none transition-colors bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full pb-2 border-b border-gray-300 focus:border-black outline-none transition-colors bg-transparent"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sitio web</label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full pb-2 border-b border-gray-300 focus:border-black outline-none transition-colors bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              className="w-full p-2 border border-gray-300 focus:border-black outline-none transition-colors bg-transparent resize-none rounded-md h-[115px]"
            />
          </div>
        </div>

        {/* Configuraciones adicionales */}
        <div className="col-span-2 space-y-4 mt-8">
          <h3 className="text-lg font-medium">Configuraciones adicionales</h3>
          
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Notificaciones por email</label>
                <p className="text-sm text-muted-foreground">
                  Recibir notificaciones sobre reportes de análisis y estadísticas
                </p>
              </div>
              <Switch
                checked={formData.enableNotifications}
                onCheckedChange={(checked) => handleInputChange('enableNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Recordatorios de reservas</label>
                <p className="text-sm text-muted-foreground">
                  Enviar recordatorios automáticos de reservas
                </p>
              </div>
              <Switch
                checked={formData.enableBookingReminders}
                onCheckedChange={(checked) => handleInputChange('enableBookingReminders', checked)}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end pt-6 border-t">
        <Button 
          onClick={handleSave}
          className="bg-black hover:bg-gray-800 text-white transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  )
} 