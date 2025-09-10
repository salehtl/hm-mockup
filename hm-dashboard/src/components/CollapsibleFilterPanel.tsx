import { useState, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleFilterPanelProps {
  children: ReactNode
  title?: string
  defaultExpanded?: boolean
  className?: string
  hasActiveFilters?: boolean
  onClearFilters?: () => void
  summary?: string
}

export function CollapsibleFilterPanel({
  children,
  title = "Filters",
  defaultExpanded = false,
  className,
  hasActiveFilters = false,
  onClearFilters,
  summary
}: CollapsibleFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const panelId = `filter-panel-${Math.random().toString(36).substr(2, 9)}`

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardContent className="p-0">
        {/* Filter Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium text-sm" id={`${panelId}-title`}>{title}</span>
            {hasActiveFilters && (
              <div 
                className="h-2 w-2 rounded-full bg-primary animate-pulse" 
                aria-label="Active filters indicator"
                role="status"
              />
            )}
            {summary && !isExpanded && (
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                {summary}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2" role="group" aria-label="Filter controls">
            {hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-label="Clear all filters"
              >
                <X className="h-3 w-3 mr-1" aria-hidden="true" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
              aria-expanded={isExpanded}
              aria-controls={panelId}
              aria-describedby={`${panelId}-title`}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="sr-only">
                {isExpanded ? 'Collapse filters' : 'Expand filters'}
              </span>
            </Button>
          </div>
        </div>

        {/* Collapsible Filter Content */}
        {isExpanded && (
          <div 
            id={panelId}
            className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200"
            role="region"
            aria-labelledby={`${panelId}-title`}
          >
            {children}
          </div>
        )}
        
        {/* Quick Preview when collapsed */}
        {!isExpanded && hasActiveFilters && (
          <div 
            className="px-4 py-2 text-xs text-muted-foreground bg-accent/30"
            role="status"
            aria-live="polite"
          >
            Active filters applied • Click to expand and modify
          </div>
        )}
      </CardContent>
    </Card>
  )
}