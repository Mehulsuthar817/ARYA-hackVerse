import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getErrorMessage, reportApi } from '../services/api'

function Database() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const response = await reportApi.getMissingPersons({ status: 'all' })
        setRows(response.data)
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load case database.'))
      } finally {
        setLoading(false)
      }
    }

    fetchRows()
  }, [])

  return (
    <section className="rounded-2xl border border-steel-200 bg-white p-5 shadow-card sm:p-6">
      <h1 className="font-display text-3xl font-bold text-navy-900">Case Database</h1>
      <p className="mt-1 text-sm text-steel-600">Centralized case index for police operations.</p>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading case database...
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-steel-200">
          <table className="min-w-full divide-y divide-steel-200 text-left text-sm">
            <thead className="bg-steel-100">
              <tr>
                <th className="px-4 py-3">Case ID</th>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-200 bg-white">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.id}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.statusLabel}</td>
                  <td className="px-4 py-3">{row.lastSeenLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default Database
