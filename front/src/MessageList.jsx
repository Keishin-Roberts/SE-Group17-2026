// Convert a stored timestamp into local hours and minutes.
function formatTime(sentAt) {
    return new Date(sentAt).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Display messages supplied by ChatBox.
// MessageList does not manage requests, timers, or message state.
function MessageList(props) {
    return (
        <>
            {props.message.length === 0 && (
                <p className="chat-empty">
                    No message yet - ask Steve anything to start the conversation.
                </p>
            )}

            {props.message.map(message => (
                <div
                    className={`message-row message-row-${message.author}`}
                    key={message.id}
                >
                    <p className={`bubble bubble-${message.author}`}>
                        <span className="bubble-author">
                            {message.author === 'user' ? 'You' : 'Steve'}
                        </span>

                        <span className="bubble-text">
                            {message.text}
                        </span>

                        {message.sentAt && (
                            <span className="bubble-meta">
                                <time dateTime={message.sentAt}>
                                    {formatTime(message.sentAt)}
                                </time>

                                {message.author === 'user' && (
                                    <span
                                        className={`message-ticks ${
                                            message.isRead
                                                ? 'message-ticks-read'
                                                : ''
                                        }`}
                                        role="img"
                                        aria-label={
                                            message.isRead ? 'Read' : 'Not read'
                                        }
                                    >
                                        <svg
                                            viewBox="0 0 24 16"
                                            aria-hidden="true"
                                            focusable="false"
                                        >
                                            <path d="M2 8l4 4 9-9M10 10l2 2 9-9" />
                                        </svg>
                                    </span>
                                )}
                            </span>
                        )}
                    </p>
                </div>
            ))}
        </>
    )
}

export default MessageList