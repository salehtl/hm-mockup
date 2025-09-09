import { NavLink } from 'react-router-dom'
import { BarChart3, Settings, Home, GitBranch, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Overview',
    href: '/',
    icon: Home,
  },
  {
    name: 'Services',
    href: '/services',
    icon: Settings,
  },
  {
    name: 'Channels',
    href: '/channels',
    icon: BarChart3,
  },
  {
    name: 'DCX Journeys',
    href: '/dcx',
    icon: GitBranch,
  },
  {
    name: 'Comments',
    href: '/comments',
    icon: MessageSquare,
  },
]

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Logo/Header */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">HM Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Happiness Meter POC
        </p>
      </div>
    </div>
  )
}