import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getErrorMessage, reportApi } from '../services/api'

function MySightings() {
  const [loading, setLoading] = useState(true)
  const [sightings, setSightings] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSightings = async () => {
      try {
        const response = await reportApi.getMySightings()
        setSightings(response.data)
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load your sightings.'))
      } finally {
        setLoading(false)
      }
    }

    fetchSightings()
  }, [])

  return (
    <section className="rounded-2xl border border-steel-700/80 bg-steel-900/80 p-5 shadow-card sm:p-6">
      <h1 className="font-display text-2xl font-bold text-steel-50">My Sightings</h1>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-steel-300">
          <Loader2 className="animate-spin" size={18} /> Loading sightings...
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-red-500/12 p-4 text-sm text-red-300">{error}</p>
      ) : sightings.length === 0 ? (
        <p className="mt-6 rounded-xl bg-steel-800/75 p-4 text-sm text-steel-200">No sightings uploaded yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {sightings.map((sighting) => (
            <article key={sighting.id} className="rounded-xl border border-steel-700/80 bg-steel-800/45 p-4">
              {sighting.photo ? (
                <img src={sighting.photo} alt={sighting.location} className="mb-3 h-48 w-full rounded-xl object-cover" />
              ) : null}
              <p className="font-medium text-steel-100">{sighting.location}</p>
              <p className="text-sm text-steel-300">{sighting.dateTime}</p>
              <p className="mt-2 text-sm text-steel-200">{sighting.description}</p>
              <p className="mt-2 text-sm font-medium text-emerald-300">
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
