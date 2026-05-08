"use client"

import { RotateCcw, TriangleAlert } from "lucide-react"

import { requestDemoTourPrompt } from "@/components/demo-tour-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useResetDemoData } from "@/lib/query/hooks"

type DemoResetDialogProps = {
  ariaLabel?: string
  className?: string
  iconOnly?: boolean
  label?: string
  size?: React.ComponentProps<typeof Button>["size"]
  variant?: React.ComponentProps<typeof Button>["variant"]
}

export function DemoResetDialog({
  ariaLabel,
  className,
  iconOnly,
  label = "Reset demo",
  size = "sm",
  variant = "outline",
}: DemoResetDialogProps) {
  const resetDemoData = useResetDemoData()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label={iconOnly ? ariaLabel ?? label : ariaLabel}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {iconOnly ? <span className="sr-only">{label}</span> : label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-amber-600" aria-hidden="true" />
            Reset demo data?
          </DialogTitle>
          <DialogDescription>
            This restores the starter crops, plant profiles, rack and zone
            locations, device groups, condition readings, harvest checks, and
            improvement stats.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="destructive"
              onClick={() =>
                resetDemoData.mutate(undefined, {
                  onSuccess: requestDemoTourPrompt,
                })
              }
              disabled={resetDemoData.isPending}
            >
              {resetDemoData.isPending ? "Resetting" : "Reset demo"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
