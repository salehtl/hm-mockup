import { createContext, useContext, type ReactNode } from 'react'

interface PageSlicersContextType {
  slicers: ReactNode | null
  setSlicers: (slicers: ReactNode | null) => void
}

const PageSlicersContext = createContext<PageSlicersContextType | undefined>(undefined)

export function usePageSlicers() {
  const context = useContext(PageSlicersContext)
  if (context === undefined) {
    throw new Error('usePageSlicers must be used within a PageSlicersProvider')
  }
  return context
}

interface PageSlicersProviderProps {
  children: ReactNode
  slicers: ReactNode | null
  setSlicers: (slicers: ReactNode | null) => void
}

export function PageSlicersProvider({ children, slicers, setSlicers }: PageSlicersProviderProps) {
  return (
    <PageSlicersContext.Provider value={{ slicers, setSlicers }}>
      {children}
    </PageSlicersContext.Provider>
  )
}