"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Sprout } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { mainNavItems } from "./nav-items"

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sprout className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-heading text-base font-semibold">
              Harvest Calendar
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Crop planning workspace
            </span>
          </span>
        </Link>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Main">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const active = isActiveRoute(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <Button asChild className="w-full justify-start">
          <Link href="/crops/new">
            <Plus className="size-4" aria-hidden="true" />
            Add Crop
          </Link>
        </Button>
      </div>
    </aside>
  )
}
