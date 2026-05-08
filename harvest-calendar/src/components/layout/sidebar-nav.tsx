"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CircleCheck, Plus, Sprout } from "lucide-react"

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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar/96 text-sidebar-foreground shadow-[1px_0_0_oklch(1_0_0_/_0.55)_inset] md:flex md:flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Sprout className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block font-heading text-base font-semibold">
              Harvest Calendar
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Morning harvest desk
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
                  ? "bg-card text-sidebar-accent-foreground shadow-xs ring-1 ring-sidebar-border"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mx-3 mb-3 rounded-lg border border-sidebar-border bg-card/60 p-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <CircleCheck className="size-3.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-medium">3 harvest checks ready</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Spinach and basil need a quick review.
            </p>
          </div>
        </div>
      </div>
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
