import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  secondaryAction?: ReactNode
}

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/75 bg-card/72 px-4 py-4 shadow-[0_1px_0_oklch(1_0_0_/_0.68)_inset] sm:px-5">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
      <div className="absolute right-4 top-4 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
        Crop desk
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 pl-2">
          <h1 className="font-heading text-3xl leading-tight font-semibold tracking-normal">
          {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {(action || secondaryAction) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {secondaryAction}
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
