import { useCallback, useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { Bolt, Image as ImageIcon, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Verdict } from '@/types/api'

const verdictColor: Record<Verdict, string> = {
  SAFE: 'border-ios-safe',
  SUSPICIOUS: 'border-ios-warning',
  DANGEROUS: 'border-ios-danger',
}

export function Viewfinder({
  verdict,
  scanning,
  onScan,
  onToast,
}: {
  verdict: Verdict | null
  scanning: boolean
  onScan: (raw: string) => void
  onToast: (message: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDecode = useCallback((result: QrScanner.ScanResult) => onScan(result.data), [onScan])

  useEffect(() => {
    if (!videoRef.current) return
    const scanner = new QrScanner(videoRef.current, handleDecode, {
      preferredCamera: 'environment',
      highlightScanRegion: false,
      highlightCodeOutline: false,
      returnDetailedScanResult: true,
      onDecodeError: () => {},
    })
    scannerRef.current = scanner
    void scanner
      .start()
      .then(() => scanner.hasFlash())
      .then(setTorchAvailable)
      .catch((error: unknown) =>
        setCameraError(error instanceof Error ? error.message : 'Camera access is unavailable.'),
      )
    return () => {
      scanner.stop()
      scanner.destroy()
      scannerRef.current = null
    }
  }, [handleDecode])

  const toggleTorch = async () => {
    try {
      if (torchOn) await scannerRef.current?.turnFlashOff()
      else await scannerRef.current?.turnFlashOn()
      setTorchOn(!torchOn)
    } catch {
      onToast('Torch is unavailable on this camera')
    }
  }

  const decodeImage = async (file?: File) => {
    if (!file) return
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      onScan(result.data)
    } catch {
      onToast('No QR code found in that image')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between p-4">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-35" muted playsInline />
      {cameraError && (
        <div className="ios-blur-subtle relative z-10 rounded-2xl border border-ios-warning/30 bg-ios-warning/10 px-3 py-2 text-center text-xs text-white/80">
          Camera unavailable. Use HTTPS and allow camera access, or choose an image.
        </div>
      )}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center">
        <div className="pointer-events-none absolute -inset-14 rounded-full bg-[radial-gradient(circle,rgba(30,41,59,0.65),transparent_70%)]" />
        <div
          className={`relative h-64 w-64 rounded-[32px] border border-white/20 p-4 transition-colors duration-300 ${verdict ? verdictColor[verdict] : ''}`}
        >
          <div className="corner corner-tl" />
          <div className="corner corner-tr" />
          <div className="corner corner-bl" />
          <div className="corner corner-br" />
          <div className="animate-ios-laser absolute left-3 right-3 top-4 z-10 h-1 rounded-full bg-gradient-to-r from-transparent via-ios-accent to-transparent shadow-[0_0_15px_#0A84FF]" />
          <div className="flex h-full items-center justify-center text-white opacity-20">
            <QrCode size={112} strokeWidth={3} />
          </div>
          {scanning && <div className="absolute inset-0 rounded-[32px] bg-ios-accent/10" />}
        </div>
        <div className="ios-blur-subtle mt-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
          {scanning ? 'Analyzing payload…' : 'Align QR code within frame'}
        </div>
      </div>
      <div className="relative z-10 flex justify-center gap-6 pb-2">
        <Button
          type="button"
          aria-label="Toggle camera torch"
          disabled={!torchAvailable}
          onClick={() => void toggleTorch()}
          className={`h-12 w-12 rounded-full p-0 ${torchOn ? 'text-ios-warning' : ''}`}
        >
          <Bolt size={17} />
        </Button>
        <Button
          type="button"
          aria-label="Choose QR image"
          onClick={() => fileRef.current?.click()}
          className="h-12 w-12 rounded-full p-0"
        >
          <ImageIcon size={17} />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void decodeImage(event.target.files?.[0])}
        />
      </div>
    </div>
  )
}
