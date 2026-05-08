"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Plus, RotateCcw, Sprout } from "lucide-react"

import { DemoResetDialog } from "@/components/demo-reset-dialog"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { mainNavItems } from "./nav-items"

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80 md:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation">
              <Menu className="size-4" aria-hidden="true" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-[86vw] max-w-xs rounded-r-lg bg-sidebar">
            <DrawerHeader className="text-left">
              <DrawerTitle>Harvest Calendar</DrawerTitle>
              <DrawerDescription>Morning harvest desk</DrawerDescription>
            </DrawerHeader>
            <Separator />
            <nav className="flex flex-col gap-1 p-3" aria-label="Main">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                const active = isActiveRoute(pathname, item.href)

                return (
                  <DrawerClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </DrawerClose>
                )
              })}
            </nav>
            <div className="border-t border-sidebar-border p-3">
              <DemoResetDialog
                trigger={
                  <Button variant="outline" className="w-full justify-start">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Reset demo
                  </Button>
                }
              />
            </div>
          </DrawerContent>
        </Drawer>

        <Link
          href="/dashboard"
          className="flex min-w-0 flex-1 items-center gap-2 font-heading font-semibold"
        >
          <Sprout className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">Harvest Calendar</span>
        </Link>

        <Button asChild size="icon-sm" aria-label="Add crop">
          <Link href="/crops/new">
            <Plus className="size-4" aria-hidden="true" />
            <span className="sr-only">Add Crop</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
