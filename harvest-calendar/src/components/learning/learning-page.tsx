"use client"

import Link from "next/link"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { z } from "zod"
import { useForm, type Resolver } from "react-hook-form"
import {
  CalendarCheck,
  Edit,
  Leaf,
  Plus,
  Sparkles,
  TrendingDown,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useCropBatchSummaries,
  useModelLearningStats,
  usePlantProfiles,
  useUpdatePlantProfile,
} from "@/lib/query/hooks"
import type { CropBatchSummary } from "@/types/crop"
import type { ModelMaturity } from "@/types/domain"
import type { ModelLearningStats } from "@/types/learning"
import type { PlantIdealRanges, PlantProfile } from "@/types/plant"

const optionalNumber = z.preprocess(
  (value) => (value === "" || Number.isNaN(value) ? undefined : value),
  z.coerce.number().positive("Use a positive value.").optional(),
)

const editPlantSchema = z
  .object({
    name: z.string().trim().min(1, "Add a plant name."),
    defaultMaturityDays: z.coerce
      .number()
      .int()
      .positive("Typical days to ready must be positive."),
    harvestWindowBufferDays: z.coerce
      .number()
      .int()
      .positive("Ready window must be positive."),
    temperatureMin: optionalNumber,
    temperatureMax: optionalNumber,
    phMin: optionalNumber,
    phMax: optionalNumber,
    ecMin: optionalNumber,
    ecMax: optionalNumber,
    lightMin: optionalNumber,
    lightMax: optionalNumber,
  })
  .superRefine((value, context) => {
    validateRange(value.temperatureMin, value.temperatureMax, "temperatureMin", context)
    validateRange(value.phMin, value.phMax, "phMin", context)
    validateRange(value.ecMin, value.ecMax, "ecMin", context)
    validateRange(value.lightMin, value.lightMax, "lightMin", context)
  })

type EditPlantFormValues = z.infer<typeof editPlantSchema>

const terminalStatuses = new Set(["cancelled", "failed", "archived"])

export function LearningPage() {
  const learningStatsQuery = useModelLearningStats()
  const plantProfilesQuery = usePlantProfiles()
  const cropSummariesQuery = useCropBatchSummaries()

  const isLoading =
    learningStatsQuery.isLoading ||
    plantProfilesQuery.isLoading ||
    cropSummariesQuery.isLoading
  const isError = learningStatsQuery.isError || plantProfilesQuery.isError

  if (isLoading) {
    return <ImprovementsSkeleton />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Could not load improvements.</AlertTitle>
        <AlertDescription>
          Try again to refresh harvest check and plant details.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void learningStatsQuery.refetch()
              void plantProfilesQuery.refetch()
            }}
          >
            Retry
          </Button>
        </AlertAction>
      </Alert>
    )
  }

  const stats = learningStatsQuery.data ?? []
  const plantProfiles = plantProfilesQuery.data ?? []
  const cropSummaries = cropSummariesQuery.data ?? []

  if (!stats.length) {
    return <EmptyImprovements />
  }

  const activeCropSummaries = cropSummaries.filter(
    (crop) => !terminalStatuses.has(crop.status),
  )
  const summary = getImprovementSummary(stats)
  const recentHistory = buildHarvestCheckHistory(cropSummaries, stats)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Improvements"
        description="Harvest estimates getting better over time."
        action={
          <Button asChild>
            <Link href="/crops/new">
              <Plus className="size-4" aria-hidden="true" />
              Add Crop
            </Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Completed cycles"
          value={String(summary.completedCycles)}
          detail="Harvest checks with final results"
          icon={CalendarCheck}
        />
        <SummaryCard
          label="Average miss reduced"
          value={`${summary.averageReduction.toFixed(1)} days`}
          detail="Across plants with history"
          icon={TrendingDown}
        />
        <SummaryCard
          label="Highly reliable plants"
          value={String(summary.highlyReliable)}
          detail="Ready dates are consistently close"
          icon={Sparkles}
        />
        <SummaryCard
          label="Plants getting better"
          value={String(summary.gettingBetter)}
          detail={`${activeCropSummaries.length} active crop batches`}
          icon={Leaf}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="grid gap-3 md:grid-cols-2">
          {stats.map((stat) => (
            <LearningModelCard
              key={stat.plantProfileId}
              stat={stat}
              plantProfile={plantProfiles.find(
                (profile) => profile.id === stat.plantProfileId,
              )}
            />
          ))}
        </div>
        <AccuracyTrendChart stats={stats} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <GenericVsLearnedComparison stats={stats} />
        <FeedbackHistoryList items={recentHistory} />
      </section>
    </div>
  )
}

