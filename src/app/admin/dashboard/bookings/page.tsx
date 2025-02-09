"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BookingsTable } from "@/components/bookings/BookingsTable"
import { CourtsTable } from "@/components/bookings/CourtsTable"
import { NewBookingModal } from "@/components/bookings/NewBookingModal/index"
import { useBookings } from '@/hooks/useBookings'
import { ClassesTable } from "@/components/bookings/classes/ClassesTable"

export default function BookingsPage() {
  const { bookings, isLoading } = useBookings()
  
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList>
          <TabsTrigger 
            value="bookings"
            className="data-[state=inactive]:text-gray-500"
          >
            Reservaciones
          </TabsTrigger>
          <TabsTrigger 
            value="courts"
            className="data-[state=inactive]:text-gray-500"
          >
            Canchas
          </TabsTrigger>
          <TabsTrigger 
            value="classes"
            className="data-[state=inactive]:text-gray-500"
          >
            Clases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <div className="bg-card">
            <BookingsTable />
          </div>
        </TabsContent>

        <TabsContent value="courts">
          <div className="bg-card">
            <CourtsTable />
          </div>
        </TabsContent>

        <TabsContent value="classes">
          <div className="bg-card">
            <ClassesTable />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 