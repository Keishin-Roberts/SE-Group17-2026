//display the message form using state and handlers supplied by chatbox
function ChatForm(props) {
    return (
        <form className="chat-form" onSubmit={props.handleSubmit}>
            <label className="visually-hidden" htmlFor="message">
                Your message
            </label>

            <input
                id="message"
                type="text"
                placeholder="Type your question..."
                value={props.draft}
                onChange={event => props.setDraft(event.target.value)}
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
    )
}

export default ChatForm