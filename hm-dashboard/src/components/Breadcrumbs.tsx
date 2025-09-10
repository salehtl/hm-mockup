import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation()
  
  // Auto-generate breadcrumbs from current path if not provided
  const defaultItems: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/' }
  ]

  if (location.pathname !== '/') {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/')
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ')
      defaultItems.push({
        label,
        href,
        current: index === pathSegments.length - 1
      })
    })
  }

  const breadcrumbItems = items || defaultItems

  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb navigation">
      <ol className="inline-flex items-center space-x-1 md:space-x-3" role="list">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="inline-flex items-center" role="listitem">
            {index > 0 && (
              <ChevronRight 
                className="w-4 h-4 text-muted-foreground mx-1" 
                aria-hidden="true" 
              />
            )}
            {item.current ? (
              <span 
                className="text-sm font-medium text-foreground" 
                aria-current="page"
                role="text"
              >
                {index === 0 && <Home className="w-4 h-4 mr-2" aria-hidden="true" />}
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
                aria-label={index === 0 ? "Go to dashboard home" : `Go to ${item.label}`}
              >
                {index === 0 && <Home className="w-4 h-4 mr-2" aria-hidden="true" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}