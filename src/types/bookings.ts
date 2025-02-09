export type PopupView = 'actions' | 'blocking' | 'shift-info' | 'shift-details' | 'shift-payment' | 'rentals'

export interface GuestForm {
  id: string
  fullName: string
  dni: string
  email: string
  phone?: string
}

export interface ConfirmedBooking {
  courtId: string
  startTime: string
  endTime: string
  guests: GuestForm[]
  type: 'shift' | 'class'
  maxParticipants?: number
  isWaitingList?: boolean
  title?: string
  description?: string
  payment: PaymentDetails & {
    timestamp: string
  }
}

export interface PaymentDetails {
  totalAmount: number
  deposit: number
  paymentStatus: PaymentStatusEnum
  paymentMethod: PaymentMethodEnum
  isPaid: boolean
  manualPrice?: number
  courtPrice?: number
}

export interface RentalSelection {
  itemId: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  duration?: number
}

export interface Selection {
  selections: {
    courtId: string
    startTime: string
    endTime: string
    slots: number
  }[]
  startCourtId: string
  endCourtId: string
  startTime: string
  endTime: string
  slots: number
}

export interface Court {
  id: string
  name: string
  branch_id: string
  sport: string
  court_type: string
  surface: string
  is_active: boolean
}

export type PaymentStatusEnum = 'pending' | 'partial' | 'completed' | 'cancelled'
export type PaymentMethodEnum = 'cash' | 'stripe' | 'transfer'
export type ParticipantRoleEnum = 'player' | 'guest'

export interface BookingCreationData {
  courtId: string
  date: string
  startTime: string
  endTime: string
  title?: string
  description?: string
  courtPrice: number
  rentalItemsPrice: number
  paymentStatus: PaymentStatusEnum
  paymentMethod: PaymentMethodEnum
  depositAmount?: number
  participants?: BookingParticipant[]
  rentalItems?: Array<{
    itemId: string
    quantity: number
    pricePerUnit: number
  }>
}

export interface BookingParticipant {
  id: string;
  memberId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  name?: string;
}

export interface RentalItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  pricePerUnit?: number;
}

export const PAYMENT_METHODS = {
  CARD: 'card',
  CASH: 'cash',
  TRANSFER: 'transfer'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export interface Booking {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  totalPrice: number;
  paymentStatus: PaymentStatusEnum;
  paymentMethod: PaymentMethodEnum;
  depositAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type BookingType = 'shift' | 'class'

export interface ClassDetails {
  name: string
  description: string
}

export interface ClassScheduleConfig {
  isRecurring: boolean
  startDate?: Date
  endDate?: Date
  weekDays: number[]
  timeSlots: Array<{
    startTime: string
    endTime: string
  }>
}

export type BookingStep = 'participants' | 'rentals' | 'payment' | 'confirmation'

interface BookingPopupProps {
  selection: Selection | null
  isOpen: boolean
  onClose: () => void
  onViewChange: (view: PopupView) => void
  onConfirmBooking?: () => void
  shiftTitle?: string
  shiftDescription?: string
  paymentDetails: PaymentDetails
  guests: GuestForm[]
  selectedRentals: RentalSelection[]
}

export interface ExistingBooking {
  id: string
  courtId: string
  startTime: string
  endTime: string
  price: number
  totalAmount: number
  paymentStatus: 'pending' | 'partial' | 'completed'
  guests?: Array<{
    firstName: string
    lastName: string
  }>
  rentalItems?: Array<{
    name: string
    quantity: number
    pricePerUnit: number
  }>
}

export interface StatusHistoryEntry {
  status: PaymentStatusEnum
  date: string
}

export interface Participant {
  id: string;
  memberId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  name: string;
}

export interface SelectedBooking {
  id: string
  courtId: string
  court: string
  date: string
  startTime: string
  endTime: string
  totalAmount: number
  depositAmount: number
  courtPrice: number
  rentalItemsPrice: number
  paymentStatus: PaymentStatusEnum
  paymentMethod: PaymentMethodEnum
  title?: string
  description?: string
  participants: Array<{
    id: string
    memberId: string
    firstName?: string
    lastName?: string
    role: string
  }>
  rentedItems?: Array<{
    id: string
    name: string
    quantity: number
    pricePerUnit: number
  }>
}

export interface TimeSelection {
  startTime: string
  endTime: string
  duration?: number
}

