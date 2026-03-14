import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL

export const storageKeys = {
  token: 'mpis_token',
  user: 'mpis_user',
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

export const normalizeRole = (role) => (role === 'citizen' ? 'user' : role)

export const getStoredUser = () => {
  const rawUser = localStorage.getItem(storageKeys.user)
  if (!rawUser) {
    return null
  }

  try {
    const user = JSON.parse(rawUser)
    return user ? { ...user, role: normalizeRole(user.role) } : null
  } catch {
    return null
  }
}

export const clearAuthSession = () => {
  localStorage.removeItem(storageKeys.token)
  localStorage.removeItem(storageKeys.user)
}

export const setAuthSession = ({ accessToken, user }) => {
  if (accessToken) {
    localStorage.setItem(storageKeys.token, accessToken)
  }

  if (user) {
    localStorage.setItem(
      storageKeys.user,
      JSON.stringify({ ...user, role: normalizeRole(user.role) }),
    )
  }
}

const getStoredToken = () => localStorage.getItem(storageKeys.token)

const toBackendUrl = (path) => {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  if (!BACKEND_BASE_URL) {
    return path
  }

  return `${BACKEND_BASE_URL}${path}`
}

export const resolveMediaUrl = (path) => {
  if (!path) {
    return ''
  }

  const normalized = String(path).replace(/\\/g, '/')
  const uploadsIndex = normalized.toLowerCase().lastIndexOf('/uploads/')

  if (uploadsIndex >= 0) {
    return toBackendUrl(normalized.slice(uploadsIndex))
  }

  if (normalized.toLowerCase().startsWith('uploads/')) {
    return toBackendUrl(`/${normalized}`)
  }

  if (normalized.startsWith('/')) {
    return toBackendUrl(normalized)
  }

  return normalized
}

export const getErrorMessage = (error, fallbackMessage = 'Request failed.') => {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (!item || typeof item !== 'object') {
          return ''
        }

        const location = Array.isArray(item.loc)
          ? item.loc.filter((part) => part !== 'body').join(' ')
          : ''

        return location ? `${location}: ${item.msg}` : item.msg
      })
      .filter(Boolean)

    if (messages.length > 0) {
      return messages.join('. ')
    }
  }

  const message = error?.response?.data?.message || error?.message
  return typeof message === 'string' && message.trim() ? message : fallbackMessage
}

const formatDate = (value, withTime = false) => {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return withTime
    ? parsed.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : parsed.toLocaleDateString([], { dateStyle: 'medium' })
}

const formatConfidence = (value) => {
  const confidence = Number(value)
  if (Number.isNaN(confidence)) {
    return 0
  }

  return confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)
}

const normalizeMissingPerson = (record) => ({
  ...record,
  id: record.id,
  name: record.name,
  age: record.age,
  gender: record.gender,
  description: record.description || 'No description provided.',
  lastSeenLocation: record.last_seen_location || record.lastSeenLocation || 'Unknown',
  lastSeenDate: record.last_seen_date || record.lastSeenDate || 'Unknown',
  photo: resolveMediaUrl(record.photo_url || record.photo_path || record.photo),
  status: record.status === 'found' ? 'found' : 'missing',
  statusLabel: record.status === 'found' ? 'Person Found' : 'Missing',
  reportDate: formatDate(record.created_at || record.reportDate),
})

const normalizeSighting = (record) => ({
  ...record,
  id: record.id,
  location: record.location || 'Unknown',
  description: record.description || 'No description provided.',
  dateTime: formatDate(record.timestamp || record.dateTime, true),
  photo: resolveMediaUrl(record.image_url || record.image_path || record.photo),
  confidence: formatConfidence(record.confidence_score || record.confidence),
  aiResult: record.match_person_id
    ? 'Possible match detected.'
    : 'No confirmed match recorded yet.',
})

const normalizeMatch = (record) => ({
  ...record,
  id: record.id,
  personName: record.person_name || record.name || 'Unknown',
  confidence: formatConfidence(record.confidence),
  location: record.sighting_location || record.location || 'Unknown',
  time: formatDate(record.timestamp || record.time, true),
  missingPhoto: resolveMediaUrl(record.person_photo_url || record.photo_url || record.person_photo || record.photo_path),
  cctvPhoto: resolveMediaUrl(record.sighting_image_url || record.sighting_image || record.image_url || record.image_path),
  status: record.verified ? 'Approved' : record.verified_at ? 'Rejected' : 'Pending',
})

