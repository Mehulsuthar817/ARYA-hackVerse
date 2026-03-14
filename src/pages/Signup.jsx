import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const onChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      await authApi.signup(formData)
      setSuccess('Account created successfully. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1000)
    } catch {
      setError('Unable to create account. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-3xl border border-steel-200 bg-white p-6 shadow-card sm:p-8">
        <h1 className="font-display text-3xl font-bold text-navy-900">Create Account</h1>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-steel-700 sm:col-span-2">
            Full Name
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2 outline-none ring-navy-300 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-steel-700">
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2 outline-none ring-navy-300 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-steel-700">
            Phone Number
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2 outline-none ring-navy-300 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-steel-700">
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2 outline-none ring-navy-300 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-steel-700">
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2 outline-none ring-navy-300 focus:ring"
            />
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">{error}</p>}
          {success && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 sm:col-span-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-3 font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Create Account
          </button>

          <Link
            to="/login"
            className="rounded-xl border border-steel-300 px-4 py-3 text-center text-sm font-medium text-steel-700 hover:bg-steel-100 sm:col-span-2"
          >
            Back to Login
          </Link>
        </form>
      </section>
    </div>
  )
}

export default Signup
