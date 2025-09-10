import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface UnifiedSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showResultCount?: boolean
  resultCount?: number
  totalCount?: number
}

export function UnifiedSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
  showResultCount = true,
  resultCount,
  totalCount
}: UnifiedSearchProps) {
  const searchId = `search-${Math.random().toString(36).substr(2, 9)}`
  const resultsId = `${searchId}-results`

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search Input */}
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Search
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <Input
          id={searchId}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
          aria-describedby={showResultCount ? resultsId : undefined}
          role="searchbox"
          autoComplete="off"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
            aria-label="Clear search"
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Search Results Summary */}
      {showResultCount && (resultCount !== undefined || totalCount !== undefined) && (
        <div 
          id={resultsId}
          className="flex justify-between items-center text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>
            {value && resultCount !== undefined && totalCount !== undefined && (
              <>
                {resultCount === 0 
                  ? `No results for "${value}"`
                  : `${resultCount} of ${totalCount} results${value ? ` for "${value}"` : ''}`
                }
              </>
            )}
            {!value && totalCount !== undefined && (
              `${totalCount} total items`
            )}
          </span>
          {value && (
            <span className="text-primary font-medium" aria-label="Search is active">
              🔍 Active Search
            </span>
          )}
        </div>
      )}
    </div>
  )
}