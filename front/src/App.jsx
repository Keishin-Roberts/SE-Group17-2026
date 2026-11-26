import { useEffect, useRef, useState } from 'react'
import ChatBox from './ChatBox.jsx'
import MoodStatus from './MoodStatus.jsx'

// Accept only valid mood values returned by the server.
function isValidMood(value) {
    return Number.isFinite(value) && value >= 0 && value <= 100
}

function App() {
    const [mood, setMood] = useState(50)
    const [isOnline, setIsOnline] = useState(false)

    // Prevent an older background check overwriting a newer chat update.
    const moodVersion = useRef(0)

    function handleMoodChange(value) {
        if (!isValidMood(value)) return

        moodVersion.current += 1
        setMood(value)
        setIsOnline(true)
    }

    useEffect(() => {
        let active = true
        let controller = null

        async function checkStatus() {
            // Do not start another check while one is already running.
            if (controller !== null) return

            const request = new AbortController()
            controller = request

            const versionAtStart = moodVersion.current
            const timeout = setTimeout(() => request.abort(), 3000)

            try {
                const response = await fetch('/api/mood', {
                    signal: request.signal,
                    cache: 'no-store'
                })

                if (!response.ok) {
                    throw new Error('Status request failed')
                }

                const data = await response.json()

                if (!isValidMood(data.mood)) {
                    throw new Error('Invalid mood response')
                }

                if (active && versionAtStart === moodVersion.current) {
                    setMood(data.mood)
                    setIsOnline(true)
                }
            } catch {
                if (active && versionAtStart === moodVersion.current) {
                    setIsOnline(false)
                }
            } finally {
                clearTimeout(timeout)
                controller = null
            }
        }

        checkStatus()
        const interval = setInterval(checkStatus, 5000)

        // Stop checking and cancel an unfinished request when unmounted.
        return () => {
            active = false
            clearInterval(interval)

            if (controller !== null) {
                controller.abort()
            }
        }
    }, [])

    return (
        <>
            <MoodStatus mood={mood} isOnline={isOnline} />
            <ChatBox onMoodChange={handleMoodChange} />
        </>
    )
}

export default App