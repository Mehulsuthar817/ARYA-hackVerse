import { Camera, Loader2, Maximize2, ScanFace, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import CameraFeed from '../components/CameraFeed'
import { getErrorMessage, reportApi } from '../services/api'

function FullscreenModal({ camera, onClose }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-navy-950/90">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white tracking-wide">LIVE</span>
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Camera size={16} /> {camera.location}
          </span>
          <span className="text-xs text-steel-400">{camera.id}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-steel-300 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close fullscreen"
        >
          <X size={22} />
        </button>
      </div>

      {/* Feed */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {camera.feedUrl ? (
          <img
            src={camera.feedUrl}
            alt={camera.location}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <p className="text-steel-400">Feed unavailable</p>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="px-5 py-3 bg-navy-950/90 text-xs">
        {camera.detected ? (
          <p className="flex items-center gap-2 text-amber-300">
            <ScanFace size={14} />
            Face Detected — Possible Match — Confidence {camera.confidence}%
          </p>
        ) : (
          <p className="text-emerald-300">No suspicious pattern detected.</p>
        )}
      </div>
    </div>
  )
}

function LiveCCTV() {
  const [loading, setLoading] = useState(true)
  const [cameras, setCameras] = useState([])
  const [error, setError] = useState('')
  const [activeCamera, setActiveCamera] = useState(null)

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await reportApi.getCameras()
        setCameras(response.data)
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load CCTV feeds.'))
      } finally {
        setLoading(false)
      }
    }

    fetchCameras()
  }, [])

  return (
    <section className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy-900">CCTV Monitoring</h1>
        <p className="text-sm text-steel-600">Live feeds with AI face match overlays. Click any feed to open fullscreen.</p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading camera feeds...
        </div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cameras.map((camera) => (
            <CameraFeed key={camera.id} camera={camera} onClick={() => setActiveCamera(camera)} />
          ))}
        </div>
      )}

      {activeCamera && (
        <FullscreenModal camera={activeCamera} onClose={() => setActiveCamera(null)} />
      )}
    </section>
  )
}

export default LiveCCTV
