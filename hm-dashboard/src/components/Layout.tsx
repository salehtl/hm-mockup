import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { EntitySelector } from './EntitySelector'

export function Layout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
              <p className="text-muted-foreground">
                Happiness Meter analytics and insights
              </p>
            </div>
            <EntitySelector />
          </div>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}