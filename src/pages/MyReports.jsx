import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getErrorMessage, reportApi } from '../services/api'

const statusStyles = {
  Missing: 'bg-amber-500/18 text-amber-300',
  'Person Found': 'bg-emerald-500/18 text-emerald-300',
}

function MyReports() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await reportApi.getMyReports()
        setReports(response.data)
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load your reports.'))
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  return (
    <section className="rounded-2xl border border-steel-700/80 bg-steel-900/80 p-5 shadow-card sm:p-6">
      <h1 className="font-display text-2xl font-bold text-steel-50">My Reports</h1>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-steel-300">
          <Loader2 className="animate-spin" size={18} /> Loading reports...
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-red-500/12 p-4 text-sm text-red-300">{error}</p>
      ) : reports.length === 0 ? (
        <p className="mt-6 rounded-xl bg-steel-800/75 p-4 text-sm text-steel-200">
          No reports submitted yet.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-steel-700/80">
          <table className="min-w-full divide-y divide-steel-700/70 text-left text-sm">
            <thead className="bg-steel-800/75">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Report Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Photo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-700/60 bg-steel-900/80">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-3">{report.name}</td>
                  <td className="px-4 py-3">{report.reportDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[report.statusLabel] || 'bg-steel-800/75 text-steel-200'}`}
                    >
                      {report.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {report.photo ? (
                      <a href={report.photo} target="_blank" rel="noreferrer" className="text-navy-200 hover:text-steel-50">
                        View Photo
                      </a>
                    ) : (
                      <span className="text-steel-400">Unavailable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default MyReports
