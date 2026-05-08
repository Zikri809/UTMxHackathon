import { Suspense } from "react"

import {
  CalendarPage as CalendarPageContent,
  CalendarPageSkeleton,
} from "@/components/calendar/calendar-page"

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarPageSkeleton />}>
      <CalendarPageContent />
    </Suspense>
  )
}
