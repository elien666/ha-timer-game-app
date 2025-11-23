import axios from 'axios'

// Get config from build-time env vars or runtime window config
const getConfig = (key) => {
  // First check runtime config (injected at container startup)
  if (typeof window !== 'undefined' && window.__HA_CONFIG__) {
    return window.__HA_CONFIG__[key] || ''
  }
  // Fall back to build-time env vars
  return import.meta.env[key] || ''
}

// Environment variables with fallbacks for development and runtime
export const HASS_HOST = getConfig('VITE_HASS_HOST')
export const HASS_ACCESS_TOKEN = getConfig('VITE_HASS_ACCESS_TOKEN')
export const HASS_BUTTON_ENTITY = getConfig('VITE_HASS_BUTTON_ENTITY')

// Check if Home Assistant is configured
export const isHAConfigured = () => {
  return !!(HASS_HOST && HASS_ACCESS_TOKEN && HASS_BUTTON_ENTITY)
}

// Get list of missing configuration variables
export const getMissingConfig = () => {
  const missing = []
  if (!HASS_HOST) missing.push('HASS_HOST')
  if (!HASS_ACCESS_TOKEN) missing.push('HASS_ACCESS_TOKEN')
  if (!HASS_BUTTON_ENTITY) missing.push('HASS_BUTTON_ENTITY')
  return missing
}

// Set authorization header if token is available
if (HASS_ACCESS_TOKEN) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${HASS_ACCESS_TOKEN}`
}

