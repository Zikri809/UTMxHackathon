"use client"

import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  PlugZap,
  RotateCcw,
  Sprout,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const tourDismissedKey = "harvest-calendar-demo-tour-dismissed-session:v1"
const tourRequestedKey = "harvest-calendar-demo-tour-requested:v1"

const tourSteps = [
  {
    title: "Start at Today",
    description: "Start with the operational view judges should understand first.",
    instruction: "Review the operations pulse, then scan the Morning Queue to find the first crop that needs attention.",
    href: "/dashboard",
    actionLabel: "Open Today",
    pagePath: "/dashboard",
    icon: CalendarCheck,
  },
  {
    title: "Open Thai Basil",
    description: "Use Thai Basil as the guided example crop for the demo.",
    instruction: "Click the Thai Basil row to open its detail page.",
    href: "/crops",
    actionLabel: "Open Crops",
    pagePath: "/crops",
    completeWhen: "thai-basil-opened",
    icon: Sprout,
  },
  {
    title: "Inspect a sensor signal",
    description: "Thai Basil is the clearest example of conditions changing a harvest estimate.",
    instruction: "Open the Conditions tab, then review the Light exposure trend and the harvest estimate that moved later.",
    href: "/crops/batch-thai-basil?tab=conditions",
    actionLabel: "Open Thai Basil",
    pagePath: "/crops/batch-thai-basil",
    search: "tab=conditions",
    icon: BarChart3,
  },
  {
    title: "Add or connect devices",
    description: "Show the hardware workflow behind the prediction model.",
    instruction: "Click Add device group, choose the metrics it tracks, then save the new group.",
    href: "/sensors",
    actionLabel: "Open Devices",
    pagePath: "/sensors",
    action: "add-device-group-opened",
    icon: PlugZap,
  },
  {
    title: "Record harvest feedback",
    description: "Spinach is ready for a harvest check in the seeded demo data.",
    instruction: "Click Record harvest result and submit whether the crop was ready.",
    href: "/crops/batch-spinach-harvest-check?tab=feedback",
    actionLabel: "Open Harvest Check",
    pagePath: "/crops/batch-spinach-harvest-check",
    search: "tab=feedback",
    action: "harvest-feedback-opened",
    icon: ClipboardCheck,
  },
  {
    title: "Show model improvement",
    description: "End on the learning page so judges see the system improving over time.",
    instruction: "Review how completed harvest checks reduce average miss days and improve reliability.",
    href: "/learning",
    actionLabel: "Open Improvements",
    pagePath: "/learning",
    icon: TrendingUp,
  },
]

export function requestDemoTourPrompt() {
  window.sessionStorage.removeItem(tourDismissedKey)
  window.localStorage.setItem(tourRequestedKey, "1")
  window.dispatchEvent(new Event("harvest-calendar:demo-tour-requested"))
}

export function DemoTourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchString = typeof window === "undefined" ? "" : window.location.search.slice(1)
  const [open, setOpen] = React.useState(false)
  const [showGuide, setShowGuide] = React.useState(false)
  const [stepIndex, setStepIndex] = React.useState(0)
  const [completedActions, setCompletedActions] = React.useState<Set<string>>(
    () => new Set(),
  )

  React.useEffect(() => {
    function syncPrompt() {
      const requested = window.localStorage.getItem(tourRequestedKey) === "1"
      const dismissedThisSession =
        window.sessionStorage.getItem(tourDismissedKey) === "1"
      setOpen(requested || !dismissedThisSession)
    }

    syncPrompt()
    window.addEventListener("harvest-calendar:demo-tour-requested", syncPrompt)

    return () => {
      window.removeEventListener("harvest-calendar:demo-tour-requested", syncPrompt)
    }
  }, [])

  React.useEffect(() => {
    function onTourAction(event: MouseEvent) {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const actionElement = target.closest("[data-tour-action]")

      if (!(actionElement instanceof HTMLElement)) {
        return
      }

      const action = actionElement.dataset.tourAction

      if (!action) {
        return
      }

      setCompletedActions((current) => {
        const nextActions = new Set(current)
        nextActions.add(action)
        return nextActions
      })
    }

    document.addEventListener("click", onTourAction, true)

    return () => {
      document.removeEventListener("click", onTourAction, true)
    }
  }, [])

  function dismiss() {
    window.sessionStorage.setItem(tourDismissedKey, "1")
    window.localStorage.removeItem(tourRequestedKey)
    setOpen(false)
  }

  function startGuide() {
    window.sessionStorage.setItem(tourDismissedKey, "1")
    window.localStorage.removeItem(tourRequestedKey)
    setStepIndex(0)
    setShowGuide(true)
    setOpen(false)
    router.push(tourSteps[0].href)
  }

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : dismiss())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start the guided demo?</DialogTitle>
            <DialogDescription>
              The demo data is loaded. This walkthrough follows one predetermined
              path through the product, screen by screen.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-card/70 p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              6 guided steps
            </p>
            <p className="mt-2 font-medium">
              Today / Crops / Conditions / Devices / Feedback / Improvements
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The guide will tell judges exactly what to look at and move them to
              the next screen when they press Next.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={dismiss}>
              Skip
            </Button>
            <Button onClick={startGuide}>Start walkthrough</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showGuide ? (
        <DemoGuide
          currentStep={stepIndex}
          completedActions={completedActions}
          onClose={() => setShowGuide(false)}
          pathname={pathname}
          searchString={searchString}
          onStepChange={(nextStep) => {
            setStepIndex(nextStep)
            router.push(tourSteps[nextStep].href)
          }}
        />
      ) : null}
    </>
  )
}