const normalizeDashboard = (record) => ({
  totalMissing: record.total_missing ?? 0,
  totalFound: record.total_found ?? 0,
  totalSightings: record.total_sightings ?? 0,
  totalMatches: record.total_matches ?? 0,
  pendingVerification: record.pending_verification ?? 0,
  totalUsers: record.total_users ?? 0,
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || ''
    if (error?.response?.status === 401 && !url.includes('/login') && !url.includes('/signup')) {
      clearAuthSession()
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  login: async ({ email, password, role }) => {
    const response = await api.post('/login', { email, password })
    const user = { ...response.data.user, role: normalizeRole(response.data.user?.role) }
    const expectedRole = normalizeRole(role)

    if (expectedRole && user.role !== expectedRole) {
      clearAuthSession()
      throw new Error(`This account does not have ${role === 'admin' ? 'admin' : 'citizen'} access.`)
    }

    setAuthSession({ accessToken: response.data.access_token, user })
    return { ...response, data: { ...response.data, user } }
  },
  signup: async ({ fullName, email, phoneNumber, password, role = 'user' }) => {
    return api.post('/signup', {
      name: fullName.trim(),
      email: email.trim(),
      phone: phoneNumber.trim(),
      password,
      role: normalizeRole(role),
    })
  },
}

export const reportApi = {
  submitMissing: async ({ name, age, gender, lastSeenLocation, lastSeenDate, description, photo }) => {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('age', age)
    formData.append('gender', gender)
    formData.append('last_seen_location', lastSeenLocation)
    formData.append('last_seen_date', lastSeenDate)
    formData.append('description', description || '')
    formData.append('photo', photo)

    return api.post('/report-missing', formData)
  },
  submitSighting: async ({ location, description, photo }) => {
    const formData = new FormData()
    formData.append('location', location)
    formData.append('description', description || '')
    formData.append('photo', photo)

    const response = await api.post('/report-sighting', formData)
    const topMatch = response.data.top_matches?.[0]

    return {
      ...response,
      data: {
        ...response.data,
        aiResult: response.data.face_detected
          ? response.data.matches_found > 0
            ? 'Possible match detected.'
            : 'Face detected but no strong match found.'
          : 'No face detected in the uploaded image.',
        confidence: formatConfidence(topMatch?.confidence),
        topMatches: (response.data.top_matches || []).map((match) => ({
          ...match,
          confidence: formatConfidence(match.confidence),
          photo: resolveMediaUrl(match.photo_url || match.photo_path),
        })),
      },
    }
  },
  getMyReports: async () => {
    const response = await api.get('/my-reports')
    return { ...response, data: response.data.map(normalizeMissingPerson) }
  },
  getMySightings: async () => {
    const response = await api.get('/my-sightings')
    return { ...response, data: response.data.map(normalizeSighting) }
  },
  getMissingPersons: async ({ status = 'missing', limit = 50 } = {}) => {
    const response = await api.get('/missing-persons', {
      params: { limit, status_filter: status },
    })
    return {
      ...response,
      data: response.data.results.map(normalizeMissingPerson),
      total: response.data.total,
    }
  },
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard')
    return { ...response, data: normalizeDashboard(response.data) }
  },
  getMatches: async () => {
    const response = await api.get('/admin/matches')
    return { ...response, data: response.data.results.map(normalizeMatch), total: response.data.total }
  },
  verifyMatch: async (matchId, verified) => {
    return api.put(`/admin/verify-match/${matchId}`, { verified })
  },
  deleteMatch: async (matchId) => {
    return api.delete(`/admin/matches/${matchId}`)
  },
  reencodePersons: async () => {
    return api.post('/admin/reencoder')
  },
  getUsers: async () => {
    const response = await api.get('/admin/users')
    return { ...response, data: response.data.results }
  },
  getCameras: async () => {
    const response = await api.get('/cctv/active-streams')
    const activeCameras = response.data.active_cameras || []

    return {
      ...response,
      data: [
        {
          id: 'CAM-LOCAL',
          location: 'Local Webcam Feed',
          detected: false,
          confidence: 0,
          feedUrl: toBackendUrl('/api/cctv/webcam-feed'),
        },
        ...activeCameras.map((cameraId) => ({
          id: cameraId,
          location: `Active Stream ${cameraId}`,
          detected: false,
          confidence: 0,
          feedUrl: toBackendUrl('/api/cctv/webcam-feed'),
        })),
      ],
    }
  },
}

export default api
