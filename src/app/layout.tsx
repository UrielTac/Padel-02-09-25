import '@/styles/globals.css'
import '@/styles/theme.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from './providers'
import { DateProvider } from "@/contexts/DateContext"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Panel Admin - Padel',
  description: 'Panel administrativo para gestión de canchas de padel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <DateProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </DateProvider>
      </body>
    </html>
  )
}
