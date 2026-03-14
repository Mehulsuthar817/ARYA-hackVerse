import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage, reportApi } from '../services/api'

const initialData = {
  photo: null,
  location: '',
  description: '',
}

function ReportSighting() {
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const onChange = (event) => {
    const { name, value, files, type } = event.target
    setFormData((prev) => ({ ...prev, [name]: type === 'file' ? files?.[0] || null : value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setResult(null)
    setError('')

    if (!formData.photo) {
      setError('Please upload a sighting photo.')
      setLoading(false)
      return
    }

    try {
      const response = await reportApi.submitSighting(formData)
      setResult(response.data)
      setFormData(initialData)
    } catch (submissionError) {
      setError(getErrorMessage(submissionError, 'Unable to process the sighting.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-steel-700/80 bg-steel-900/80 p-5 shadow-card sm:p-6">
      <h1 className="font-display text-2xl font-bold text-steel-50">Report Sighting</h1>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4">
        <label className="text-sm font-medium text-steel-200">
          Upload Photo
          <input
            type="file"
            name="photo"
            onChange={onChange}
            accept=".jpg,.jpeg,.png,.bmp,.webp"
            required
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-steel-200">
          Location
          <input
            name="location"
            value={formData.location}
            onChange={onChange}
            required
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-steel-200">
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={3}
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          />
        </label>

        {error ? <p className="rounded-xl bg-red-500/12 px-3 py-2 text-sm text-red-300">{error}</p> : null}

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
        <p className="mt-4 rounded-xl bg-amber-500/12 px-3 py-2 text-sm text-amber-300">AI analyzing image...</p>
      ) : null}

      {result ? (
        <article className="mt-4 rounded-xl border border-emerald-500/35 bg-emerald-500/12 p-4">
          <h2 className="font-display text-lg font-semibold text-emerald-200">AI Result</h2>
          <p className="mt-1 text-sm text-emerald-300">{result.aiResult}</p>
          <p className="text-sm text-emerald-300">Confidence Score: {result.confidence}%</p>
          {result.topMatches?.length ? (
            <p className="mt-2 text-sm text-emerald-300">Top match: {result.topMatches[0].name}</p>
          ) : null}
        </article>
      ) : null}
    </section>
  )
}

export default ReportSighting
