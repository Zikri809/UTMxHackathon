import Link from "next/link"
import { Bell, Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarNav } from "./sidebar-nav"
import { TopNav } from "./top-nav"

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-svh text-foreground">
      <SidebarNav />
      <div className="min-h-svh md:pl-64">
        <TopNav />
        <div className="hidden h-16 items-center justify-between border-b border-border/80 bg-background/90 px-6 backdrop-blur md:flex">
          <div className="flex h-9 min-w-72 items-center gap-2 rounded-md border border-border/80 bg-card px-3 text-sm text-muted-foreground shadow-xs">
            <Search className="size-4" aria-hidden="true" />
            <span>Search crops, racks, or harvest windows</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell className="size-4" aria-hidden="true" />
            </Button>
            <Button asChild>
              <Link href="/crops/new">
                <Plus className="size-4" aria-hidden="true" />
                Add Crop
              </Link>
            </Button>
          </div>
        </div>
        <main className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border/70 bg-background/75 p-3 shadow-[0_1px_0_oklch(1_0_0_/_0.55)_inset] backdrop-blur-sm sm:p-4 lg:p-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
