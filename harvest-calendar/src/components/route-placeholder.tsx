import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Droplets,
  Gauge,
  Leaf,
  Plus,
  RadioTower,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  SunMedium,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type RoutePlaceholderProps = {
  title: string
  description: string
}

type StatusTone = "green" | "amber" | "blue" | "red" | "slate"

type PageConfig = {
  eyebrow: string
  summary: string
  primaryAction: string
  primaryHref: string
  secondaryAction: string
  secondaryHref: string
  stats: Array<{
    label: string
    value: string
    detail: string
    tone: StatusTone
  }>
  queueTitle: string
  queue: Array<{
    crop: string
    meta: string
    status: string
    tone: StatusTone
    icon: LucideIcon
  }>
  sideTitle: string
  sideItems: Array<{
    label: string
    value: string
    icon: LucideIcon
  }>
}

const pageConfigs: Record<string, PageConfig> = {
  Today: {
    eyebrow: "Daily Run",
    summary: "Ready work, harvest checks, and connection gaps.",
    primaryAction: "Add Crop",
    primaryHref: "/crops/new",
    secondaryAction: "Open Harvest Plan",
    secondaryHref: "/calendar",
    stats: [
      { label: "Ready soon", value: "4", detail: "This week", tone: "green" },
      { label: "Harvest checks", value: "3", detail: "Waiting", tone: "amber" },
      {
        label: "Need devices",
        value: "2",
        detail: "Connect devices",
        tone: "blue",
      },
    ],
    queueTitle: "Morning Queue",
    queue: [
      {
        crop: "Spinach",
        meta: "Rack C / Zone 1",
        status: "Harvest check",
        tone: "amber",
        icon: ClipboardCheck,
      },
      {
        crop: "Thai Basil",
        meta: "Rack B / Zone 2",
        status: "Low light",
        tone: "red",
        icon: SunMedium,
      },
      {
        crop: "Kale",
        meta: "Rack D / Zone 3",
        status: "Connect devices",
        tone: "blue",
        icon: RadioTower,
      },
    ],
    sideTitle: "Estimate Quality",
    sideItems: [
      { label: "Improved estimate", value: "6 crops", icon: Sparkles },
      { label: "Updated from conditions", value: "8 crops", icon: Gauge },
      { label: "Starter estimate", value: "2 crops", icon: Sprout },
    ],
  },
  "Harvest Plan": {
    eyebrow: "Week View",
    summary:
      "A compact schedule for what is expected to be ready and what needs review.",
    primaryAction: "Add Crop",
    primaryHref: "/crops/new",
    secondaryAction: "View Crops",
    secondaryHref: "/crops",
    stats: [
      { label: "Mon-Tue", value: "2", detail: "Ready windows", tone: "green" },
      {
        label: "Moved later",
        value: "1",
        detail: "Conditions changed",
        tone: "amber",
      },
      {
        label: "High reliability",
        value: "76%",
        detail: "Best crop",
        tone: "blue",
      },
    ],
    queueTitle: "Ready Windows",
    queue: [
      {
        crop: "Butterhead Lettuce",
        meta: "May 13 - May 15",
        status: "Reliable",
        tone: "green",
        icon: CalendarDays,
      },
      {
        crop: "Spinach",
        meta: "May 15 - May 17",
        status: "Harvest check",
        tone: "amber",
        icon: ClipboardCheck,
      },
      {
        crop: "Thai Basil",
        meta: "May 19 - May 22",
        status: "Moved 2 days later",
        tone: "red",
        icon: CircleAlert,
      },
    ],
    sideTitle: "Calendar Filters",
    sideItems: [
      { label: "Ready soon", value: "4", icon: CalendarDays },
      { label: "Needs attention", value: "1", icon: CircleAlert },
      { label: "Device gaps", value: "2", icon: RadioTower },
    ],
  },
  Crops: {
    eyebrow: "Inventory",
    summary: "Crop batches grouped by action state, not by raw system status.",
    primaryAction: "Add Crop",
    primaryHref: "/crops/new",
    secondaryAction: "Connect Devices",
    secondaryHref: "/sensors",
    stats: [
      { label: "Active crops", value: "14", detail: "Growing", tone: "green" },
      {
        label: "Watch list",
        value: "3",
        detail: "Needs review",
        tone: "amber",
      },
      { label: "Archived", value: "21", detail: "Completed", tone: "slate" },
    ],
    queueTitle: "Crop List Preview",
    queue: [
      {
        crop: "Butterhead Lettuce",
        meta: "Rack A / Zone 1",
        status: "On track",
        tone: "green",
        icon: Leaf,
      },
      {
        crop: "Thai Basil",
        meta: "Rack B / Zone 2",
        status: "Needs attention",
        tone: "red",
        icon: CircleAlert,
      },
      {
        crop: "Kale",
        meta: "Rack D / Zone 3",
        status: "Starter estimate",
        tone: "blue",
        icon: Sprout,
      },
    ],
    sideTitle: "Quick Actions",
    sideItems: [
      { label: "Search by rack", value: "Ready", icon: Search },
      { label: "Record result", value: "3 due", icon: ClipboardCheck },
      { label: "More filters", value: "5 saved", icon: SlidersHorizontal },
    ],
  },
  "Crop Detail": {
    eyebrow: "Crop Check",
    summary:
      "One crop, one decision: stay the course, connect devices, or record the harvest result.",
    primaryAction: "Record Harvest Result",
    primaryHref: "/crops/demo-spinach?tab=feedback",
    secondaryAction: "Connect Devices",
    secondaryHref: "/sensors?action=assign&batchId=demo-spinach",
    stats: [
      {
        label: "Reliability",
        value: "76%",
        detail: "Updated today",
        tone: "green",
      },
      {
        label: "Ready window",
        value: "3d",
        detail: "May 15 - May 17",
        tone: "blue",
      },
      {
        label: "Light trend",
        value: "-8%",
        detail: "Below target",
        tone: "amber",
      },
    ],
    queueTitle: "Crop Timeline",
    queue: [
      {
        crop: "Expected ready date",
        meta: "May 16",
        status: "Updated from conditions",
        tone: "blue",
        icon: Gauge,
      },
      {
        crop: "Device group",
        meta: "Rack C / Zone 1",
        status: "Connected",
        tone: "green",
        icon: RadioTower,
      },
      {
        crop: "Harvest check",
        meta: "Due today",
        status: "Waiting",
        tone: "amber",
        icon: ClipboardCheck,
      },
    ],
    sideTitle: "Growing Conditions",
    sideItems: [
      { label: "Temperature", value: "24 C", icon: Gauge },
      { label: "pH", value: "6.2", icon: Droplets },
      { label: "Light", value: "11 h", icon: SunMedium },
    ],
  },
  "Add Crop": {
    eyebrow: "Guided Setup",
    summary:
      "Plant, location, start date, crop size, and optional device connection in one flow.",
    primaryAction: "Start Setup",
    primaryHref: "/crops/new",
    secondaryAction: "View Locations",
    secondaryHref: "/sensors",
    stats: [
      { label: "Setup steps", value: "5", detail: "Short form", tone: "blue" },
      {
        label: "Device optional",
        value: "Yes",
        detail: "Can add later",
        tone: "green",
      },
      {
        label: "Starter estimate",
        value: "Auto",
        detail: "After review",
        tone: "amber",
      },
    ],
    queueTitle: "Setup Path",
    queue: [
      {
        crop: "What are you growing?",
        meta: "Catalog or custom plant",
        status: "Step 1",
        tone: "green",
        icon: Leaf,
      },
      {
        crop: "Where is it growing?",
        meta: "Rack, zone, or new location",
        status: "Step 2",
        tone: "blue",
        icon: RadioTower,
      },
      {
        crop: "Review ready window",
        meta: "Starter estimate",
        status: "Step 5",
        tone: "amber",
        icon: CalendarDays,
      },
    ],
    sideTitle: "After Creation",
    sideItems: [
      { label: "Open crop detail", value: "Next", icon: ArrowRight },
      { label: "Connect devices", value: "Optional", icon: RadioTower },
      { label: "Plan harvest", value: "Auto", icon: CalendarDays },
    ],
  },
  "Devices & Locations": {
    eyebrow: "Connections",
    summary:
      "Device groups, racks, and crop connections kept together so estimates stay reliable.",
    primaryAction: "Connect Devices",
    primaryHref: "/sensors?action=assign",
    secondaryAction: "Add Crop",
    secondaryHref: "/crops/new",
    stats: [
      {
        label: "Online groups",
        value: "4",
        detail: "Reporting",
        tone: "green",
      },
      {
        label: "Need connection",
        value: "2",
        detail: "Crops waiting",
        tone: "blue",
      },
      {
        label: "Offline devices",
        value: "1",
        detail: "Check needed",
        tone: "red",
      },
    ],
    queueTitle: "Device Groups",
    queue: [
      {
        crop: "Rack A / Zone 1",
        meta: "Butterhead Lettuce",
        status: "Connected",
        tone: "green",
        icon: CheckCircle2,
      },
      {
        crop: "Rack D / Zone 3",
        meta: "No crop connected",
        status: "Available",
        tone: "blue",
        icon: RadioTower,
      },
      {
        crop: "Rack B / Zone 2",
        meta: "Thai Basil",
        status: "One device offline",
        tone: "red",
        icon: CircleAlert,
      },
    ],
    sideTitle: "Tracked Conditions",
    sideItems: [
      { label: "Temperature", value: "4 groups", icon: Gauge },
      { label: "Light", value: "3 groups", icon: SunMedium },
      { label: "pH / EC", value: "3 groups", icon: Droplets },
    ],
  },
  Improvements: {
    eyebrow: "Better Estimates",
    summary:
      "Harvest checks turn repeated crops into clearer dates and fewer misses.",
    primaryAction: "Record Result",
    primaryHref: "/crops/demo-spinach?tab=feedback",
    secondaryAction: "View Crops",
    secondaryHref: "/crops",
    stats: [
      {
        label: "Average miss",
        value: "1.8d",
        detail: "Down from 4.5d",
        tone: "green",
      },
      {
        label: "Completed cycles",
        value: "21",
        detail: "Learning set",
        tone: "blue",
      },
      {
        label: "Starter crops",
        value: "2",
        detail: "Need checks",
        tone: "amber",
      },
    ],
    queueTitle: "Recent Improvements",
    queue: [
      {
        crop: "Spinach",
        meta: "3 completed cycles",
        status: "Getting better",
        tone: "green",
        icon: TrendingUp,
      },
      {
        crop: "Butterhead Lettuce",
        meta: "6 completed cycles",
        status: "Improved estimate",
        tone: "blue",
        icon: Sparkles,
      },
      {
        crop: "Kale",
        meta: "New crop",
        status: "Starter estimate",
        tone: "amber",
        icon: Sprout,
      },
    ],
    sideTitle: "Estimate Mix",
    sideItems: [
      { label: "Improved", value: "42%", icon: Sparkles },
      { label: "Getting better", value: "46%", icon: TrendingUp },
      { label: "Starter", value: "12%", icon: Sprout },
    ],
  },
}

