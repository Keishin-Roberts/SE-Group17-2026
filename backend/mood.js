// Stores Jobs' mood, the last topic and the decks of ideas while the server is running.
// 0 = furious, 50 = neutral, 100 = delighted.

const DEFAULT_MOOD = 50
const MIN_MOOD = 0
const MAX_MOOD = 100

let mood = DEFAULT_MOOD

// Keyword Jobs answered last, used to notice the same question twice in a row
let lastTopic = null

// Idea Jobs gave last, so a new deck never starts with the idea that ended the old one
let lastIdea = null

// One shuffled deck of ideas per area, e.g. { "idea music": [idea, idea, ...] }
// Ideas are drawn one by one, so none comes twice until the whole deck is used up
let decks = {}

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
 * Returns a copy of the list in random order (Fisher-Yates shuffle).
 */
function shuffle(list) {
  const result = list.slice()
  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const swap = result[index]
    result[index] = result[randomIndex]
    result[randomIndex] = swap
  }
  return result
}

/**
 * Draws the next idea from the deck with this key, e.g. "idea music" or "all".
 * When the deck is empty it is filled again with the candidates in a new random order.
 * Every idea comes once before any idea comes again.
 */
function drawIdea(key, candidates) {
  if (!decks[key] || decks[key].length === 0) {
    decks[key] = shuffle(candidates)

    // The next idea is taken from the end, so move the last given idea away from there
    const lastIndex = decks[key].length - 1
    if (lastIndex > 0 && decks[key][lastIndex].text === lastIdea) {
      const swap = decks[key][0]
      decks[key][0] = decks[key][lastIndex]
      decks[key][lastIndex] = swap
    }
  }

  const idea = decks[key].pop()
  lastIdea = idea.text
  return idea
}

/**
 * Starts a fresh chat: mood back to the default, no last topic and fresh decks of ideas.
 */
function resetMood() {
  mood = DEFAULT_MOOD
  lastTopic = null
  lastIdea = null
  decks = {}
  return mood
}

module.exports = { getMood, changeMood, getLastTopic, setLastTopic, drawIdea, resetMood }
