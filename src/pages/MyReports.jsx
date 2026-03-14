import { Loader2, Trash2, View } from 'lucide-react'
import { useEffect, useState } from 'react'
import { reportApi } from '../services/api'

const statusStyles = {
  Pending: 'bg-amber-100 text-amber-700',
  Verified: 'bg-blue-100 text-blue-700',
  'Person Found': 'bg-emerald-100 text-emerald-700',
}

function MyReports() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])

  useEffect(() => {
    const fetchReports = async () => {
      const response = await reportApi.getMyReports()
      setReports(response.data)
      setLoading(false)
    }

    fetchReports()
  }, [])

  const deleteReport = (reportId) => {
    setReports((prev) => prev.filter((report) => report.id !== reportId))
  }

  return (
    <section className="rounded-2xl border border-steel-200 bg-white p-5 shadow-card sm:p-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">My Reports</h1>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading reports...
        </div>
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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-200 bg-white">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-3">{report.name}</td>
                  <td className="px-4 py-3">{report.reportDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[report.status] || 'bg-steel-100 text-steel-700'}`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center gap-1 rounded-lg bg-steel-100 px-2 py-1 text-steel-700 hover:bg-steel-200">
                        <View size={14} /> View
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
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
