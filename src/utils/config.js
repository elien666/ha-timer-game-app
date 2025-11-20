import axios from 'axios'

// Environment variables with fallbacks for development
export const HASS_HOST = import.meta.env.VITE_HASS_HOST || ''
export const HASS_ACCESS_TOKEN = import.meta.env.VITE_HASS_ACCESS_TOKEN || ''
export const HASS_BUTTON_ENTITY = import.meta.env.VITE_HASS_BUTTON_ENTITY || ''

// Set authorization header if token is available
if (HASS_ACCESS_TOKEN) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${HASS_ACCESS_TOKEN}`
}

