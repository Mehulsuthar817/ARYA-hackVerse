import {
  Camera,
  CircleUserRound,
  LogOut,
  Shield,
  UserRoundSearch,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { clearAuthSession, getStoredUser } from '../services/api'

const userLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/report-missing', label: 'Report Missing Person' },
  { to: '/report-sighting', label: 'Report Sighting' },
  { to: '/my-reports', label: 'My Reports' },
  { to: '/my-sightings', label: 'My Sightings' },
  { to: '/missing-persons', label: 'Missing Persons' },
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Admin Dashboard' },
  { to: '/admin/live-cctv', label: 'CCTV Monitoring' },
  { to: '/admin/match-verification', label: 'Match Verification' },
  { to: '/admin/database', label: 'Case Database' },
]

function Navbar() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const links = user?.role === 'admin' ? adminLinks : userLinks

  const logout = () => {
    clearAuthSession()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  return (
    <header className="rounded-2xl border border-navy-200 bg-white/90 p-4 shadow-card backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-steel-200 pb-4">
        <Link to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
          <div className="rounded-xl bg-navy-700 p-2 text-white">
            <UserRoundSearch size={18} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-navy-900">ARYA Surveillance</p>
            <p className="text-xs text-steel-600">Missing Person Identification System</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-steel-100 px-3 py-2 text-sm text-steel-700">
            {user.role === 'admin' ? <Shield size={14} /> : <CircleUserRound size={14} />}
            <span>{user.name}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-800 px-3 py-2 text-sm font-medium text-white hover:bg-navy-900"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-navy-700 text-white'
                  : 'bg-steel-100 text-steel-700 hover:bg-steel-200'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}

        {user.role === 'admin' && (
          <div className="ml-auto flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800">
            <Camera size={14} /> 6 Cameras Active
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
