"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SubscriptionsTable } from "@/components/pricing/SubscriptionsTable"
import { PackagesTable } from "@/components/pricing/PackagesTable"
import { CouponsTable } from "@/components/pricing/CouponsTable"
import { ItemsTable } from "@/components/pricing/ItemsTable"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-4 relative z-0">
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="border-b-0 border-slate-200/25 [&:after]:h-px [&:after]:bg-slate-200/25">
          <TabsTrigger value="items">Artículos</TabsTrigger>
          <TabsTrigger value="coupons">Cupones</TabsTrigger>
          
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="opacity-60">
                <TabsTrigger 
                  value="subscriptions"
                  className="data-[state=inactive]:text-gray-500 pointer-events-none"
                  disabled
                >
                  Membresías
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent 
                className="bg-black text-white text-xs px-2 py-1 rounded"
                sideOffset={5}
              >
                Próximamente
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="opacity-60">
                <TabsTrigger 
                  value="packages"
                  className="data-[state=inactive]:text-gray-500 pointer-events-none"
                  disabled
                >
                  Paquetes
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent 
                className="bg-black text-white text-xs px-2 py-1 rounded"
                sideOffset={5}
              >
                Próximamente
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsList>

        <TabsContent value="items">
          <div className="bg-card">
            <ItemsTable />
          </div>
        </TabsContent>

        <TabsContent value="coupons">
          <div className="bg-card">
            <CouponsTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
