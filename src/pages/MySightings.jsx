import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { reportApi } from '../services/api'

function MySightings() {
  const [loading, setLoading] = useState(true)
  const [sightings, setSightings] = useState([])

  useEffect(() => {
    const fetchSightings = async () => {
      const response = await reportApi.getMySightings()
      setSightings(response.data)
      setLoading(false)
    }

    fetchSightings()
  }, [])

  return (
    <section className="rounded-2xl border border-steel-200 bg-white p-5 shadow-card sm:p-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">My Sightings</h1>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading sightings...
        </div>
      ) : sightings.length === 0 ? (
        <p className="mt-6 rounded-xl bg-steel-100 p-4 text-sm text-steel-700">No sightings uploaded yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {sightings.map((sighting) => (
            <article key={sighting.id} className="rounded-xl border border-steel-200 bg-steel-50 p-4">
              <p className="font-medium text-steel-800">{sighting.location}</p>
              <p className="text-sm text-steel-600">{sighting.dateTime}</p>
              <p className="mt-2 text-sm text-steel-700">{sighting.description}</p>
              <p className="mt-2 text-sm font-medium text-emerald-700">
                {sighting.aiResult} ({sighting.confidence}%)
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default MySightings
