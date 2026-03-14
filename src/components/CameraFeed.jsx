import { Camera, Maximize2, ScanFace } from 'lucide-react'

function CameraFeed({ camera, onClick }) {
  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-steel-300 bg-navy-900 shadow-card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
      aria-label={`Open ${camera.location} fullscreen`}
    >
      {camera.feedUrl ? (
        <img
          src={camera.feedUrl}
          alt={camera.location}
          className="h-44 w-full object-cover opacity-80"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-navy-800 text-sm text-steel-100">Feed unavailable</div>
      )}

      <div className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white">
        LIVE
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-2">
        <span className="rounded-full bg-black/40 px-3 py-1 text-xs text-white">{camera.id}</span>
        <span className="rounded-full bg-black/40 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={13} />
        </span>
      </div>

      <div className="absolute inset-0 border-2 border-dashed border-emerald-300/30" />

      <div className="absolute bottom-0 w-full bg-gradient-to-t from-navy-950 to-transparent p-4 text-white">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Camera size={16} /> {camera.location}
        </p>
        <div className="text-xs text-steel-100">
          {camera.detected ? (
            <p className="flex items-center gap-2 text-amber-200">
              <ScanFace size={14} />
              Face Detected | Possible Match | Confidence {camera.confidence}%
            </p>
          ) : (
            <p className="text-emerald-200">No suspicious pattern detected.</p>
          )}
        </div>
      </div>
    </article>
  )
}

export default CameraFeed
