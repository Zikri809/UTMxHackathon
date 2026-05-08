import { Suspense } from "react"

import { SensorsPage as SensorsPageContent } from "@/components/sensors/sensors-page"
import { SensorsPageSkeleton } from "@/components/sensors/sensors-page"

export default function SensorsPage() {
  return (
    <Suspense fallback={<SensorsPageSkeleton />}>
      <SensorsPageContent />
    </Suspense>
  )
}
