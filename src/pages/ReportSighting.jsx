import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { reportApi } from '../services/api'

const initialData = {
  photo: '',
  location: '',
  dateTime: '',
  description: '',
}

function ReportSighting() {
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const onChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await reportApi.submitSighting(formData)
      setResult(response.data)
      setFormData(initialData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-steel-200 bg-white p-5 shadow-card sm:p-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">Report Sighting</h1>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4">
        <label className="text-sm font-medium text-steel-700">
          Upload Photo
          <input
            type="text"
            name="photo"
            value={formData.photo}
            onChange={onChange}
            placeholder="Photo URL or filename"
            required
            className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-steel-700">
            Location
            <input
              name="location"
              value={formData.location}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2"
            />
          </label>

          <label className="text-sm font-medium text-steel-700">
            Date / Time
            <input
              type="datetime-local"
              name="dateTime"
              value={formData.dateTime}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2"
            />
          </label>
        </div>

        <label className="text-sm font-medium text-steel-700">
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={3}
            required
            className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-3 font-semibold text-white hover:bg-navy-800 disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : null}
          Upload and Check with AI
        </button>
      </form>

      {loading ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">AI analyzing image...</p>
      ) : null}

      {result ? (
        <article className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="font-display text-lg font-semibold text-emerald-800">AI Result</h2>
          <p className="mt-1 text-sm text-emerald-700">{result.aiResult}</p>
          <p className="text-sm text-emerald-700">Confidence Score: {result.confidence}%</p>
        </article>
      ) : null}
    </section>
  )
}

export default ReportSighting
