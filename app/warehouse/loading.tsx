import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="md" />
        <p className="text-muted-foreground">Depo verileri yükleniyor...</p>
      </div>
    </div>
  )
}
