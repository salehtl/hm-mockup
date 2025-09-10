import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  return (
    <div className={cn(
      "w-full",
      // Mobile: single column, small gaps
      "space-y-4",
      // Tablet: medium gaps
      "sm:space-y-6",
      // Desktop: maintain larger gaps
      "lg:space-y-6",
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { mobile: 1, tablet: 2, desktop: 4 }
}: ResponsiveGridProps) {
  const gridCols = cn(
    "grid gap-4",
    cols.mobile === 1 && "grid-cols-1",
    cols.mobile === 2 && "grid-cols-2",
    cols.tablet === 1 && "sm:grid-cols-1",
    cols.tablet === 2 && "sm:grid-cols-2",
    cols.tablet === 3 && "sm:grid-cols-3",
    cols.desktop === 1 && "lg:grid-cols-1",
    cols.desktop === 2 && "lg:grid-cols-2",
    cols.desktop === 3 && "lg:grid-cols-3",
    cols.desktop === 4 && "lg:grid-cols-4",
    className
  )

  return (
    <div className={gridCols}>
      {children}
    </div>
  )
}

interface ResponsiveTwoColumnProps {
  children: React.ReactNode
  className?: string
  leftContent: React.ReactNode
  rightContent: React.ReactNode
}

export function ResponsiveTwoColumn({ 
  leftContent, 
  rightContent, 
  className 
}: ResponsiveTwoColumnProps) {
  return (
    <div className={cn(
      "grid gap-6 grid-cols-1 lg:grid-cols-2",
      className
    )}>
      <div>{leftContent}</div>
      <div>{rightContent}</div>
    </div>
  )
}

interface ResponsiveStackProps {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

export function ResponsiveStack({ 
  children, 
  className,
  spacing = 'md' 
}: ResponsiveStackProps) {
  return (
    <div className={cn(
      "flex flex-col",
      spacing === 'sm' && "space-y-2 sm:space-y-3",
      spacing === 'md' && "space-y-4 sm:space-y-6",
      spacing === 'lg' && "space-y-6 sm:space-y-8",
      className
    )}>
      {children}
    </div>
  )
}