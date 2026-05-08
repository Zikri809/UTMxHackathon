"use client"

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { DemoTourProvider } from "@/components/demo-tour-provider"
import { createQueryClient } from "@/lib/query/client"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <DemoTourProvider>{children}</DemoTourProvider>
    </QueryClientProvider>
  )
}
