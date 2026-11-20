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
                    {message.text}
                </p>

            </div>
        ))}
        
        
        
        
        
        
        
        
        
        
        </>
    )
}
export default MessageList