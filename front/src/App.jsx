import { useLayoutEffect, useRef, useState } from 'react'
import MessageList from './MessageList.jsx'
import ChatForm from './ChatForm.jsx'

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

      <ChatForm
        draft={draft}
        setDraft={setDraft}
        handleSubmit={handleSubmit}
      />
    </main>
  )
}

export default App
