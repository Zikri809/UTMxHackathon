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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
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
  )
}
