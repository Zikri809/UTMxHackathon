"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  assignSensorGroupToBatch,
  createCropBatch,
  createCropBatchWithDependencies,
  createCustomPlantProfile,
  createFarmLocation,
  getCropBatch,
  getCropBatches,
  getCropBatchSummaries,
  getFarmLocations,
  getHarvestFeedback,
  getModelLearningStats,
  getPlantProfiles,
  getPrediction,
  getSensorDevices,
  getSensorGroups,
  getSensorReadings,
  resetDemoData,
  submitHarvestFeedback,
  updateCropBatch,
  updateCropStatus,
  updateFarmLocation,
  updatePlantProfile,
} from "@/lib/mock-api"
import type {
  AssignSensorGroupInput,
  CreateCropBatchInput,
  CreateCropBatchWithDependenciesInput,
  CreateCustomPlantProfileInput,
  CreateFarmLocationInput,
  SubmitHarvestFeedbackInput,
  UpdateCropBatchInput,
  UpdateCropStatusInput,
  UpdateFarmLocationInput,
  UpdatePlantProfileInput,
} from "@/types"

import { queryKeys } from "./keys"

export function useFarmLocations() {
  return useQuery({
    queryKey: queryKeys.farmLocations,
    queryFn: getFarmLocations,
  })
}

export function useCreateFarmLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateFarmLocationInput) => createFarmLocation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.farmLocations })
    },
  })
}

export function useUpdateFarmLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateFarmLocationInput) => updateFarmLocation(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.farmLocations })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatches })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatchSummaries })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorGroups })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorDevices })
    },
  })
}

export function usePlantProfiles() {
  return useQuery({
    queryKey: queryKeys.plantProfiles,
    queryFn: getPlantProfiles,
  })
}

export function useCreateCustomPlantProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCustomPlantProfileInput) => createCustomPlantProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plantProfiles })
      void queryClient.invalidateQueries({ queryKey: queryKeys.learningStats })
    },
  })
}

export function useUpdatePlantProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdatePlantProfileInput) => updatePlantProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plantProfiles })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatches })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatchSummaries })
      void queryClient.invalidateQueries({ queryKey: queryKeys.predictions })
      void queryClient.invalidateQueries({ queryKey: queryKeys.learningStats })
    },
  })
}

export function useCropBatches() {
  return useQuery({
    queryKey: queryKeys.cropBatches,
    queryFn: getCropBatches,
  })
}

export function useCropBatchSummaries() {
  return useQuery({
    queryKey: queryKeys.cropBatchSummaries,
    queryFn: getCropBatchSummaries,
  })
}

export function useCropBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cropBatch(batchId ?? ""),
    queryFn: () => getCropBatch(batchId!),
    enabled: Boolean(batchId),
  })
}

export function useCreateCropBatch() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (input: CreateCropBatchInput) => createCropBatch(input),
    onSuccess: (cropBatch) => {
      invalidateCropCollections(queryClient)
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorGroups })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorDevices })
      void queryClient.invalidateQueries({ queryKey: queryKeys.learningStats })
      toast.success("Crop added with a starter harvest estimate.")
      router.push(`/crops/${cropBatch.id}`)
    },
  })
}

export function useCreateCropBatchWithDependencies() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (input: CreateCropBatchWithDependenciesInput) =>
      createCropBatchWithDependencies(input),
    onSuccess: ({ cropBatch }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plantProfiles })
      void queryClient.invalidateQueries({ queryKey: queryKeys.farmLocations })
      invalidateCropCollections(queryClient)
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorGroups })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorDevices })
      void queryClient.invalidateQueries({ queryKey: queryKeys.learningStats })
      toast.success("Crop added with a starter harvest estimate.", {
        action: cropBatch.sensorGroupId
          ? undefined
          : {
              label: "Connect devices",
              onClick: () =>
                router.push(
                  `/sensors?action=assign&batchId=${cropBatch.id}&returnTo=/crops/${cropBatch.id}`,
                ),
            },
      })
      router.push(`/crops/${cropBatch.id}`)
    },
  })
}

export function useUpdateCropBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCropBatchInput) => updateCropBatch(input),
    onSuccess: (cropBatch) => {
      invalidateCrop(queryClient, cropBatch.id)
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorGroups })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorDevices })
    },
  })
}

export function useUpdateCropStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCropStatusInput) => updateCropStatus(input),
    onSuccess: (cropBatch) => {
      invalidateCrop(queryClient, cropBatch.id)
      void queryClient.invalidateQueries({ queryKey: queryKeys.learningStats })
    },
  })
}

export function useSensorDevices() {
  return useQuery({
    queryKey: queryKeys.sensorDevices,
    queryFn: getSensorDevices,
  })
}

export function useSensorGroups() {
  return useQuery({
    queryKey: queryKeys.sensorGroups,
    queryFn: getSensorGroups,
  })
}

export function useAssignSensorGroupToBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignSensorGroupInput) => assignSensorGroupToBatch(input),
    onSuccess: ({ cropBatch, previousAssignedBatchId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorGroups })
      void queryClient.invalidateQueries({ queryKey: queryKeys.sensorDevices })
      invalidateCrop(queryClient, cropBatch.id)

      if (previousAssignedBatchId) {
        invalidateCrop(queryClient, previousAssignedBatchId)
      }
    },
  })
}

export function useSensorReadings(batchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sensorReadings(batchId ?? ""),
    queryFn: () => getSensorReadings(batchId!),
    enabled: Boolean(batchId),
  })
}

export function useHarvestPrediction(batchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.prediction(batchId ?? ""),
    queryFn: () => getPrediction(batchId!),
    enabled: Boolean(batchId),
  })
}

export function useHarvestFeedback(batchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.harvestFeedback(batchId ?? ""),
    queryFn: () => getHarvestFeedback(batchId!),
    enabled: Boolean(batchId),
  })
}

export function useSubmitHarvestFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SubmitHarvestFeedbackInput) => submitHarvestFeedback(input),
    onSuccess: ({ cropBatch, feedback }) => {
      invalidateCrop(queryClient, cropBatch.id)
      void queryClient.invalidateQueries({ queryKey: queryKeys.harvestFeedback(feedback.batchId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.learningStats })
      toast.success("Harvest check recorded.")
    },
  })
}

export function useModelLearningStats() {
  return useQuery({
    queryKey: queryKeys.learningStats,
    queryFn: getModelLearningStats,
  })
}

export function useResetDemoData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resetDemoData,
    onSuccess: () => {
      void queryClient.invalidateQueries()
      toast.success("Demo data restored.")
    },
  })
}

function invalidateCrop(
  queryClient: ReturnType<typeof useQueryClient>,
  batchId: string,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatch(batchId) })
  void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatches })
  void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatchSummaries })
  void queryClient.invalidateQueries({ queryKey: queryKeys.sensorReadings(batchId) })
  void queryClient.invalidateQueries({ queryKey: queryKeys.prediction(batchId) })
}

function invalidateCropCollections(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatches })
  void queryClient.invalidateQueries({ queryKey: queryKeys.cropBatchSummaries })
}
