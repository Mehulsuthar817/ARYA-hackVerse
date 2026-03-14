import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import CameraFeed from '../components/CameraFeed'
import { reportApi } from '../services/api'

function LiveCCTV() {
  const [loading, setLoading] = useState(true)
  const [cameras, setCameras] = useState([])

  useEffect(() => {
    const fetchCameras = async () => {
      const response = await reportApi.getCameras()
      setCameras(response.data)
      setLoading(false)
    }

    fetchCameras()
  }, [])

  return (
    <section className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-navy-900">CCTV Monitoring</h1>
        <p className="text-sm text-steel-600">Live feeds with AI face match overlays.</p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading camera feeds...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cameras.map((camera) => (
            <CameraFeed key={camera.id} camera={camera} />
          ))}
        </div>
      )}
    </section>
  )
}

export default LiveCCTV
