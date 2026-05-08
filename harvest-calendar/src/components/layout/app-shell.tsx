import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarNav } from "./sidebar-nav"
import { TopNav } from "./top-nav"

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SidebarNav />
      <div className="min-h-svh md:pl-64">
        <TopNav />
        <div className="hidden h-16 items-center justify-end border-b bg-background px-6 md:flex">
          <Button asChild>
            <Link href="/crops/new">
              <Plus className="size-4" aria-hidden="true" />
              Add Crop
            </Link>
          </Button>
        </div>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
