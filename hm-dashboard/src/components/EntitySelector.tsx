import * as React from 'react'
import { useEntity } from '@/contexts/EntityContext'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Building2, Users, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EntitySelector() {
  const { entities, selectedEntityId, setSelectedEntityId, isLoading } = useEntity()
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  // Create options array with "All Entities" option
  const options = React.useMemo(() => {
    const allOption = {
      id: 'all',
      name: 'All Entities',
      sector: 'Aggregate view',
      location: '',
      isAll: true
    }
    return [allOption, ...entities.map(e => ({ ...e, isAll: false }))]
  }, [entities])

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    
    return options.filter(option =>
      option.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      option.sector?.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  // Get current selection display
  const currentSelection = options.find(option => option.id === selectedEntityId)

  const handleSelect = (optionId: string) => {
    setSelectedEntityId(optionId)
    setOpen(false)
    setSearchValue('')
  }

  if (isLoading) {
    return (
      <Button disabled variant="outline" className="w-80 justify-between">
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Loading entities...
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-80 justify-between hover:bg-accent/50"
        >
          <div className="flex items-center gap-2 text-left">
            {currentSelection && 'isAll' in currentSelection && currentSelection.isAll ? (
              <Users className="h-4 w-4 text-blue-600" />
            ) : (
              <Building2 className="h-4 w-4 text-blue-600" />
            )}
            <div className="flex flex-col">
              <span className="font-medium">
                {currentSelection?.name || 'Select entity...'}
              </span>
              {currentSelection && (
                <span className="text-xs text-muted-foreground">
                  {currentSelection.sector || 'No sector'}
                  {currentSelection.location && ` • ${currentSelection.location}`}
                </span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search entities..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
                <div className="text-sm text-muted-foreground">
                  No entities found matching "{searchValue}"
                </div>
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  {'isAll' in option && option.isAll ? (
                    <Users className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Building2 className="h-4 w-4 text-blue-600" />
                  )}
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{option.name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{option.sector || 'No sector'}</span>
                      {option.location && (
                        <>
                          <span>•</span>
                          <span>{option.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      selectedEntityId === option.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}