function DemoGuide({
  currentStep,
  completedActions,
  onClose,
  onStepChange,
  pathname,
  searchString,
}: {
  currentStep: number
  completedActions: Set<string>
  onClose: () => void
  onStepChange: (step: number) => void
  pathname: string
  searchString: string
}) {
  const step = tourSteps[currentStep]
  const Icon = step.icon
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tourSteps.length - 1
  const onExpectedPage = isExpectedPage(step, pathname, searchString)
  const stepComplete = isStepComplete(step, pathname, searchString, completedActions)

  return (
    <aside className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-lg border border-border/80 bg-card/95 p-4 text-sm shadow-[0_18px_48px_oklch(0.2_0.03_110_/_0.18)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Step {currentStep + 1} of {tourSteps.length}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <p className="font-heading text-base font-semibold">{step.title}</p>
          </div>
          <p className="mt-1 text-muted-foreground">
            {step.description}
          </p>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onClose} aria-label="Close demo guide">
          <span aria-hidden="true">x</span>
        </Button>
      </div>
      <div className="mt-4 rounded-md border bg-muted/35 p-3">
        <p className="text-xs font-medium text-muted-foreground">What you should do</p>
        <p className="mt-1 leading-6">{step.instruction}</p>
      </div>
      <div className="mt-3 rounded-md border p-3">
        <p className="text-xs font-medium text-muted-foreground">Guide status</p>
        <p className="mt-1 font-medium">
          {stepComplete
            ? "Step complete. You can continue."
            : onExpectedPage
              ? getActionPrompt(step)
              : "Open the required page to continue."}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1">
        {tourSteps.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onStepChange(index)}
            aria-label={`Go to step ${index + 1}`}
            className={`h-1.5 rounded-full ${index <= currentStep ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
      <Button
        className="mt-4 w-full"
        variant={onExpectedPage ? "outline" : "default"}
        onClick={() => onStepChange(currentStep)}
      >
        {step.actionLabel}
      </Button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={isFirstStep}
        >
          Back
        </Button>
        <Button
          onClick={() => {
            if (!stepComplete) {
              return
            }

            if (isLastStep) {
              onClose()
              return
            }

            onStepChange(currentStep + 1)
          }}
          disabled={!stepComplete}
        >
          {isLastStep ? "Finish" : "Next"}
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reset demo data anytime to replay the same path.
      </div>
    </aside>
  )
}

type DemoStep = (typeof tourSteps)[number]

function isExpectedPage(
  step: DemoStep,
  pathname: string,
  searchString: string,
) {
  if (pathname !== step.pagePath) {
    return false
  }

  if (!("search" in step) || !step.search) {
    return true
  }

  return searchString === step.search
}

function isStepComplete(
  step: DemoStep,
  pathname: string,
  searchString: string,
  completedActions: Set<string>,
) {
  if ("completeWhen" in step && step.completeWhen === "thai-basil-opened") {
    return pathname === "/crops/batch-thai-basil"
  }

  if (!isExpectedPage(step, pathname, searchString)) {
    return false
  }

  if ("action" in step && step.action) {
    return completedActions.has(step.action)
  }

  return true
}

function getActionPrompt(step: DemoStep) {
  if ("completeWhen" in step && step.completeWhen === "thai-basil-opened") {
    return "Click the Thai Basil row to open its detail page."
  }

  if ("action" in step && step.action === "add-device-group-opened") {
    return "Click Add device group to continue."
  }

  if ("action" in step && step.action === "harvest-feedback-opened") {
    return "Click Record harvest result to continue."
  }

  return "You are on the right screen."
}
