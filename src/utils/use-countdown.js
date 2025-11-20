import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for countdown timer functionality
 * @param {number} initialDuration - Initial duration in seconds
 * @returns {Object} - Countdown state and control functions
 */
const useCountdown = (initialDuration = 0) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration)
  const [timeLeftFractional, setTimeLeftFractional] = useState(initialDuration)
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(initialDuration)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const remainingTimeRef = useRef(initialDuration)

  // Format time without leading zeros on the first component, with unit labels
  // Shows "5s" for 5 seconds, "1m:05s" for 65 seconds, "1h:00m:05s" for 3605 seconds
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      // Show hours:minutes:seconds with unit labels, minutes and seconds with 2 digits
      return `${hours}h:${String(mins).padStart(2, '0')}m:${String(secs).padStart(2, '0')}s`
    } else if (mins > 0) {
      // Show minutes:seconds with unit labels, seconds with 2 digits
      return `${mins}m:${String(secs).padStart(2, '0')}s`
    } else {
      // Just show seconds with unit label
      return `${secs}s`
    }
  }

  // Play sound and show notification when countdown reaches zero
  const handleComplete = useCallback(() => {
    // Play sound - multiple beeps for better noticeability
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Play 3 beeps
      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 800 + (i * 100) // Slightly different pitch each time
        oscillator.type = 'sine'
        
        const startTime = audioContext.currentTime + (i * 0.3)
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + 0.25)
      }
    } catch (err) {
      console.warn('Could not play sound:', err)
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Countdown Complete!', {
        body: 'The timer has reached zero',
        icon: '/vite.svg',
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Countdown Complete!', {
            body: 'The timer has reached zero',
            icon: '/vite.svg',
          })
        }
      })
    }
  }, [])

  // Start the countdown
  const start = useCallback(() => {
    if (timeLeft > 0) {
      remainingTimeRef.current = timeLeftFractional || timeLeft
      startTimeRef.current = Date.now()
      setIsRunning(true)
    }
  }, [timeLeft, timeLeftFractional])

  // Stop the countdown
  const stop = useCallback(() => {
    setIsRunning(false)
  }, [])

  // Reset the countdown to the current duration
  const reset = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(duration)
    setTimeLeftFractional(duration)
    remainingTimeRef.current = duration
  }, [duration])

  // Reset and start the countdown
  const resetAndStart = useCallback(() => {
    setTimeLeft(duration)
    setTimeLeftFractional(duration)
    remainingTimeRef.current = duration
    startTimeRef.current = Date.now()
    setIsRunning(true)
  }, [duration])

  // Set the duration
  const setDurationValue = useCallback((newDuration) => {
    const seconds = Math.max(0, Math.floor(newDuration))
    setDuration(seconds)
    if (!isRunning) {
      setTimeLeft(seconds)
      setTimeLeftFractional(seconds)
      remainingTimeRef.current = seconds
    }
  }, [isRunning])

  // Countdown logic - update more frequently for smooth animation
  useEffect(() => {
    if (isRunning) {
      // Initialize start time and remaining time when starting
      startTimeRef.current = Date.now()
      remainingTimeRef.current = timeLeftFractional || timeLeft
      
      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000
        const remaining = Math.max(0, remainingTimeRef.current - elapsed)
        const newTimeLeft = Math.ceil(remaining)
        
        setTimeLeft(newTimeLeft)
        setTimeLeftFractional(remaining) // Use fractional for smooth animation
        
        if (remaining <= 0) {
          setIsRunning(false)
          setTimeLeft(0)
          setTimeLeftFractional(0)
        }
      }, 100) // Update every 100ms for smooth animation
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      startTimeRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning])

  // Handle countdown completion
  useEffect(() => {
    if (timeLeft === 0 && !isRunning && duration > 0) {
      handleComplete()
    }
  }, [timeLeft, isRunning, duration, handleComplete])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return {
    timeLeft,
    timeLeftFractional,
    isRunning,
    duration,
    formattedTime: formatTime(timeLeft),
    start,
    stop,
    reset,
    resetAndStart,
    setDuration: setDurationValue,
  }
}

export default useCountdown

