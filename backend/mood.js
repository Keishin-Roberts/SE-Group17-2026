// Stores Jobs' mood while the server is running.
// 0 = furious, 50 = neutral, 100 = delighted.

const DEFAULT_MOOD = 50
const MIN_MOOD = 0
const MAX_MOOD = 100

let mood = DEFAULT_MOOD

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
 * Sets the mood back to the default value.
 */
function resetMood() {
  mood = DEFAULT_MOOD
  return mood
}

module.exports = { getMood, changeMood, resetMood }
