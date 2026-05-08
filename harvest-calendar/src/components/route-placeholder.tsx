import Link from "next/link"

import { Button } from "@/components/ui/button"

type RoutePlaceholderProps = {
  title: string
  description: string
}

export function RoutePlaceholder({
  title,
  description,
}: RoutePlaceholderProps) {
  return (
    <main className="min-h-svh bg-background px-6 py-8 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">Harvest Calendar</p>
          <h1 className="font-heading text-3xl font-semibold tracking-normal">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/crops/new">Add Crop</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/calendar">Harvest Plan</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
