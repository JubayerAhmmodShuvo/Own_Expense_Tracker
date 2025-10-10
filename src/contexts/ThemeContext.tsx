'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check system preference first
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme') as Theme
    
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setThemeState(savedTheme)
    } else {
      // Use system preference as default
      setThemeState(prefersDark ? 'dark' : 'light')
    }
    
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // console.log('Applying theme:', theme)
    
    // Apply theme to document
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      // console.log('Added dark class to document')
    } else {
      root.classList.remove('dark')
      // console.log('Removed dark class from document')
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme)
    
    // Force a re-render by updating a data attribute
    root.setAttribute('data-theme', theme)
    
    // console.log('Document classes after change:', root.className)
    // console.log('Document data-theme:', root.getAttribute('data-theme'))
    
    // Force body background change
    document.body.style.backgroundColor = theme === 'dark' ? '#111827' : '#f9fafb'
    // console.log('Body background set to:', document.body.style.backgroundColor)
  }, [theme, mounted])

  const toggleTheme = () => {
    setThemeState(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light'
      // console.log('Theme changing from', prev, 'to', newTheme)
      return newTheme
    })
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
