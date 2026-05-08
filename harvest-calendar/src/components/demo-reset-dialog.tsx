"use client"

import { RotateCcw, TriangleAlert } from "lucide-react"

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
  trigger?: React.ReactNode
}

export function DemoResetDialog({ trigger }: DemoResetDialogProps) {
  const resetDemoData = useResetDemoData()

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset demo
          </Button>
        )}
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
              onClick={() => resetDemoData.mutate()}
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
