import { useState } from 'react'
import './index.css'

function App() {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])

  function handleSubmit(event) {
    // Prevents browser refresh when theform is submitted
    event.preventDefault()

    //remove surrounding room and ignote empty messages
    const text = draft.trim()
    if (text === '') return

    const newMessage = {
      id: crypto.randomUUID(),
      text: text
    }
    //Create new array with the new message added to the end of the previous messages
    setMessages(previous => [...previous, newMessage])
    // Clear the input field
    setDraft('')
  }

  return (
    <main className="container">
      <h1>Chat with Steve Jobs</h1>
      <p>Explore his life, work and ideas.</p>

      <div
        className="chat-history"
        role="log"
        aria-label="Conversation"
      >
        {messages.map(message => (
          <p key={message.id}>
            <strong>You: </strong>
            {message.text}
          </p>
        ))}
      </div>

      <label htmlFor="message">Your message</label>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          id="message"
          type="text"
          placeholder="Type your question..."
          value={draft}
          onChange={event => setDraft(event.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </main>
  )
}

export default App