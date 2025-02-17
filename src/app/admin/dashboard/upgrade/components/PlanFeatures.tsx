"use client"

import { motion } from "framer-motion"
import { Check, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface Feature {
  title: string
  description: string
}

interface PlanFeaturesProps {
  planName: string
  subtitle: string
}

const defaultFeatures: Feature[] = [
  {
    title: "Hasta 500 reservas diarias",
    description: "Gestiona un alto volumen de reservas de manera eficiente y sin limitaciones técnicas."
  },
  {
    title: "Actualizaciones constantes",
    description: "Acceso inmediato a nuevas funcionalidades y mejoras del sistema tan pronto estén disponibles."
  },
  {
    title: "Creación de torneos",
    description: "Próximamente: Organiza y gestiona torneos de pádel con un sistema completo de brackets y seguimiento."
  },
  {
    title: "Sistema de membresías",
    description: "Próximamente: Implementa programas de fidelización y gestiona diferentes niveles de membresía."
  },
  {
    title: "Soporte prioritario 24/7",
    description: "Asistencia técnica dedicada en cualquier momento que lo necesites."
  }
]

export function PlanFeatures({
  planName,
  subtitle
}: PlanFeaturesProps) {
  const containerAnimation = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemAnimation = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  }

  return (
    <div className="h-full bg-zinc-900 p-8 border border-zinc-800">
      <motion.div 
        variants={containerAnimation}
        initial="initial"
        animate="animate"
        className="space-y-8 h-full flex flex-col"
      >
        {/* Header */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-zinc-100">
            Plan {planName}
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Sistema completo de gestión para instalaciones de pádel, 
            diseñado para optimizar tus operaciones diarias y mejorar 
            la experiencia de tus clientes.
          </p>
        </div>

        {/* Subtle Divider */}
        <div className="h-px bg-zinc-800" />

        {/* Features */}
        <div className="space-y-6">
          <h4 className="text-sm font-medium text-zinc-300">
            Características incluidas
          </h4>
          <motion.ul 
            variants={containerAnimation}
            className="space-y-5"
          >
            {defaultFeatures.map((feature, index) => (
              <motion.li
                key={index}
                variants={itemAnimation}
                className="space-y-1"
              >
                <p className="text-sm font-medium text-zinc-200">
                  {feature.title}
                </p>
                <p className="text-sm text-zinc-400">
                  {feature.description}
                </p>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Footer Info */}
        <div className="mt-auto pt-6">
          <div className="h-px bg-zinc-800 mb-6" />
          <div className="rounded-lg bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-400 text-center">
              Mejora tu gestión ahora y descubre todas las ventajas premium.
              Cancela cuando quieras sin compromiso.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 