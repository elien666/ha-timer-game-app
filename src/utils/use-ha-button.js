import {
  createLongLivedTokenAuth,
  createConnection,
} from 'home-assistant-js-websocket'
import { useEffect, useRef, useState } from 'react'
import { HASS_HOST, HASS_ACCESS_TOKEN, HASS_BUTTON_ENTITY, isHAConfigured } from './config'

/**
 * Custom hook to subscribe to Home Assistant button entity state changes
 * @param {Function} onButtonPress - Callback function called when button is pressed, receives state value
 * @returns {[boolean, Error|null]} - [isConnected, error]
 */
const useHaButton = (onButtonPress) => {
  const onButtonPressRef = useRef(onButtonPress)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Keep callback ref up to date
  useEffect(() => {
    onButtonPressRef.current = onButtonPress
  }, [onButtonPress])

  useEffect(() => {
    // Don't attempt connection if HA is not configured
    if (!isHAConfigured()) {
      setError(new Error('Home Assistant is not configured'))
      setIsConnected(false)
      return
    }

    let connection = null
    let isMounted = true

    async function connect() {
      let auth
      try {
        if (!HASS_HOST) {
          throw new Error('HASS_HOST is not configured')
        }
        if (!HASS_ACCESS_TOKEN) {
          throw new Error('HASS_ACCESS_TOKEN is not configured')
        }
        if (!HASS_BUTTON_ENTITY) {
          throw new Error('HASS_BUTTON_ENTITY is not configured')
        }
        
        auth = createLongLivedTokenAuth(
          HASS_HOST,
          HASS_ACCESS_TOKEN
        )
        
        if (isMounted) {
          setError(null)
          setIsConnected(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
        return
      }
    
      try {
        connection = await createConnection({ auth })
        
        if (isMounted) {
          setIsConnected(true)
        }
    
        const trigger = (result) => {
          if (isMounted && onButtonPressRef.current) {
            // Extract the new state value from the result
            const newState = result?.variables?.trigger?.to_state?.state
            if (newState !== undefined && newState !== null) {
              // Call the callback with the state value
              onButtonPressRef.current(newState)
            }
          }
        }
    
        await connection.subscribeMessage(trigger, {
          type: "subscribe_trigger",
          trigger: {
            platform: "state",
            entity_id: HASS_BUTTON_ENTITY,
          }
        })
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setIsConnected(false)
        }
      }
    }

    connect()
    
    return () => {
      isMounted = false
      if (connection) {
        connection.close()
      }
    }
  }, [])

  return [isConnected, error]
}

export default useHaButton

