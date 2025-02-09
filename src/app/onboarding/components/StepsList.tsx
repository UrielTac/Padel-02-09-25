'use client'

import { useOnboarding } from '../context/OnboardingContext'
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export function StepsList() {
  const { currentStep, steps, setCurrentStep, completedSteps, canAccessStep } = useOnboarding()

  return (
    <div className="relative pl-2">
      {/* Lista de pasos */}
      <div className="space-y-8 relative">
        {steps.map((step, index) => {
          const isCompleted = completedSteps[index]
          const isAccessible = canAccessStep(index)
          const isCurrent = currentStep === index

          return (
            <motion.div
              key={step}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group flex items-center gap-4",
                !isAccessible && "opacity-40"
              )}
              onClick={() => isAccessible && setCurrentStep(index)}
            >
              {/* Círculo numerado o check */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                  isCompleted ? "bg-primary border-primary" : "border-gray-300",
                  isCurrent ? "border-primary" : "",
                  isAccessible && !isCompleted ? "group-hover:border-primary/80" : ""
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Check className="h-4 w-4 text-white" />
                  </motion.div>
                ) : (
                  <span className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-primary" : "text-gray-500"
                  )}>
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Contenido del paso */}
              <div
                className={cn(
                  "flex-1 py-1 cursor-pointer transition-all duration-200",
                  !isAccessible && "cursor-not-allowed",
                  isAccessible && "hover:translate-x-1"
                )}
              >
                <p className={cn(
                  "text-sm font-medium transition-colors",
                  isCurrent ? "text-primary" : "text-gray-500",
                  isCompleted && "text-gray-900"
                )}>
                  {step}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}