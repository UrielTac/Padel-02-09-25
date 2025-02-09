'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HelpCircle, Loader2, LogOut, Building } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useOnboarding } from "../../context/OnboardingContext"

const fadeInVariants = {
  hidden: { 
    opacity: 0,
    y: 20
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

interface BankAccount {
  cbu: string
  alias: string
  holder: string
}

export function IntegrationsStep() {
  const { completeAndAdvance } = useOnboarding()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [showNoPaymentMethodDialog, setShowNoPaymentMethodDialog] = useState(false)
  const [connectedEmail, setConnectedEmail] = useState("")
  
  // Estados para la cuenta bancaria
  const [showBankForm, setShowBankForm] = useState(false)
  const [isBankConnected, setIsBankConnected] = useState(false)
  const [bankData, setBankData] = useState<BankAccount | null>(null)
  const [bankForm, setBankForm] = useState<BankAccount>({
    cbu: '',
    alias: '',
    holder: ''
  })

  // Verificar si al menos un método de pago está configurado
  const hasPaymentMethod = isConnected || isBankConnected

  const handleConnect = () => {
    setIsConnecting(true)
    // Simular conexión
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
      setConnectedEmail("usuario@correo.com")
    }, 2000)
  }

  const handleDisconnect = () => {
    setShowDisconnectDialog(true)
  }

  const confirmDisconnect = () => {
    setIsConnected(false)
    setConnectedEmail("")
    setShowDisconnectDialog(false)
  }

  const handleContinue = () => {
    if (!hasPaymentMethod) {
      setShowNoPaymentMethodDialog(true)
      return
    }
    completeAndAdvance(2)
  }

  const confirmContinueWithoutStripe = () => {
    setShowContinueDialog(false)
    completeAndAdvance(2)
  }

  const handleBankConnect = () => {
    setShowBankForm(true)
  }

  const handleBankDisconnect = () => {
    setIsBankConnected(false)
    setBankData(null)
  }

  const handleBankSubmit = () => {
    setIsBankConnected(true)
    setBankData(bankForm)
    setShowBankForm(false)
  }

  return (
    <motion.div
      className="p-6"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Sección de Stripe */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Conecta tu cuenta de Stripe</h2>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Recomendado
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Stripe es una plataforma de pagos segura que te permite procesar pagos en línea.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Con Stripe, puedes procesar pagos con tarjetas de crédito y débito de manera rápida y segura. 
                El dinero se depositará directamente en tu cuenta bancaria.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Beneficios de usar Stripe:
                </p>
                <ul className="space-y-2">
                  <li className="text-xs text-gray-500 flex items-start">
                    <span className="h-1 w-1 rounded-full bg-gray-300 mt-1.5 mr-2 shrink-0" />
                    <span>Solicita tarjeta como garantía y realiza cobros automáticos por cancelaciones o reservas</span>
                  </li>
                  <li className="text-xs text-gray-500 flex items-start">
                    <span className="h-1 w-1 rounded-full bg-gray-300 mt-1.5 mr-2 shrink-0" />
                    <span>Flexibilidad total: acepta pagos con tarjetas de crédito, débito y métodos locales</span>
                  </li>
                  <li className="text-xs text-gray-500 flex items-start">
                    <span className="h-1 w-1 rounded-full bg-gray-300 mt-1.5 mr-2 shrink-0" />
                    <span>Depósitos inmediatos en tu cuenta bancaria con liquidaciones automáticas</span>
                  </li>
                  <li className="text-xs text-gray-500 flex items-start">
                    <span className="h-1 w-1 rounded-full bg-gray-300 mt-1.5 mr-2 shrink-0" />
                    <span>Seguridad de nivel bancario y protección contra fraudes</span>
                  </li>
                  <li className="text-xs text-gray-500 flex items-start">
                    <span className="h-1 w-1 rounded-full bg-gray-300 mt-1.5 mr-2 shrink-0" />
                    <span>Panel de control intuitivo para gestionar pagos, reembolsos y reportes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Estado de la conexión */}
          <div className="space-y-4">
            {isConnected ? (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Estado de la cuenta</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <p className="text-sm text-gray-600">
                      Cuenta conectada: <span className="font-medium">{connectedEmail}</span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Desconectar cuenta
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                className="w-full sm:w-auto bg-[#635bff] hover:bg-[#635bff]/90 text-white"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
                    Conectando...
                  </>
                ) : (
                  "Conectar con Stripe"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Sección de Cuenta Bancaria */}
        <div className="space-y-4 pt-6 border-t">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Conecta una cuenta bancaria</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Conecta tu cuenta bancaria para recibir los pagos de tus clientes.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Ingresa los datos de tu cuenta bancaria para recibir los pagos directamente.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-900">
                      Información importante sobre los pagos por transferencia
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Es tu responsabilidad verificar que los datos bancarios ingresados sean correctos y monitorear que las transferencias de tus clientes se acrediten correctamente en tu cuenta.
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Para facilitar la verificación, proporcionamos a tus clientes la opción de adjuntar comprobantes de transferencia que podrás revisar desde el panel de administración.
                      </p>
                      <div className="text-xs text-gray-500 bg-white rounded border border-gray-100 p-2 mt-2">
                        <p className="font-medium text-gray-700 mb-1">¿Cómo funciona?</p>
                        <ul className="space-y-1 list-disc pl-4 text-gray-500">
                          <li>Tus clientes realizan la transferencia a tu cuenta</li>
                          <li>Pueden adjuntar una captura del comprobante</li>
                          <li>Recibirás una notificación para verificar el pago</li>
                          <li>Podrás confirmar o rechazar el pago desde el panel</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isBankConnected ? (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Estado de la cuenta</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-sm text-gray-600">
                    Cuenta conectada: <span className="font-medium">{bankData?.holder}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-500">CBU/CVU: {bankData?.cbu}</p>
                <p className="text-xs text-gray-500">Alias: {bankData?.alias}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBankDisconnect}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Desconectar cuenta
              </Button>
            </div>
          ) : showBankForm ? (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cbu">CVU/CBU</Label>
                  <Input
                    id="cbu"
                    value={bankForm.cbu}
                    onChange={(e) => setBankForm(prev => ({ ...prev, cbu: e.target.value }))}
                    placeholder="Ingresa tu CVU o CBU"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="alias">Alias</Label>
                  <Input
                    id="alias"
                    value={bankForm.alias}
                    onChange={(e) => setBankForm(prev => ({ ...prev, alias: e.target.value }))}
                    placeholder="Ingresa el alias de tu cuenta"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="holder">Titular</Label>
                  <Input
                    id="holder"
                    value={bankForm.holder}
                    onChange={(e) => setBankForm(prev => ({ ...prev, holder: e.target.value }))}
                    placeholder="Nombre del titular de la cuenta"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBankForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBankSubmit}
                  disabled={!bankForm.cbu || !bankForm.alias || !bankForm.holder}
                  className="bg-black hover:bg-black/90 text-white"
                >
                  Guardar cuenta
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleBankConnect}
              className="w-full sm:w-auto bg-black hover:bg-black/90 text-white"
            >
              <Building className="h-4 w-4 mr-2" />
              Conectar cuenta bancaria
            </Button>
          )}
        </div>

        {/* Botón de continuar */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleContinue}
            className="px-8"
          >
            Continuar
          </Button>
        </div>

        {/* Diálogo de confirmación para desconectar */}
        <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Desconectar cuenta de Stripe?</AlertDialogTitle>
              <AlertDialogDescription>
                Al desconectar tu cuenta de Stripe, no podrás procesar pagos hasta que vuelvas a conectarla.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDisconnectDialog(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDisconnect}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Desconectar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de confirmación para continuar sin Stripe */}
        <AlertDialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de avanzar sin conectar tu cuenta Stripe?</AlertDialogTitle>
              <AlertDialogDescription>
                Sin una cuenta de Stripe conectada, no podrás procesar pagos en línea. Podrás configurar esto más tarde desde el panel de administración.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowContinueDialog(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowContinueDialog(false)
                  completeAndAdvance(2)
                }}
              >
                Continuar sin Stripe
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de método de pago requerido */}
        <AlertDialog 
          open={showNoPaymentMethodDialog} 
          onOpenChange={setShowNoPaymentMethodDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Método de pago requerido</AlertDialogTitle>
              <AlertDialogDescription>
                Para continuar, debes configurar al menos un método de pago (Stripe o cuenta bancaria).
                Esto es necesario para procesar los pagos de tus clientes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowNoPaymentMethodDialog(false)}>
                Entendido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  )
} 