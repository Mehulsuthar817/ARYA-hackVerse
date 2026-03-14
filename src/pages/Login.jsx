import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, getErrorMessage } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authApi.login(formData)
      navigate(response.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard')
    } catch (error) {
      setError(getErrorMessage(error, 'Invalid credentials. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-3xl border border-steel-200 bg-white p-6 shadow-card sm:p-8">
        <h1 className="font-display text-3xl font-bold text-navy-900">Login</h1>
        <p className="mt-2 text-sm text-steel-600">Access citizen or police dashboard.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-steel-700">
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              required
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2 outline-none ring-navy-300 focus:ring"
              placeholder="name@example.com"
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
              placeholder="********"
            />
          </label>

          <label className="block text-sm font-medium text-steel-700">
            Login As
            <select
              name="role"
              value={formData.role}
              onChange={onChange}
              className="mt-1 w-full rounded-xl border border-steel-300 px-3 py-2 outline-none ring-navy-300 focus:ring"
            >
                <option value="user">Citizen User</option>
              <option value="admin">Police / Admin</option>
            </select>
          </label>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-700 px-4 py-3 font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Login
          </button>

          <Link
            to="/signup"
            className="block rounded-xl border border-steel-300 px-4 py-3 text-center text-sm font-medium text-steel-700 hover:bg-steel-100"
          >
            Create Account
          </Link>
        </form>
      </section>
    </div>
  )
}

export default Login
