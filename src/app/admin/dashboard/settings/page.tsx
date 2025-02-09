"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CompanySettings } from "@/components/settings/CompanySettings"
import { BranchSettings } from "@/components/settings/BranchSettings"
import { BillingSettings } from "@/components/settings/BillingSettings"
import { MembersSettings } from "@/components/settings/MembersSettings"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger 
            value="company"
            className="data-[state=inactive]:text-gray-500"
          >
            Empresa
          </TabsTrigger>
          <TabsTrigger 
            value="branches"
            className="data-[state=inactive]:text-gray-500"
          >
            Sedes
          </TabsTrigger>
          <TabsTrigger 
            value="billing"
            className="data-[state=inactive]:text-gray-500"
          >
            Facturación
          </TabsTrigger>
          <TabsTrigger 
            value="members"
            className="data-[state=inactive]:text-gray-500"
          >
            Miembros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <div className="bg-card">
            <CompanySettings />
          </div>
        </TabsContent>

        <TabsContent value="branches">
          <div className="bg-card">
            <BranchSettings />
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="bg-card">
            <BillingSettings />
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="bg-card">
            <MembersSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 