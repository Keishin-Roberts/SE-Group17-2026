// Stores Jobs' mood and the last topic while the server is running.
// 0 = furious, 50 = neutral, 100 = delighted.

const DEFAULT_MOOD = 50
const MIN_MOOD = 0
const MAX_MOOD = 100

let mood = DEFAULT_MOOD

// Keyword Jobs answered last, used to notice the same question twice in a row
let lastTopic = null

/**
 * Returns the current mood.
 */
function getMood() {
  return mood
}

/**
 * Adds a positive or negative amount to the mood
 * and keeps the result between MIN_MOOD and MAX_MOOD.
 */
function changeMood(amount) {
  mood = Math.min(MAX_MOOD, Math.max(MIN_MOOD, mood + amount))
  return mood
}

/**
 * Returns the keyword Jobs answered last, or null.
 */
function getLastTopic() {
  return lastTopic
}

/**
 * Remembers the keyword Jobs just answered (null for an off-topic message).
 */
function setLastTopic(topic) {
  lastTopic = topic
}

/**
 * Starts a fresh chat: mood back to the default and no last topic.
 */
function resetMood() {
  mood = DEFAULT_MOOD
  lastTopic = null
  return mood
}

module.exports = { getMood, changeMood, getLastTopic, setLastTopic, resetMood }
