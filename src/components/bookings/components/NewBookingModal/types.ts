export type BookingType = 'simple_shift' | 'class';

export type BookingStep = 
  | 'participants'
  | 'rentals'
  | 'payment'
  | 'confirmation'
  | 'class-details'
  | 'class-schedule';

export interface ClassDetails {
  name: string
  description: string
  visibility: 'public' | 'private'
  branch_id?: string
}

export interface ClassPaymentConfig {
  paymentMethods: string[]
  currency: string
  paymentStatus: string
}

export interface TimeSlot {
  startTime: string
  endTime: string
  price: number
  capacity: number
  instructors: string[]
  courtIds: string[]
}

export interface ScheduleConfig {
  startDate: Date
  endDate?: Date
  isRecurring: boolean
  weekDays: number[]
  timeSlots: TimeSlot[]
}

export interface BookingState {
  currentStep: BookingStep
  selectedBookingType: BookingType
  selectedDate: Date | null
  selectedCourts: string[]
  timeSelection: {
    startTime: string
    endTime: string
  }
  classDetails: ClassDetails
  classPaymentConfig: ClassPaymentConfig
  scheduleConfig: ScheduleConfig
} 