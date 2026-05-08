import Link from "next/link"
import { Bell, Plus, Search } from "lucide-react"

import { DemoResetDialog } from "@/components/demo-reset-dialog"
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
        <div className="hidden h-[4.5rem] items-center justify-between border-b border-border/70 bg-background/78 px-6 backdrop-blur-xl md:flex">
          <div className="flex items-center gap-4">
            <div className="grid size-10 place-items-center rounded-md border border-border/70 bg-card/80 font-mono text-[10px] font-semibold uppercase leading-none text-muted-foreground shadow-xs">
              Live
            </div>
            <div className="flex h-10 min-w-[22rem] items-center gap-2 rounded-md border border-border/80 bg-card/90 px-3 text-sm text-muted-foreground shadow-[0_1px_0_oklch(1_0_0_/_0.65)_inset,0_8px_18px_oklch(0.2_0.025_110_/_0.05)]">
              <Search className="size-4" aria-hidden="true" />
              <span>Search crops, racks, or harvest windows</span>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-xs text-muted-foreground xl:flex">
            <span className="h-px w-12 bg-border" />
            <span>Morning harvest desk</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Notifications">
              <Bell className="size-4" aria-hidden="true" />
            </Button>
            <DemoResetDialog
              ariaLabel="Reset demo data"
              iconOnly
              label="Reset demo"
              size="icon"
            />
            <Button asChild>
              <Link href="/crops/new">
                <Plus className="size-4" aria-hidden="true" />
                Add Crop
              </Link>
            </Button>
          </div>
        </div>
        <main className="mx-auto w-full max-w-[1420px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="pointer-events-none absolute -left-4 top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-transparent via-primary/25 to-transparent xl:block" />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
