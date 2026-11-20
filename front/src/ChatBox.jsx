import { useLayoutEffect, useRef, useState } from 'react'
import MessageList from './MessageList.jsx'
import ChatForm from './ChatForm.jsx'


function ChatBox() {
    const [draft, setDraft] = useState('')
    const [messages, setMessages] = useState([])
    const historyRef = useRef(null)
    useLayoutEffect(() => {
        const history = historyRef.current
        history.scrollTop = history.scrollHeight
    }, [messages])
    async function handleSubmit(event) {
        // prevents browser refresh when the form is submitted
        event.preventDefault()

        // remove surrounding whitespace and ignore empty messages
        const text = draft.trim()
        if (text === '') return
        //give message a stable ID for React list key
        const newMessage = {
            id: crypto.randomUUID(),
            author: 'user',
            text: text
        }
        //show tempoprary message while waiting for servers response
        const thinkingMessage = {
            id: crypto.randomUUID(),
            author: 'bot',
            text: 'Steve is thinking...'
        }
        //add user message and the temporary think message
        setMessages(previous => [...previous, newMessage, thinkingMessage])
        //clear the draft so input is ready for the next message
        setDraft('')

        //store server response or error message
        let replyText
        try {
            //runthe request and existing 2 second delay in parallel
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
    // generate steve's message ussing servers reply or error message
    const replyMessage = {
        id: crypto.randomUUID(),
        author: 'bot',
        text: replyText
    }
    //replace think message with reply
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
