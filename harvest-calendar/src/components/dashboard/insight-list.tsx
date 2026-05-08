import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type InsightItem = {
  title: string
  detail: string
  href?: string
  actionLabel?: string
  icon: LucideIcon
}

type InsightListProps = {
  title: string
  description?: string
  items: InsightItem[]
  viewAllHref?: string
  viewAllLabel?: string
  emptyText?: string
}

export function InsightList({
  title,
  description,
  items,
  viewAllHref,
  viewAllLabel = "View all",
  emptyText = "Nothing needs attention here.",
}: InsightListProps) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {viewAllHref ? (
          <CardAction>
            <Button asChild size="sm" variant="ghost">
              <Link href={viewAllHref}>
                {viewAllLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1 px-0">
        {items.length ? (
          items.map((item) => {
            const Icon = item.icon
            const content = (
              <>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                {item.actionLabel ? (
                  <span className="shrink-0 text-xs font-medium text-primary">
                    {item.actionLabel}
                  </span>
                ) : null}
              </>
            )

            return item.href ? (
              <Link
                key={`${item.title}-${item.detail}`}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/60"
              >
                {content}
              </Link>
            ) : (
              <div
                key={`${item.title}-${item.detail}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                {content}
              </div>
            )
          })
        ) : (
          <p className="px-4 py-3 text-sm text-muted-foreground">
            {emptyText}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
