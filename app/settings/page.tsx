"use client"

import { Suspense } from "react"
import SettingsPageContent from "./settings-content"

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-4 max-w-md">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              <div>
                <div className="h-5 w-20 bg-muted rounded animate-pulse mb-1" />
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  )
}
