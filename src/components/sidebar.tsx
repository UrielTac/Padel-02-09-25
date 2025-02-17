"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Menu,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
  Calendar,
  Users,
  FileSpreadsheet,
  Link as LinkIcon,
  ChevronLeft,
  Building2,
  Network,
  Users2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useBranches } from '@/hooks/useBranches'
import { Branch } from '@/types/branch'
import { IconLoader } from '@tabler/icons-react'
import { ConfirmBranchDialog } from "@/components/ui/confirm-branch-dialog"
import { useBranchContext } from '@/contexts/BranchContext'
import useOrganization from '@/hooks/useOrganization'
import { Zap } from "lucide-react"
import { UpgradeModal } from "@/components/modals/upgrade-modal"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { BookingLimitStatus } from '@/components/booking/BookingLimitStatus'
import { PromoCard } from "@/components/sidebar/PromoCard"

// Función auxiliar para obtener las iniciales
function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return 'N/A'
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Función para truncar texto largo
function truncateText(text: string, maxLength: number = 20): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

// Función para verificar si una ruta está activa
function isRouteActive(currentPath: string, menuPath: string): boolean {
  // Normalizar las rutas eliminando trailing slashes y convertir a minúsculas
  const normalizedCurrentPath = currentPath.toLowerCase().replace(/\/+$/, '')
  const normalizedMenuPath = menuPath.toLowerCase().replace(/\/+$/, '')
  
  // Casos especiales
  if (normalizedMenuPath === '/admin/dashboard') {
    return normalizedCurrentPath === normalizedMenuPath
  }
  
  // Comparación exacta
  if (normalizedCurrentPath === normalizedMenuPath) {
    return true
  }
  
  // Verificar si es una subruta
  if (normalizedCurrentPath.startsWith(normalizedMenuPath + '/')) {
    // Evitar falsos positivos con rutas similares
    // Ejemplo: /admin/dashboard/forms no debe activar /admin/dashboard/form-settings
    const nextChar = normalizedCurrentPath.charAt(normalizedMenuPath.length)
    return nextChar === '/' || nextChar === ''
  }
  
  return false
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const menuItems = [
  {
    title: "Reservas",
    href: "/admin/dashboard/bookings",
    icon: Calendar,
    exact: true
  },
  {
    title: "Usuarios",
    href: "/admin/dashboard/users",
    icon: Users,
    exact: true
  },
  {
    title: "Artículos",
    href: "/admin/dashboard/pricing",
    icon: FileSpreadsheet,
    exact: true
  },
  {
    title: "Links",
    href: "/admin/dashboard/forms-a",
    icon: LinkIcon,
    exact: false
  }
]

const settingsMenuItems = [
  {
    title: "Empresa",
    value: "company",
    icon: Building2
  },
  {
    title: "Sedes",
    value: "branches",
    icon: FileSpreadsheet
  },
  {
    title: "Integraciones",
    value: "integrations",
    icon: Network
  },
  {
    title: "Miembros",
    value: "members",
    icon: Users2
  }
]

// Extraer la lógica de cierre de sesión a un hook personalizado
function useSignOut() {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      // No necesitamos hacer nada más aquí, ya que signOut maneja todo
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión')
    }
  }

  return handleSignOut
}

function SidebarHeader() {
  const { 
    branches, 
    isLoading, 
    isError,
    currentBranch,
    setCurrentBranch
  } = useBranches()
  const [branchToSwitch, setBranchToSwitch] = useState<Branch | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  const handleBranchSelection = async (branch: Branch, event: React.MouseEvent) => {
    if (currentBranch?.id === branch.id) return
    
    const button = event.currentTarget as HTMLElement
    const rect = button.getBoundingClientRect()
    
    setPopupPosition({
      x: rect.right + 10,
      y: rect.top - 10
    })
    
    setBranchToSwitch(branch)
  }

  const handleConfirmBranchChange = async () => {
    if (branchToSwitch) {
      await setCurrentBranch(branchToSwitch)
      setBranchToSwitch(null)
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 p-4 cursor-pointer hover:bg-accent rounded-lg transition-colors">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-black flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {isLoading ? (
                  <IconLoader className="h-3.5 w-3.5 animate-spin" />
                ) : isError ? (
                  'ERR'
                ) : currentBranch ? (
                  getInitials(currentBranch.name)
                ) : (
                  'N/A'
                )}
              </span>
            </div>
            <div className="flex-1 min-w-0 pl-4">
              <h3 className="text-[15px] font-medium truncate">
                {isLoading ? 'Cargando...' : isError ? 'Error al cargar sucursales' : truncateText(currentBranch?.name || 'Sin sucursal')}
              </h3>
              <p className="text-sm text-gray-500 truncate">Plan gratuito</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-2" align="start" side="right">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <IconLoader className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            ) : isError ? (
              <div className="text-sm text-red-500 text-center py-4">
                Error al cargar las sucursales
              </div>
            ) : branches.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No hay sedes disponibles
              </div>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={(e) => handleBranchSelection(branch, e)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-sm",
                    currentBranch?.id === branch.id && "bg-accent"
                  )}
                >
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium">{getInitials(branch.name)}</span>
                  </div>
                  <span className="font-medium truncate">{branch.name}</span>
                </button>
              ))
            )}
            <div className="border-t my-2" />
            <Link
              href="/dashboard/settings"
              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-sm text-muted-foreground"
            >
              <span>Administrar sucursales</span>
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmBranchDialog
        isOpen={!!branchToSwitch}
        onClose={() => setBranchToSwitch(null)}
        onConfirm={handleConfirmBranchChange}
        currentBranch={currentBranch}
        newBranch={branchToSwitch}
        position={popupPosition}
      />
    </>
  )
}

