declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string
      type: string
      target: HTMLElement
      constraints?: {
        width?: { min?: number; ideal?: number; max?: number }
        height?: { min?: number; ideal?: number; max?: number }
        facingMode?: string
        deviceId?: { exact: string } | undefined
        aspectRatio?: { min?: number; max?: number }
      }
    }
    locator?: {
      patchSize?: string
      halfSample?: boolean
      showCanvas?: boolean
      showPatches?: boolean
      showFoundPatches?: boolean
      showSkeleton?: boolean
      showLabels?: boolean
      showBoundingBox?: boolean
      showFrequency?: boolean
    }
    numOfWorkers?: number
    decoder: {
      readers: string[]
      debug?: {
        showCanvas?: boolean
        showPatches?: boolean
        showFoundPatches?: boolean
        showSkeleton?: boolean
        showLabels?: boolean
        showPatchLabels?: boolean
        showBoundingBox?: boolean
        boxFromPatches?: {
          showTransformed?: boolean
          showTransformedBox?: boolean
          showBB?: boolean
        }
      }
      multiple?: boolean
    }
    locate?: boolean
    frequency?: number
    debug?: boolean
  }

  interface QuaggaResult {
    codeResult?: {
      code: string
      format?: string
    }
    boxes?: any[]
  }

  interface Quagga {
    init(config: QuaggaConfig, callback: (err: any) => void): void
    start(): void
    stop(): void
    onDetected(callback: (result: QuaggaResult) => void): void
    onProcessed(callback: (result: QuaggaResult) => void): void
  }

  const Quagga: Quagga
  export default Quagga
}
