import { useLayoutEffect, useRef, useState } from 'react'

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
    // Create a new array with the new message added after the previous ones
    setMessages(previous => [...previous, newMessage])
    // Clear the input field
    setDraft('')

    // Send the message to the backend and show its answer
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    const data = await response.json()

    const replyMessage = {
      id: crypto.randomUUID(),
      author: 'bot',
      text: data.reply
    }
    setMessages(previous => [...previous, replyMessage])
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
        {messages.length === 0 && (
          <p className="chat-empty">
            No messages yet — ask Steve anything to start the conversation.
          </p>
        )}

        {messages.map(message => (
          <div className={`message-row message-row-${message.author}`} key={message.id}>
            <p className={`bubble bubble-${message.author}`}>
              <span className="bubble-author">
                {message.author === 'user' ? 'You' : 'Steve'}
              </span>
              {message.text}
            </p>
          </div>
        ))}
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