function SidebarFooter() {
  const router = useRouter()
  const pathname = usePathname()
  const handleSignOut = useSignOut()

  const handleConfigClick = () => {
    router.push('/admin/dashboard/settings?tab=company')
  }

  return (
    <div className="mt-auto border-t border-slate-200/25">
      {/* Opciones de configuración y salida */}
      <div className="p-3 space-y-1">
        <button 
          onClick={handleConfigClick}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl w-full",
            "text-gray-500 hover:text-gray-900",
            "hover:bg-white hover:shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
            "transition-all duration-200",
            "group text-[14px] font-medium"
          )}
        >
          <Settings className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
          Configuración
        </button>

        <button 
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-2 px-4 py-2 rounded-xl",
            "text-gray-500 hover:text-red-600",
            "hover:bg-white hover:shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
            "transition-all duration-200",
            "group text-[14px] font-medium"
          )}
        >
          <LogOut className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
          Cerrar sesión
        </button>
      </div>

      {/* Información del usuario */}
      <div className="px-3 py-3">
        <div className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl",
          "bg-white/20 backdrop-blur-sm",
          "border border-slate-200/60",
          "shadow-[inset_0_0_1px_rgba(0,0,0,0.02)]",
          "hover:bg-white/30 transition-colors duration-200"
        )}>
          <div className={cn(
            "h-8 w-8 rounded-full",
            "bg-black text-white",
            "flex items-center justify-center",
            "shadow-[0_2px_3px_rgba(0,0,0,0.1)]"
          )}>
            <span className="text-xs font-medium">GC</span>
          </div>
          <span className="text-[13px] font-medium text-gray-600">George Clooney</span>
        </div>
      </div>
    </div>
  )
}

function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const handleSignOut = useSignOut()

  return (
    <div className="flex h-full flex-col bg-gray-50/10">
      <div className="pt-3">
        <SidebarHeader />
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-3 mt-6">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 px-4 py-2 text-[14px] font-medium rounded-xl transition-all duration-200",
                "border border-transparent",
                "group",
                isRouteActive(pathname, item.href)
                  ? "bg-white border-gray-100 text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  : "text-gray-500 hover:bg-white hover:border-gray-100 hover:text-gray-900 hover:shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                item.exact ? "exact-match" : "partial-match"
              )}
            >
              <item.icon 
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200 ease-out",
                  "group-hover:scale-110",
                  item.title === "Links" && "-scale-x-100"
                )} 
              />
              {item.title}
              {isRouteActive(pathname, item.href) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <PromoCard />
      <SidebarFooter />
    </div>
  )
}

// Rutas donde no queremos mostrar el sidebar
const HIDDEN_SIDEBAR_ROUTES = [
  '/',
  '/page',
  '/admin/page',
  '/admin',
  '/admin/',
  '/admin/dashboard/forms-a/new'
] as const

// Función para verificar si el sidebar debe ocultarse
function shouldHideSidebar(pathname: string): boolean {
  return HIDDEN_SIDEBAR_ROUTES.includes(pathname as any) || 
         pathname.startsWith('/admin/page')
}

