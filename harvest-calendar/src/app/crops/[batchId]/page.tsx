import { CropDetailPage as CropDetailPageContent } from "@/components/crops/crop-detail-page"

export default async function CropDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params

  return <CropDetailPageContent batchId={batchId} />
}
