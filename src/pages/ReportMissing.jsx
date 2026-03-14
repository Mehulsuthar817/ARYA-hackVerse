import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage, reportApi } from '../services/api'

const initialForm = {
  name: '',
  age: '',
  gender: 'Male',
  lastSeenLocation: '',
  lastSeenDate: '',
  description: '',
  photo: null,
}

function ReportMissing() {
  const [formData, setFormData] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const onChange = (event) => {
    const { name, value, files, type } = event.target
    setFormData((prev) => ({ ...prev, [name]: type === 'file' ? files?.[0] || null : value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')

    if (!formData.photo) {
      setError('Please upload a clear face photo.')
      setLoading(false)
      return
    }

    try {
      const response = await reportApi.submitMissing(formData)
      setSuccess(response?.data?.message || 'Report submitted successfully.')
      setFormData(initialForm)
    } catch (submissionError) {
      setError(getErrorMessage(submissionError, 'Unable to submit the report.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-steel-700/80 bg-steel-900/80 p-5 shadow-card sm:p-6">
      <h1 className="font-display text-2xl font-bold text-steel-50">Report Missing Person</h1>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-steel-200 sm:col-span-2">
          Full Name
          <input
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-steel-200">
          Age
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={onChange}
            required
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-steel-200">
          Gender
          <select
            name="gender"
            value={formData.gender}
            onChange={onChange}
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </label>

        <label className="text-sm font-medium text-steel-200">
          Last Seen Location
          <input
            name="lastSeenLocation"
            value={formData.lastSeenLocation}
            onChange={onChange}
            required
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-steel-200">
          Last Seen Date
          <input
            type="date"
            name="lastSeenDate"
            value={formData.lastSeenDate}
            onChange={onChange}
            required
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-steel-200 sm:col-span-2">
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={3}
            className="mt-1 w-full rounded-xl border border-steel-600/85 px-3 py-2"
          />
        </label>

        <label className="text-sm font-medium text-steel-200 sm:col-span-2">
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

        {error ? <p className="rounded-xl bg-red-500/12 px-3 py-2 text-sm text-red-300 sm:col-span-2">{error}</p> : null}

        {success ? (
          <p className="rounded-xl bg-emerald-500/12 px-3 py-2 text-sm text-emerald-300 sm:col-span-2">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-3 font-semibold text-white hover:bg-navy-800 disabled:opacity-70 sm:col-span-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : null}
          Submit Report
        </button>
      </form>
    </section>
  )
}

export default ReportMissing
