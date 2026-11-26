// Display connection status; mood controls only the background colour.
function MoodStatus(props) {
    let colour = 'mood-neutral'

    if (!props.isOnline) {
        colour = 'mood-offline'
    } else if (props.mood >= 80) {
        colour = 'mood-very-positive'
    } else if (props.mood >= 60) {
        colour = 'mood-positive'
    } else if (props.mood <= 25) {
        colour = 'mood-very-negative'
    } else if (props.mood < 50) {
        colour = 'mood-negative'
    }

    return (
        <div className={`mood-status ${colour}`} role="status">
            {props.isOnline
                ? 'Steve Jobs is online'
                : 'Steve Jobs is offline'}
        </div>
    )
}

export default MoodStatus
