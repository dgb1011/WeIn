'use client'

import { useEffect, useState } from 'react'

interface ClientProviderProps {
  children: React.ReactNode
}

export function ClientProvider({ children }: ClientProviderProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return null
  }

  return <>{children}</>
} 