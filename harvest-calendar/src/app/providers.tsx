"use client"

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"

import { createQueryClient } from "@/lib/query/client"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