export function LearningModelCard({
  stat,
  plantProfile,
}: {
  stat: ModelLearningStats
  plantProfile?: PlantProfile
}) {
  const quality = getEstimateQuality(stat.maturityLevel)
  const isCustom = plantProfile?.source === "custom" || stat.source === "custom"
  const before = stat.averageErrorBeforeDays
  const after = stat.averageErrorAfterDays
  const hasImprovement = before > 0 && after > 0 && before > after

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{stat.plantName}</CardTitle>
            <CardDescription>
              {isCustom ? "Custom plant" : "Catalog plant"}
            </CardDescription>
          </div>
          {plantProfile?.source === "custom" ? (
            <EditPlantProfileDialog plantProfile={plantProfile} />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <ModelMaturityBadge maturity={stat.maturityLevel} />
          <Badge variant="outline">{stat.completedCycles} completed cycles</Badge>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-muted-foreground">Reliability</span>
            <span className="font-semibold">{stat.confidence}%</span>
          </div>
          <Progress value={stat.confidence} className="mt-2 h-2" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {hasImprovement
            ? `Average miss reduced from ${before.toFixed(1)} days to ${after.toFixed(1)} days.`
            : isCustom
              ? `Using user-provided ${plantProfile?.defaultMaturityDays ?? "typical"} days to ready.`
              : "Record harvest checks to sharpen future ready dates."}
        </p>
        <p className="text-sm font-medium">{quality.note}</p>
      </CardContent>
    </Card>
  )
}

export function AccuracyTrendChart({ stats }: { stats: ModelLearningStats[] }) {
  const chartData = stats.map((stat) => ({
    plant: stat.plantName.replace("Butterhead ", ""),
    Starter: Number(stat.averageErrorBeforeDays.toFixed(1)),
    Now: Number(stat.averageErrorAfterDays.toFixed(1)),
  }))

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Average Miss</CardTitle>
        <CardDescription>
          Fewer days missed means harvest planning is getting easier.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80 pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="plant" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}d`}
            />
            <Tooltip
              formatter={(value) => [`${value} days`, "Average miss"]}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="Starter" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Now" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ModelMaturityBadge({ maturity }: { maturity: ModelMaturity }) {
  const quality = getEstimateQuality(maturity)

  return (
    <Badge variant="outline" className={quality.className}>
      {quality.label}
    </Badge>
  )
}

export function FeedbackHistoryList({
  items,
}: {
  items: Array<{ title: string; detail: string; href?: string }>
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Recent Harvest Checks</CardTitle>
        <CardDescription>
          Recorded harvest results make future dates clearer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => {
          const content = (
            <div className="rounded-md border border-border p-3 transition-colors hover:bg-accent/50">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          )

          return item.href ? (
            <Link key={index} href={item.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={index}>{content}</div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function GenericVsLearnedComparison({ stats }: { stats: ModelLearningStats[] }) {
  const averageBefore = average(stats.map((stat) => stat.averageErrorBeforeDays))
  const averageAfter = average(stats.map((stat) => stat.averageErrorAfterDays))
  const averageReliability = average(stats.map((stat) => stat.confidence))

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Starter vs Improved Estimate</CardTitle>
        <CardDescription>
          The value grows as harvest checks repeat across crop cycles.
        </CardDescription>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            <TableHead>Starter estimate</TableHead>
            <TableHead>Improved estimate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <ComparisonRow
            feature="Inputs used"
            starter="Typical days to ready"
            improved="Crop history, harvest checks, and growing conditions"
          />
          <ComparisonRow
            feature="Reliability"
            starter="Lower at first"
            improved={`${Math.round(averageReliability)}% average reliability`}
          />
          <ComparisonRow
            feature="Personalization"
            starter="Same starting point for similar crops"
            improved="Tuned to this farm's crop cycles"
          />
          <ComparisonRow
            feature="Harvest checks"
            starter="Not recorded yet"
            improved="Used after every completed cycle"
          />
          <ComparisonRow
            feature="Average miss"
            starter={`${averageBefore.toFixed(1)} days`}
            improved={`${averageAfter.toFixed(1)} days`}
          />
        </TableBody>
      </Table>
    </Card>
  )
}

export function EditPlantProfileDialog({ plantProfile }: { plantProfile: PlantProfile }) {
  const [open, setOpen] = useState(false)
  const updatePlantProfile = useUpdatePlantProfile()
  const form = useForm<EditPlantFormValues>({
    resolver: zodResolver(editPlantSchema) as Resolver<EditPlantFormValues>,
    values: {
      name: plantProfile.name,
      defaultMaturityDays: plantProfile.defaultMaturityDays,
      harvestWindowBufferDays: plantProfile.harvestWindowBufferDays,
      temperatureMin: plantProfile.idealRanges.temperatureC?.min,
      temperatureMax: plantProfile.idealRanges.temperatureC?.max,
      phMin: plantProfile.idealRanges.ph?.min,
      phMax: plantProfile.idealRanges.ph?.max,
      ecMin: plantProfile.idealRanges.ec?.min,
      ecMax: plantProfile.idealRanges.ec?.max,
      lightMin: plantProfile.idealRanges.lightHours?.min,
      lightMax: plantProfile.idealRanges.lightHours?.max,
    },
  })

  async function onSubmit(values: EditPlantFormValues) {
    try {
      await updatePlantProfile.mutateAsync({
        id: plantProfile.id,
        name: values.name,
        defaultMaturityDays: values.defaultMaturityDays,
        harvestWindowBufferDays: values.harvestWindowBufferDays,
        idealRanges: buildIdealRanges(values),
      })
      toast.success("Custom plant updated.")
      setOpen(false)
    } catch {
      form.setError("root", {
        message: "Could not update this plant. Try again.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`Edit ${plantProfile.name}`}>
          <Edit className="size-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit custom plant</DialogTitle>
          <DialogDescription>
            Correct the typical ready date and optional growing ranges.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root ? (
              <Alert variant="destructive">
                <TriangleAlert className="size-4" aria-hidden="true" />
                <AlertTitle>Could not save changes.</AlertTitle>
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plant name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultMaturityDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typical days to ready</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="harvestWindowBufferDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ready window days</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="rounded-md border border-border p-4">
              <p className="text-sm font-medium">Advanced growing ranges</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Optional, and only needed when you know the target range.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <RangeFields
                  form={form}
                  minName="temperatureMin"
                  maxName="temperatureMax"
                  label="Temperature C"
                />
                <RangeFields form={form} minName="phMin" maxName="phMax" label="pH" />
                <RangeFields form={form} minName="ecMin" maxName="ecMax" label="EC" />
                <RangeFields
                  form={form}
                  minName="lightMin"
                  maxName="lightMax"
                  label="Light hours"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updatePlantProfile.isPending}>
                {updatePlantProfile.isPending ? "Saving" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof CalendarCheck
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-3xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <Icon className="size-5 text-primary" aria-hidden="true" />
      </CardContent>
    </Card>
  )
}

function ComparisonRow({
  feature,
  starter,
  improved,
}: {
  feature: string
  starter: string
  improved: string
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{feature}</TableCell>
      <TableCell className="text-muted-foreground">{starter}</TableCell>
      <TableCell>{improved}</TableCell>
    </TableRow>
  )
}

function RangeFields({
  form,
  minName,
  maxName,
  label,
}: {
  form: ReturnType<typeof useForm<EditPlantFormValues>>
  minName: keyof EditPlantFormValues
  maxName: keyof EditPlantFormValues
  label: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <FormField
        control={form.control}
        name={minName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label} min</FormLabel>
            <FormControl>
              <Input type="number" step="0.1" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={maxName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label} max</FormLabel>
            <FormControl>
              <Input type="number" step="0.1" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function ImprovementsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

function EmptyImprovements() {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <h1 className="font-heading text-2xl font-semibold">Improvements</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Add crops and record harvest checks to see ready dates get clearer over time.
      </p>
      <Button asChild className="mt-5">
        <Link href="/crops/new">
          <Plus className="size-4" aria-hidden="true" />
          Add Crop
        </Link>
      </Button>
    </div>
  )
}

function getImprovementSummary(stats: ModelLearningStats[]) {
  const completedCycles = stats.reduce((total, stat) => total + stat.completedCycles, 0)
  const improvedStats = stats.filter(
    (stat) => stat.averageErrorBeforeDays > stat.averageErrorAfterDays,
  )
  const averageReduction = improvedStats.length
    ? average(
        improvedStats.map(
          (stat) => stat.averageErrorBeforeDays - stat.averageErrorAfterDays,
        ),
      )
    : 0

  return {
    completedCycles,
    averageReduction,
    highlyReliable: stats.filter((stat) => getEstimateQuality(stat.maturityLevel).label === "Highly reliable").length,
    gettingBetter: stats.filter((stat) => getEstimateQuality(stat.maturityLevel).label === "Getting better").length,
  }
}

function buildHarvestCheckHistory(
  cropSummaries: CropBatchSummary[],
  stats: ModelLearningStats[],
) {
  const completedCrops = cropSummaries
    .filter((crop) => crop.status === "completed")
    .slice(0, 3)
    .map((crop) => ({
      title: `${crop.plantName} harvest check recorded`,
      detail: `Future ${crop.plantName.toLowerCase()} estimates use this completed crop cycle.`,
      href: `/crops/${crop.id}?tab=feedback`,
    }))

  if (completedCrops.length) {
    return completedCrops
  }

  return stats
    .filter((stat) => stat.completedCycles > 0)
    .slice(0, 3)
    .map((stat) => ({
      title: `${stat.plantName} planning improved`,
      detail: `Average miss is now ${stat.averageErrorAfterDays.toFixed(1)} days after ${stat.completedCycles} harvest checks.`,
    }))
    .concat(
      stats.every((stat) => stat.completedCycles === 0)
        ? [
            {
              title: "Harvest checks will appear here",
              detail:
                "Record a completed harvest result to start improving future ready dates.",
            },
          ]
        : [],
    )
}

function getEstimateQuality(maturity: ModelMaturity) {
  if (maturity === "adaptive") {
    return {
      label: "Highly reliable",
      note: "Strong crop history is guiding future ready dates.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    }
  }

  if (maturity === "learning") {
    return {
      label: "Getting better",
      note: "Harvest checks are starting to reduce the average miss.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    }
  }

  return {
    label: "Starter",
    note: "Record harvest checks to improve future ready dates.",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  }
}

function buildIdealRanges(values: EditPlantFormValues): PlantIdealRanges {
  const ranges: PlantIdealRanges = {}

  addRange(ranges, "temperatureC", values.temperatureMin, values.temperatureMax)
  addRange(ranges, "ph", values.phMin, values.phMax)
  addRange(ranges, "ec", values.ecMin, values.ecMax)
  addRange(ranges, "lightHours", values.lightMin, values.lightMax)

  return ranges
}

function addRange(
  ranges: PlantIdealRanges,
  key: keyof PlantIdealRanges,
  min?: number,
  max?: number,
) {
  if (typeof min === "number" && typeof max === "number") {
    ranges[key] = { min, max }
  }
}

function validateRange(
  min: number | undefined,
  max: number | undefined,
  path: keyof EditPlantFormValues,
  context: z.RefinementCtx,
) {
  if (min !== undefined && max !== undefined && min >= max) {
    context.addIssue({
      code: "custom",
      path: [path],
      message: "Minimum must be less than maximum.",
    })
  }
}

function average(values: number[]) {
  const validValues = values.filter((value) => Number.isFinite(value))

  if (!validValues.length) {
    return 0
  }

  return validValues.reduce((total, value) => total + value, 0) / validValues.length
}
