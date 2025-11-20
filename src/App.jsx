import { useState, useEffect, useRef, useCallback } from 'react'
import useCountdown from './utils/use-countdown'
import useHaButton from './utils/use-ha-button'
import { HASS_BUTTON_ENTITY } from './utils/config'
import { RotateCw, HouseWifi, WifiOff, Settings } from 'lucide-react'

// Component to render time with smaller unit letters
const TimeDisplay = ({ timeString }) => {
  // Parse the time string and render with smaller unit letters
  const parts = timeString.split(/([hms])/g).filter(part => part !== '')
  
  return (
    <>
      {parts.map((part, index) => {
        if (part === 'h' || part === 'm' || part === 's') {
          return (
            <span key={index} className="text-5xl md:text-6xl align-baseline">
              {part}
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

function App() {
  const [durationInput, setDurationInput] = useState('10')
  const [durationSeconds, setDurationSeconds] = useState(10)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [autoRestart, setAutoRestart] = useState(false)
  const animationKeyRef = useRef(0)
  const animationStartTimeLeftRef = useRef(0)
  
  const countdown = useCountdown(durationSeconds)
  const countdownRef = useRef(countdown)
  
  // Keep countdown ref up to date
  useEffect(() => {
    countdownRef.current = countdown
  }, [countdown])
  
  const [isConnected, connectionError] = useHaButton((buttonState) => {
    // Handle button state changes: "single" -> reset and start, "double" -> stop
    if (!countdownRef.current) return
    
    if (buttonState === 'single') {
      // Single press: reset and start the countdown
      countdownRef.current.resetAndStart()
    } else if (buttonState === 'double') {
      // Double press: stop the countdown
      countdownRef.current.stop()
    }
  })

  // Update duration when input changes
  const handleDurationChange = (e) => {
    const value = e.target.value
    setDurationInput(value)
    const seconds = parseInt(value, 10) || 0
    setDurationSeconds(seconds)
    countdown.setDuration(seconds)
  }

  // Update countdown duration when durationSeconds changes
  useEffect(() => {
    if (!countdown.isRunning) {
      countdown.setDuration(durationSeconds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSeconds])

  // Capture timeLeft when animation starts and increment key
  const prevIsRunningRef = useRef(countdown.isRunning)
  const prevTimeLeftForAnimationRef = useRef(countdown.timeLeft)
  
  useEffect(() => {
    const currentTimeLeft = countdown.timeLeft
    const timeLeftIncreased = currentTimeLeft > prevTimeLeftForAnimationRef.current
    
    // Capture when isRunning changes from false to true, OR when timeLeft increases (reset)
    if (countdown.isRunning && (!prevIsRunningRef.current || timeLeftIncreased)) {
      // Capture the timeLeft when animation starts or restarts
      const currentTimeLeftValue = countdown.timeLeftFractional || countdown.timeLeft
      animationStartTimeLeftRef.current = currentTimeLeftValue
      animationKeyRef.current += 1
    } else if (!countdown.isRunning) {
      // Reset when stopped
      animationStartTimeLeftRef.current = 0
    }
    
    prevIsRunningRef.current = countdown.isRunning
    prevTimeLeftForAnimationRef.current = currentTimeLeft
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown.isRunning, countdown.timeLeft])

  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 95

  // Calculate circle stroke color - increasingly red when below 5 seconds
  const getCircleColor = () => {
    const timeLeft = countdown.timeLeftFractional || countdown.timeLeft
    if (timeLeft >= 5) {
      return '#4b5563' // gray-600
    }
    // Transition from gray to red as timeLeft goes from 5 to 0
    const ratio = Math.max(0, Math.min(1, (5 - timeLeft) / 5))
    const gray = { r: 75, g: 85, b: 99 } // gray-600
    const red = { r: 239, g: 68, b: 68 } // red-500
    const r = Math.round(gray.r + (red.r - gray.r) * ratio)
    const g = Math.round(gray.g + (red.g - gray.g) * ratio)
    const b = Math.round(gray.b + (red.b - gray.b) * ratio)
    return `rgb(${r}, ${g}, ${b})`
  }

  // Calculate circle animation properties
  const getCircleAnimationProps = () => {
    const duration = countdown.duration || 1 // avoid division by zero
    const currentTimeLeft = countdown.timeLeftFractional || countdown.timeLeft
    
    if (!countdown.isRunning || duration === 0) {
      // When paused, show current position
      const currentOffset = CIRCLE_CIRCUMFERENCE * (1 - (currentTimeLeft || 0) / duration)
      return {
        startOffset: currentOffset,
        endOffset: CIRCLE_CIRCUMFERENCE,
        duration: 0,
        playState: 'paused'
      }
    }
    
    // When running, use the captured timeLeft from when animation started
    // This ensures the animation duration is fixed and doesn't change during the animation
    const animationTimeLeft = animationStartTimeLeftRef.current || currentTimeLeft
    const startOffset = CIRCLE_CIRCUMFERENCE * (1 - animationTimeLeft / duration)
    const endOffset = CIRCLE_CIRCUMFERENCE // fully undrawn
    
    return {
      startOffset,
      endOffset,
      duration: animationTimeLeft, // Use captured timeLeft for consistent animation duration
      playState: 'running'
    }
  }

  // Calculate red overlay color for page background - starts at 5 seconds
  const getPageBackgroundColor = () => {
    const timeLeft = countdown.timeLeftFractional || countdown.timeLeft
    if (timeLeft > 5) {
      return 'transparent' // no red overlay above 5 seconds
    }
    // Transition from subtle to more visible red overlay as timeLeft goes from 5 to 0
    const ratio = Math.max(0, Math.min(1, (5 - timeLeft) / 5))
    const minOpacity = 0.1
    const maxOpacity = 0.3
    const opacity = minOpacity + (maxOpacity - minOpacity) * ratio
    return `rgba(239, 68, 68, ${opacity})`
  }

  // Track tick count for increasing pitch
  const tickCountRef = useRef(0)

  // Play tick sound when timeLeft decreases below 5 seconds, with increasing pitch
  const playTickSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Increase pitch with each tick: start at 800Hz, increase by 200Hz per tick
      const baseFreq = 800
      const freqIncrease = 200
      const frequency = baseFreq + (tickCountRef.current * freqIncrease)
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      const startTime = audioContext.currentTime
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.1)
      
      // Increment tick count
      tickCountRef.current += 1
    } catch (err) {
      console.warn('Could not play tick sound:', err)
    }
  }, [])

  // Play tick when timeLeft decreases below 5 seconds
  const prevTimeLeftRef = useRef(countdown.timeLeft)
  useEffect(() => {
    const currentTimeLeft = Math.floor(countdown.timeLeftFractional || countdown.timeLeft)
    const prevTimeLeft = prevTimeLeftRef.current
    
    // Reset tick count when timer starts or goes above 5 seconds
    if (currentTimeLeft >= 5 || !countdown.isRunning) {
      tickCountRef.current = 0
    }
    
    // Play tick if timeLeft decreased and is below 5 seconds
    if (countdown.isRunning && currentTimeLeft < 5 && currentTimeLeft < prevTimeLeft && currentTimeLeft >= 0) {
      playTickSound()
    }
    
    prevTimeLeftRef.current = currentTimeLeft
  }, [countdown.timeLeft, countdown.timeLeftFractional, countdown.isRunning, playTickSound])

  return (
    <div 
      className="h-screen w-screen flex flex-col items-center justify-center text-white overflow-hidden relative"
      style={{ 
        backgroundColor: '#111827', // gray-900 base
        transition: 'background-color 0.1s linear',
      }}
    >
      {/* Red overlay that appears when below 5 seconds */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: getPageBackgroundColor(),
          transition: 'background-color 0.1s linear',
        }}
      />
      {/* Connection Status Icon - Top Right */}
      {HASS_BUTTON_ENTITY && (
        <div className="absolute top-4 right-4">
          {connectionError ? (
            <WifiOff className="w-6 h-6 text-gray-500" />
          ) : isConnected ? (
            <HouseWifi className="w-6 h-6 text-gray-500" />
          ) : (
            <HouseWifi className="w-6 h-6 text-gray-500 animate-pulse" />
          )}
        </div>
      )}

      {/* Countdown Display - Clickable to start/pause */}
      <div className="flex-1 flex items-center justify-center relative">
        <button
          onClick={() => {
            // When timeLeft is 0, always reset and start
            if (countdown.timeLeft === 0) {
              countdown.resetAndStart()
            } else if (autoRestart) {
              // Auto-restart: always reset and start
              countdown.resetAndStart()
            } else {
              // Normal mode: toggle start/pause
              if (countdown.isRunning) {
                countdown.stop()
              } else {
                countdown.start()
              }
            }
          }}
          disabled={false}
          className="text-center relative inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 transition-transform p-8 z-10"
          style={{ 
            touchAction: 'manipulation',
            minWidth: '400px',
            minHeight: '400px',
          }}
          title={countdown.timeLeft === 0 ? 'Restart' : (autoRestart ? 'Restart' : (countdown.isRunning ? 'Pause' : 'Start'))}
        >
          {/* Circular outline that draws less as countdown progresses */}
          {countdown.duration > 0 && countdown.timeLeft >= 1 && (() => {
            const animProps = getCircleAnimationProps()
            return (
              <div
                className="absolute pointer-events-none"
                style={{
                  width: '400px',
                  height: '400px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0,
                }}
              >
                <svg
                  viewBox="0 0 200 200"
                  width="100%"
                  height="100%"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <circle
                    key={`circle-${animationKeyRef.current}`}
                    cx="100"
                    cy="100"
                    r="95"
                    fill="transparent"
                    stroke={getCircleColor()}
                    strokeWidth="6"
                    strokeDasharray={CIRCLE_CIRCUMFERENCE}
                    className={countdown.isRunning ? 'countdown-circle-animated' : ''}
                    style={{
                      '--circle-start-offset': `${animProps.startOffset}px`,
                      '--circle-end-offset': `${animProps.endOffset}px`,
                      '--circle-animation-duration': `${animProps.duration}s`,
                      '--circle-animation-state': animProps.playState,
                      strokeDashoffset: countdown.isRunning ? undefined : `${animProps.startOffset}px`,
                      transition: countdown.isRunning ? 'none' : 'stroke 0.1s linear',
                    }}
                  />
                </svg>
              </div>
            )
          })()}
          <div className="text-8xl md:text-9xl font-mono font-bold tracking-wider mb-4 relative z-10">
            <TimeDisplay timeString={countdown.formattedTime} />
          </div>
        </button>
      </div>

      {/* Controls */}
      {!autoRestart && (
        <div className="w-full max-w-md px-6 pb-8">
          {/* Reset Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={countdown.reset}
              disabled={countdown.isRunning}
              className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors touch-manipulation active:scale-95"
              title="Reset"
            >
              <RotateCw className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Icon - Bottom Right */}
      <button
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="absolute bottom-4 right-4 text-white hover:text-gray-300 transition-colors touch-manipulation active:scale-95"
        title="Settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Settings Popover */}
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSettingsOpen(false)}
          />
          {/* Popover */}
          <div className="fixed bottom-20 right-4 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 min-w-[200px]">
            <div className="flex flex-col space-y-4">
              {/* Duration Input */}
              <div className="flex flex-col space-y-2">
                <label htmlFor="duration" className="text-sm text-gray-400">
                  Duration (seconds)
                </label>
                <input
                  id="duration"
                  type="number"
                  min="0"
                  max="9999"
                  value={durationInput}
                  onChange={handleDurationChange}
                  disabled={countdown.isRunning}
                  className="w-full px-4 py-3 text-center text-2xl font-mono bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  autoFocus
                />
              </div>
              
              {/* Auto-restart Toggle */}
              <div className="flex items-center justify-between space-x-3">
                <label 
                  htmlFor="auto-restart-toggle" 
                  className="text-sm text-gray-300 cursor-pointer"
                  onClick={() => setAutoRestart(!autoRestart)}
                >
                  Auto-restart
                </label>
                <button
                  id="auto-restart-toggle"
                  type="button"
                  onClick={() => setAutoRestart(!autoRestart)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    autoRestart ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={autoRestart}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRestart ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
