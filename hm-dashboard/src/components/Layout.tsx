import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { EntitySelector } from './EntitySelector'
import { Breadcrumbs } from './Breadcrumbs'
import { HelpCircle, Settings, Menu } from 'lucide-react'
import { Button } from './ui/button'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PageSlicersProvider } from '@/contexts/PageSlicersContext'

const pageInfo: Record<string, { title: string; description: string; showEntitySelector?: boolean }> = {
  '/': {
    title: 'Executive Overview',
    description: 'Comprehensive performance dashboard with real-time insights and strategic KPIs',
    showEntitySelector: true
  },
  '/services': {
    title: 'Service Analytics',
    description: 'Detailed service performance analysis and optimization insights',
    showEntitySelector: true
  },
  '/channels': {
    title: 'Channel Analytics', 
    description: 'Comprehensive channel performance analysis across all touchpoints',
    showEntitySelector: true
  },
  '/dcx': {
    title: 'DCX Journey Intelligence',
    description: 'Advanced Digital Customer Experience analytics and journey optimization',
    showEntitySelector: true
  },
  '/comments': {
    title: 'Customer Comments',
    description: 'Customer feedback analysis and sentiment insights',
    showEntitySelector: true
  }
}

export function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pageSlicers, setPageSlicers] = useState<ReactNode | null>(null)
  
  const currentPageInfo = pageInfo[location.pathname] || {
    title: 'Dashboard',
    description: 'Happiness Meter analytics and insights',
    showEntitySelector: true
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black opacity-25" />
        </div>
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto lg:pl-0">
        {/* Enhanced Header with Breadcrumbs and Better Information Architecture */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Top Navigation Bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
                <Breadcrumbs className="hidden sm:flex flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Help</span>
                </Button>
                <Button variant="ghost" size="sm" className="hidden md:flex text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
                {currentPageInfo.showEntitySelector && <EntitySelector />}
              </div>
            </div>
          </div>
          
          {/* Page Header */}
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {currentPageInfo.title}
                </h1>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {currentPageInfo.description}
                </p>
              </div>
              
              {/* Page-specific Actions (can be extended by pages) */}
              <div className="flex items-center gap-2">
                {pageSlicers}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area with Improved Spacing */}
        <div className="px-4 sm:px-6 py-6 space-y-6">
          <PageSlicersProvider slicers={pageSlicers} setSlicers={setPageSlicers}>
            <Outlet />
          </PageSlicersProvider>
        </div>
      </main>
    </div>
  )
}