import { useLayoutEffect, useRef, useState } from 'react'
import MessageList from './MessageList.jsx'
import ChatForm from './ChatForm.jsx'


function ChatBox() {
    const [draft, setDraft] = useState('')
    const [messages, setMessages] = useState([])
    const historyRef = useRef(null)
    // keep newest messages visible when the conversation updates
    useLayoutEffect(() => {
        const history = historyRef.current
        history.scrollTop = history.scrollHeight
    }, [messages])
    async function handleSubmit(event) {
    event.preventDefault()

    const text = draft.trim()
    if (text === '') return

    // Store the send time once, when this message is created.
    const newMessage = {
        id: crypto.randomUUID(),
        author: 'user',
        text: text,
        sentAt: new Date().toISOString(),
        isRead: false
    }

    const thinkingMessage = {
        id: crypto.randomUUID(),
        author: 'bot',
        text: 'Steve is thinking...'
    }

    setMessages(previous => [
        ...previous,
        newMessage,
        thinkingMessage
    ])
    setDraft('')

    // Keep the existing minimum two-second wait for Steve's reply.
    const replyDelay = new Promise(resolve => {
        setTimeout(resolve, 2000)
    })

    let replyText

    try {
        // Start the request immediately, but keep grey ticks briefly visible.
        const [response] = await Promise.all([
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            }),
            new Promise(resolve => setTimeout(resolve, 200))
        ])

        if (!response.ok) {
            throw new Error('Chat request failed')
        }

        const data = await response.json()

        if (typeof data.reply !== 'string') {
            throw new Error('Invalid chat response')
        }

        // Update only the user message belonging to this request.
        setMessages(previous => previous.map(message =>
            message.id === newMessage.id
                ? { ...message, isRead: true }
                : message
        ))

        // Show blue ticks before displaying the reply, even on slow requests.
        await new Promise(resolve => setTimeout(resolve, 200))

        replyText = data.reply
    } catch {
        replyText = 'Could not get a reply. Please try again.'
    }

    await replyDelay

    const replyMessage = {
        id: crypto.randomUUID(),
        author: 'bot',
        text: replyText,
        sentAt: new Date().toISOString()
    }

    // Replace this request's temporary thinking message.
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

export default ChatBox
