import { LoadingSpinner } from "@/components/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
        <p className="text-muted-foreground text-center">Yükleniyor...</p>
      </div>
    </div>
  )
}
