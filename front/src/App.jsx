import { useLayoutEffect, useRef, useState } from 'react'
import MessageList from './MessageList.jsx'

function App() {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const historyRef = useRef(null)

  useLayoutEffect(() => {
    const history = historyRef.current
    history.scrollTop = history.scrollHeight
  }, [messages])

  async function handleSubmit(event) {
    // Prevents browser refresh when the form is submitted
    event.preventDefault()

    // Remove surrounding whitespace and ignore empty messages
    const text = draft.trim()
    if (text === '') return

    const newMessage = {
      id: crypto.randomUUID(),
      author: 'user',
      text: text
    }
    const thinkingMessage = {
      id: crypto.randomUUID(),
      author: 'bot',
      text: 'Steve is thinking...'
    }
    setMessages(previous => [...previous, newMessage, thinkingMessage])
    setDraft('')

    let replyText
    try {
      const [response] = await Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        }),
        new Promise(resolve => setTimeout(resolve, 2000))
      ])
      if (!response.ok) throw new Error('Chat request failed')
      const data = await response.json()
      replyText = data.reply
    } catch {
      replyText = 'Could not get a reply. Please try again.'
    }

    const replyMessage = {
      id: crypto.randomUUID(),
      author: 'bot',
      text: replyText
    }
    setMessages(previous => previous.map(message =>
      message.id === thinkingMessage.id ? replyMessage : message
    ))
  }

  return (
    <main className="container">
      <header className="chat-header">
        <div>
          <h1>Chat with Steve Jobs</h1>
          <p className="chat-subtitle">Explore his life, work and ideas.</p>
        </div>
      </header>

     <div
        ref={historyRef}
        className="chat-history"
        role="log"
        aria-label="Conversation"
      >
        <MessageList message={messages} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="message">
          Your message
        </label>
        <input
          id="message"
          type="text"
          placeholder="Type your question..."
          value={draft}
          onChange={event => setDraft(event.target.value)}
        />
        <button type="submit">
          Send
          <svg
            className="send-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <line x1="4" y1="12" x2="18" y2="12" />
            <polyline points="13 7 18 12 13 17" />
          </svg>
        </button>
      </form>
    </main>
  )
}

export default App
