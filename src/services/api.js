import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

export const endpoints = {
  login: '/api/login',
  signup: '/api/signup',
  reportMissing: '/api/report-missing',
  reportSighting: '/api/report-sighting',
  missingPersons: '/api/missing-persons',
  matches: '/api/matches',
}

const wait = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms))

const mockMissingPersons = [
  {
    id: 'MP-1001',
    name: 'Rahul Nair',
    age: 17,
    gender: 'Male',
    lastSeenLocation: 'Railway Station, Central City',
    lastSeenDate: '2026-03-09',
    description: 'Wearing a navy hoodie and blue jeans.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    status: 'Pending',
    reportDate: '2026-03-10',
  },
  {
    id: 'MP-1002',
    name: 'Anita Das',
    age: 24,
    gender: 'Female',
    lastSeenLocation: 'City Bus Depot, East Zone',
    lastSeenDate: '2026-03-06',
    description: 'Carrying a black backpack and silver watch.',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    status: 'Verified',
    reportDate: '2026-03-07',
  },
  {
    id: 'MP-1003',
    name: 'Farhan Iqbal',
    age: 31,
    gender: 'Male',
    lastSeenLocation: 'Old Market Road',
    lastSeenDate: '2026-03-02',
    description: 'Last seen near a red hatchback.',
    photo: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=600&q=80',
    status: 'Person Found',
    reportDate: '2026-03-03',
  },
]

const mockSightings = [
  {
    id: 'SG-2001',
    location: 'Metro Exit Gate 2',
    dateTime: '2026-03-11T14:20',
    description: 'Person appeared confused and was pacing.',
    aiResult: 'Possible match with Rahul Nair',
    confidence: 88,
  },
]

const mockMatches = [
  {
    id: 'MT-3001',
    personName: 'Rahul Nair',
    confidence: 88,
    location: 'Metro Exit Gate 2',
    time: '2026-03-11 14:20',
    missingPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    cctvPhoto: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=600&q=80',
    status: 'Pending',
  },
  {
    id: 'MT-3002',
    personName: 'Anita Das',
    confidence: 79,
    location: 'Sector 5 Junction',
    time: '2026-03-10 21:05',
    missingPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    cctvPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    status: 'Pending',
  },
]

const mockCameras = [
  { id: 'CAM-01', location: 'Central Plaza', detected: true, confidence: 91 },
  { id: 'CAM-02', location: 'North Flyover', detected: false, confidence: 0 },
  { id: 'CAM-03', location: 'Bus Terminal', detected: true, confidence: 77 },
  { id: 'CAM-04', location: 'Hospital Road', detected: false, confidence: 0 },
  { id: 'CAM-05', location: 'Old Market', detected: true, confidence: 85 },
  { id: 'CAM-06', location: 'Airport Gate', detected: false, confidence: 0 },
]

export const authApi = {
  login: async (payload) => {
    await wait(800)
    return {
      data: {
        endpoint: endpoints.login,
        user: {
          name: payload.role === 'admin' ? 'Inspector Mehra' : 'Citizen User',
          email: payload.email,
          role: payload.role,
        },
      },
    }
  },
  signup: async (payload) => {
    await wait(900)
    return {
      data: {
        endpoint: endpoints.signup,
        message: 'Account created successfully.',
      },
    }
  },
}

export const reportApi = {
  submitMissing: async (payload) => {
    await wait(1100)
    const report = {
      id: `MP-${1000 + mockMissingPersons.length + 1}`,
      reportDate: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      ...payload,
    }
    mockMissingPersons.unshift(report)
    return { data: { report, endpoint: endpoints.reportMissing, message: 'Report submitted successfully.' } }
  },
  submitSighting: async (payload) => {
    await wait(1800)
    const confidence = Math.floor(Math.random() * (95 - 72 + 1) + 72)
    const sighting = {
      id: `SG-${2000 + mockSightings.length + 1}`,
      ...payload,
      aiResult: confidence > 80 ? 'Possible match detected' : 'No strong match found',
      confidence,
    }
    mockSightings.unshift(sighting)
    return { data: { ...sighting, endpoint: endpoints.reportSighting } }
  },
  getMyReports: async () => {
    await wait(650)
    return { data: mockMissingPersons }
  },
  getMySightings: async () => {
    await wait(650)
    return { data: mockSightings }
  },
  getMissingPersons: async () => {
    await wait(650)
    return { data: mockMissingPersons, endpoint: endpoints.missingPersons }
  },
  getMatches: async () => {
    await wait(600)
    return { data: mockMatches, endpoint: endpoints.matches }
  },
  getCameras: async () => {
    await wait(600)
    return { data: mockCameras }
  },
}

export default api
