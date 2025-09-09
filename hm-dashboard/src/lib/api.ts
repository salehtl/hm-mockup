const getApiBaseUrl = () => {
  // In production (Vercel), use relative API routes
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api'
  }
  // In development, check if we have json-server running, otherwise use local API
  return import.meta.env?.VITE_USE_JSON_SERVER === 'true'
    ? 'http://localhost:3001'
    : '/api'
}

export const API_BASE_URL = getApiBaseUrl()

export const apiEndpoints = {
  services: `${API_BASE_URL}/services`,
  channels: `${API_BASE_URL}/channels`,
  serviceReviews: `${API_BASE_URL}/serviceReviews`,
  channelRatings: `${API_BASE_URL}/channelRatings`,
  dcxReviews: `${API_BASE_URL}/dcxReviews`,
  booths: `${API_BASE_URL}/booths`,
  serviceChannels: `${API_BASE_URL}/serviceChannels`,
  entities: `${API_BASE_URL}/entities`,
  dcx: `${API_BASE_URL}/dcx`,
  serviceComments: `${API_BASE_URL}/serviceComments`,
  channelComments: `${API_BASE_URL}/channelComments`,
}