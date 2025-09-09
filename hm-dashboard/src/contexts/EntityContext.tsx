import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiEndpoints } from '@/lib/api'

interface Entity {
  id: string
  name: string
  sector: string
  location: string
}

interface EntityContextType {
  entities: Entity[]
  selectedEntityId: string | 'all'
  setSelectedEntityId: (id: string | 'all') => void
  selectedEntity: Entity | null
  isLoading: boolean
}

const EntityContext = createContext<EntityContextType | undefined>(undefined)

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<string | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch entities from API
  useEffect(() => {
    async function fetchEntities() {
      try {
        const response = await fetch(apiEndpoints.entities)
        const data = await response.json()
        setEntities(data)
      } catch (error) {
        console.error('Failed to fetch entities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntities()
  }, [])

  const selectedEntity = selectedEntityId === 'all' 
    ? null 
    : entities.find(e => e.id === selectedEntityId) || null

  const value: EntityContextType = {
    entities,
    selectedEntityId,
    setSelectedEntityId,
    selectedEntity,
    isLoading,
  }

  return (
    <EntityContext.Provider value={value}>
      {children}
    </EntityContext.Provider>
  )
}

export function useEntity() {
  const context = useContext(EntityContext)
  if (context === undefined) {
    throw new Error('useEntity must be used within an EntityProvider')
  }
  return context
}