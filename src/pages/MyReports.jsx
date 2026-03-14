import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getErrorMessage, reportApi } from '../services/api'

const statusStyles = {
  Missing: 'bg-amber-100 text-amber-700',
  'Person Found': 'bg-emerald-100 text-emerald-700',
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
    <section className="rounded-2xl border border-steel-200 bg-white p-5 shadow-card sm:p-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">My Reports</h1>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading reports...
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : reports.length === 0 ? (
        <p className="mt-6 rounded-xl bg-steel-100 p-4 text-sm text-steel-700">
          No reports submitted yet.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-steel-200">
          <table className="min-w-full divide-y divide-steel-200 text-left text-sm">
            <thead className="bg-steel-100">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Report Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Photo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-200 bg-white">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-3">{report.name}</td>
                  <td className="px-4 py-3">{report.reportDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[report.statusLabel] || 'bg-steel-100 text-steel-700'}`}
                    >
                      {report.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {report.photo ? (
                      <a href={report.photo} target="_blank" rel="noreferrer" className="text-navy-700 hover:text-navy-900">
                        View Photo
                      </a>
                    ) : (
                      <span className="text-steel-500">Unavailable</span>
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
