import { getMoodLevel } from './moodLevel.js'

// Display the status badge and its reset control.
function MoodStatus(props) {
    const level = getMoodLevel(props.mood)
    const colour = props.isOnline ? level.badgeClass : 'mood-offline'

    return (
        <div className="mood-controls">
            <div className={`mood-status ${colour}`} role="status">
                {props.isOnline
                    ? `Steve Jobs is online · ${level.label}`
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
