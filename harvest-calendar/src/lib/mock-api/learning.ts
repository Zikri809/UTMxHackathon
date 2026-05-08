import type { ModelLearningStats } from "@/types/learning"

import { readDemoData, withMockDelay } from "./storage"

export async function getModelLearningStats(): Promise<ModelLearningStats[]> {
  return withMockDelay(readDemoData().learningStats)
}
