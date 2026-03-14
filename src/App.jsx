import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import AdminDashboard from './admin/AdminDashboard'
import Database from './admin/Database'
import LiveCCTV from './admin/LiveCCTV'
import MatchVerification from './admin/MatchVerification'
import Home from './pages/Home'
import Login from './pages/Login'
import MissingPersons from './pages/MissingPersons'
import MyReports from './pages/MyReports'
import MySightings from './pages/MySightings'
import ReportMissing from './pages/ReportMissing'
import ReportSighting from './pages/ReportSighting'
import Signup from './pages/Signup'
import UserDashboard from './pages/UserDashboard'
import { getStoredUser } from './services/api'

const getAuthUser = () => getStoredUser()

function ProtectedRoute({ children, role }) {
  const user = getAuthUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return children
}

function AppLayout({ children }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <Navbar />
      <main className="mt-6 flex-1">{children}</main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="user">
            <AppLayout>
              <UserDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report-missing"
        element={
          <ProtectedRoute role="user">
            <AppLayout>
              <ReportMissing />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report-sighting"
        element={
          <ProtectedRoute role="user">
            <AppLayout>
              <ReportSighting />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-reports"
        element={
          <ProtectedRoute role="user">
            <AppLayout>
              <MyReports />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-sightings"
        element={
          <ProtectedRoute role="user">
            <AppLayout>
              <MySightings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/missing-persons"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MissingPersons />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/live-cctv"
        element={
          <ProtectedRoute role="admin">
            <AppLayout>
              <LiveCCTV />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/match-verification"
        element={
          <ProtectedRoute role="admin">
            <AppLayout>
              <MatchVerification />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/database"
        element={
          <ProtectedRoute role="admin">
            <AppLayout>
              <Database />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
