// Display the status badge and its reset control.
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
        <div className="mood-controls">
            <div className={`mood-status ${colour}`} role="status">
                {props.isOnline
                    ? 'Steve Jobs is online'
                    : 'Steve Jobs is offline'}
            </div>

            <button
                className="mood-reset"
                type="button"
                onClick={props.onReset}
                disabled={!props.isOnline || props.isResetting}
            >
                {props.isResetting ? 'Resetting...' : 'Reset mood'}
            </button>

            {props.resetError && (
                <p className="mood-reset-error" role="alert">
                    {props.resetError}
                </p>
            )}
        </div>
    )
}

export default MoodStatus