// Añadir el componente de configuración
function SettingsView({ 
  onBack, 
  activeTab,
  onTabChange
}: { 
  onBack: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    onTabChange(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`/admin/dashboard/settings?${params.toString()}`)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <button
          onClick={onBack}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            "text-gray-500 hover:text-gray-900",
            "bg-white/50 hover:bg-white",
            "border border-gray-200/60",
            "shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
            "transition-all duration-200",
            "text-[13px] font-medium"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-3 mt-2">
          {settingsMenuItems.map((item) => (
            <button 
              key={item.value}
              onClick={() => handleTabChange(item.value)}
              className={cn(
                "relative flex items-center gap-2.5 px-4 py-2 text-[14px] font-medium rounded-xl transition-all duration-200",
                "border border-transparent",
                "group text-left w-full",
                activeTab === item.value
                  ? "bg-white border-gray-100 text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  : "text-gray-500 hover:bg-white hover:border-gray-100 hover:text-gray-900 hover:shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              )}
            >
              <item.icon 
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200 ease-out",
                  "group-hover:scale-110"
                )} 
              />
              {item.title}
              {activeTab === item.value && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}

function SidebarContent() {
  const pathname = usePathname()
  
  return (
    <>
      <div className="pt-3">
        <SidebarHeader />
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 px-3 mt-6">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 px-4 py-2 text-[14px] font-medium rounded-xl transition-all duration-200",
                "border border-transparent",
                "group",
                isRouteActive(pathname, item.href)
                  ? "bg-white border-gray-100 text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  : "text-gray-500 hover:bg-white hover:border-gray-100 hover:text-gray-900 hover:shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                item.exact ? "exact-match" : "partial-match"
              )}
            >
              <item.icon 
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200 ease-out",
                  "group-hover:scale-110",
                  item.title === "Links" && "-scale-x-100"
                )} 
              />
              {item.title}
              {isRouteActive(pathname, item.href) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <PromoCard />
      <SidebarFooter />
    </>
  )
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentBranch, setCurrentBranch } = useBranchContext()
  const { branches } = useBranches()
  const [isVisible, setIsVisible] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState("company")
  const [previousPath, setPreviousPath] = useState<string | null>(null)
  const handleSignOut = useSignOut()
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    setIsVisible(!shouldHideSidebar(pathname))
  }, [pathname])

  // Si el sidebar debe ocultarse, no renderizamos nada
  if (!isVisible) {
    return null
  }

  const handleBranchSelect = (branch: Branch) => {
    console.log('🔄 Seleccionando sede:', branch)
    setCurrentBranch(branch)
  }

  const toggleSettings = () => {
    if (!showSettings) {
      // Guardamos la ruta actual antes de mostrar configuración
      setPreviousPath(pathname)
      // Redirigimos a la configuración con la pestaña "empresa" activa
      router.push('/admin/dashboard/settings?tab=company')
    } else {
      // Volvemos a la ruta anterior
      if (previousPath) {
        router.push(previousPath)
      }
    }
    setShowSettings(prev => !prev)
    setActiveSettingsTab("company")
  }

  const handleSettingsTabChange = (tab: string) => {
    setActiveSettingsTab(tab)
    router.push(`/admin/dashboard/settings?tab=${tab}`)
  }

  return (
    <Sheet>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="outline" size="icon" className="w-10 h-10">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] p-0">
        <MobileNav />
      </SheetContent>
      <aside
        className={cn(
          "fixed hidden h-screen bg-[#F5F5F5] lg:block w-[240px] z-30 overflow-hidden",
          "transition-all duration-300 ease-in-out",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full",
          className || ""
        )}
      >
        <div className="relative h-full">
          {/* Contenido principal */}
          <div 
            className={cn(
              "absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out",
              showSettings ? "-translate-x-full" : "translate-x-0"
            )}
          >
            <div className="pt-3">
              <SidebarHeader />
            </div>
            <ScrollArea className="flex-1">
              <nav className="flex flex-col gap-1 px-3 mt-6">
                {menuItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2.5 px-4 py-2 text-[14px] font-medium rounded-xl transition-all duration-200",
                      "border border-transparent",
                      "group",
                      isRouteActive(pathname, item.href)
                        ? "bg-white border-gray-100 text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        : "text-gray-500 hover:bg-white hover:border-gray-100 hover:text-gray-900 hover:shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                      item.exact ? "exact-match" : "partial-match"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200 ease-out",
                        "group-hover:scale-110",
                        item.title === "Links" && "-scale-x-100"
                      )} 
                    />
                    {item.title}
                    {isRouteActive(pathname, item.href) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}
                  </Link>
                ))}
              </nav>
            </ScrollArea>
            <PromoCard />
            <div className="mt-auto border-t border-slate-200/25">
              {/* Opciones de configuración y salida */}
              <div className="p-3 space-y-1">
                <button 
                  onClick={toggleSettings}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl w-full",
                    "text-gray-500 hover:text-gray-900",
                    "hover:bg-white hover:shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                    "transition-all duration-200",
                    "group text-[14px] font-medium"
                  )}
                >
                  <Settings className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                  Configuración
                </button>

                <button 
                  onClick={handleSignOut}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2 rounded-xl",
                    "text-gray-500 hover:text-red-600",
                    "hover:bg-white hover:shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                    "transition-all duration-200",
                    "group text-[14px] font-medium"
                  )}
                >
                  <LogOut className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                  Cerrar sesión
                </button>
              </div>

              {/* Información del usuario */}
              <div className="px-3 py-3">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl",
                  "bg-white/20 backdrop-blur-sm",
                  "border border-slate-200/60",
                  "shadow-[inset_0_0_1px_rgba(0,0,0,0.02)]",
                  "hover:bg-white/30 transition-colors duration-200"
                )}>
                  <div className={cn(
                    "h-8 w-8 rounded-full",
                    "bg-black text-white",
                    "flex items-center justify-center",
                    "shadow-[0_2px_3px_rgba(0,0,0,0.1)]"
                  )}>
                    <span className="text-xs font-medium">GC</span>
                  </div>
                  <span className="text-[13px] font-medium text-gray-600">George Clooney</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vista de configuración */}
          <div 
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-in-out",
              showSettings ? "translate-x-0" : "translate-x-full"
            )}
          >
            <SettingsView 
              onBack={toggleSettings}
              activeTab={activeSettingsTab}
              onTabChange={handleSettingsTabChange}
            />
          </div>
        </div>
      </aside>
    </Sheet>
  )
}
