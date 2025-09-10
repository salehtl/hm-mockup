import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

interface SkeletonCardProps {
  className?: string
  hasHeader?: boolean
  hasFooter?: boolean
  linesCount?: number
}

function SkeletonCard({ className, hasHeader = true, hasFooter = false, linesCount = 3 }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-3", className)}>
      {hasHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: linesCount }, (_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-4",
              i === linesCount - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
      </div>
      {hasFooter && (
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      )}
    </div>
  )
}

interface SkeletonKpiCardProps {
  className?: string
}

function SkeletonKpiCard({ className }: SkeletonKpiCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <div className="p-6 pt-0">
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

interface SkeletonChartProps {
  className?: string
  height?: number
}

function SkeletonChart({ className, height = 350 }: SkeletonChartProps) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="p-6 pb-2">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="p-6 pt-0">
        <Skeleton className={cn("w-full rounded", `h-[${height}px]`)} />
      </div>
    </div>
  )
}

interface SkeletonTableProps {
  className?: string
  rows?: number
  columns?: number
}

function SkeletonTable({ className, rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="p-6 pb-2">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-3">
          {/* Header */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, i) => (
              <Skeleton key={`header-${i}`} className="h-4 w-16" />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }, (_, i) => (
            <div key={`row-${i}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }, (_, j) => (
                <Skeleton
                  key={`cell-${i}-${j}`}
                  className={cn(
                    "h-4",
                    j === 0 ? "w-20" : j === columns - 1 ? "w-12" : "w-16"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface SkeletonListProps {
  className?: string
  items?: number
}

function SkeletonList({ className, items = 6 }: SkeletonListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-2 w-2 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface SkeletonPageProps {
  showKpis?: boolean
  showCharts?: boolean
  showTable?: boolean
  showList?: boolean
}

function SkeletonPage({ showKpis = true, showCharts = true, showTable = false, showList = false }: SkeletonPageProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {showKpis && (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonKpiCard key={i} />
          ))}
        </div>
      )}

      {/* Charts Grid */}
      {showCharts && (
        <div className="grid gap-6 md:grid-cols-3">
          <SkeletonChart className="md:col-span-2" />
          <SkeletonChart />
        </div>
      )}

      {/* Additional Chart */}
      {showCharts && <SkeletonChart />}

      {/* Table or List */}
      <div className="grid gap-6 md:grid-cols-2">
        {showTable && <SkeletonTable />}
        {showList && <SkeletonList />}
        {!showTable && !showList && (
          <>
            <SkeletonCard linesCount={8} />
            <SkeletonCard linesCount={6} />
          </>
        )}
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonKpiCard,
  SkeletonChart,
  SkeletonTable,
  SkeletonList,
  SkeletonPage,
}