const toneClasses: Record<StatusTone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-sky-200 bg-sky-50 text-sky-800",
  red: "border-rose-200 bg-rose-50 text-rose-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
}

const dotClasses: Record<StatusTone, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-sky-500",
  red: "bg-rose-500",
  slate: "bg-slate-400",
}

export function RoutePlaceholder({
  title,
  description,
}: RoutePlaceholderProps) {
  const config = pageConfigs[title] ?? pageConfigs.Today

  return (
    <div className="space-y-5 text-foreground">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex min-h-72 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-xs">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/25 bg-primary/10 text-primary"
              >
                {config.eyebrow}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                Harvest Calendar
              </span>
            </div>
            <h1 className="max-w-2xl font-heading text-3xl leading-tight font-semibold tracking-normal sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {config.summary || description}
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {config.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border/80 bg-background/70 p-3"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="font-heading text-2xl font-semibold">
                    {stat.value}
                  </p>
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      dotClasses[stat.tone]
                    )}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-[#18382e] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-100/80">Today</p>
              <p className="mt-1 font-heading text-lg font-semibold">
                Operating Snapshot
              </p>
            </div>
            <Gauge className="size-5 text-emerald-100" aria-hidden="true" />
          </div>
          <div className="mt-7 space-y-4">
            <div className="grid grid-cols-6 gap-1.5" aria-hidden="true">
              {Array.from({ length: 24 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-7 rounded-sm sm:h-8",
                    index % 9 === 0
                      ? "bg-amber-300"
                      : index % 7 === 0
                        ? "bg-sky-300"
                        : "bg-emerald-300",
                    index > 19 && "opacity-55"
                  )}
                />
              ))}
            </div>
            <div className="rounded-lg border border-white/15 bg-white/10 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-50">Reliability</span>
                <span className="font-semibold">76%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/15">
                <div className="h-full w-3/4 rounded-full bg-emerald-300" />
              </div>
            </div>
            <p className="text-xs leading-5 text-emerald-50/80">
              Future dates improve after harvest results.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>{config.queueTitle}</CardTitle>
            <CardDescription>
              Ready work, checks, and connection gaps.
            </CardDescription>
            <CardAction>
              <Button
                asChild
                size="sm"
                className="h-8 w-8 px-0 sm:w-auto sm:px-2.5"
                aria-label={config.primaryAction}
              >
                <Link href={config.primaryHref}>
                  <Plus className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {config.primaryAction}
                  </span>
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="divide-y divide-border/80 px-0">
            {config.queue.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={`${item.crop}-${item.status}`}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.crop}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.meta}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "justify-self-start border",
                      toneClasses[item.tone]
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>{config.sideTitle}</CardTitle>
            <CardDescription>
              Friendly labels for day-to-day decisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.sideItems.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="truncate text-sm font-medium">
                      {item.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {item.value}
                  </span>
                </div>
              )
            })}
            <Button
              asChild
              variant="outline"
              className="mt-2 w-full justify-between"
            >
              <Link href={config.secondaryHref}>
                {config.secondaryAction}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
