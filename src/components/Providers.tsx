'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/sw-registration'
import PWAInstaller from './PWAInstaller'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <PWAInstaller />
      </ThemeProvider>
    </SessionProvider>
  )
}
