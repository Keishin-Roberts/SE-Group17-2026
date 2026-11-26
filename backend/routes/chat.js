const express = require('express')
const { changeMood, getLastTopic, setLastTopic } = require('../mood')
const { findClosestKeyword } = require('../spelling')

const router = express.Router()

// Topics: { "topic": { "keywords": [...], "replies": [...], "mood": number } }
const conversation = require('../data/conversation.json')

// Every keyword and the topic it belongs to, e.g. { "hi": "greeting", "woz": "wozniak" }
const topicOfKeyword = {}
for (const topic in conversation) {
  for (const keyword of conversation[topic].keywords) {
    topicOfKeyword[keyword] = topic
  }
}

// Used when the message has no known keyword
const defaultResponse = { reply: "That's not what we're here to talk about. Ask me something worth my time.", mood: -5 }

// Extra mood lost when the user misspells a keyword
const TYPO_PENALTY = 5

// Mood lost when the user asks about the same topic twice in a row
const REPEAT_PENALTY = 5

// Jobs cares about details, one of these goes before the answer when there is a typo
const typoComplaints = [
  'Learn to spell.',
  'Sloppy. I can\'t stand sloppy.',
  'Did you even read that before you sent it?',
  'Details matter. Clearly not to you.'
]

// One of these is the whole answer when the user repeats the last topic
const repeatComplaints = [
  'I already answered that. Were you even listening?',
  'We just covered this. Keep up.',
  'Asking twice won\'t get you a better answer.',
  'Same question again? I don\'t repeat myself.'
]

/**
 * Returns a random item from a list.
 */
function pickRandom(list) {
  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
}

/**
 * Checks if the message has the keyword as a whole word,
 * so "hi" matches "hi steve" but not "this" or "think".
 * A plural "s" is allowed too, so "iphones" matches "iphone".
 */
function containsKeyword(message, keyword) {
  // \b means the start or end of a word
  const pattern = new RegExp('\\b' + keyword + 's?\\b')
  return pattern.test(message)
}

/**
 * Picks a random complaint and says which word was misspelled.
 * Example: 'It\'s "iphone", not "iphnoe". Learn to spell.'
 */
function makeComplaint(keyword, typedText) {
  return `It's "${keyword}", not "${typedText}". ${pickRandom(typoComplaints)}`
}

/**
 * POST /api/chat
 * Body: { message: "Tell me about the iPhone" }
 * Response: { reply: "The iPhone changed everything... (Mood: 60/100)", mood: 60 }
 */
router.post('/', (req, res) => {
  // Lower case so "iPhone" and "iphone" both match
  const userMessage = (req.body.message || '').toLowerCase()

  // 1. Look for a keyword written correctly. If several match, the longest one wins
  //    because it is the most specific: "apple lisa" beats "apple", "your father" beats "father"
  let topic = null
  let matchedKeyword = ''
  for (const keyword in topicOfKeyword) {
    if (keyword.length > matchedKeyword.length && containsKeyword(userMessage, keyword)) {
      topic = topicOfKeyword[keyword]
      matchedKeyword = keyword
    }
  }

  // 2. No exact match, so check for a keyword with a small typo
  let typo = null
  if (topic === null) {
    typo = findClosestKeyword(userMessage, Object.keys(topicOfKeyword))
    if (typo) {
      topic = topicOfKeyword[typo.keyword]
    }
  }

  let reply
  let moodChange

  if (topic === null) {
    // 3. Nothing matched at all
    reply = defaultResponse.reply
    moodChange = defaultResponse.mood
  } else if (topic === getLastTopic()) {
    // 4. Same topic as last time, so no answer and no bonus, only a penalty
    reply = pickRandom(repeatComplaints)
    moodChange = -REPEAT_PENALTY
  } else if (typo) {
    // 5. Jobs still answers, but complains first and gets annoyed
    reply = makeComplaint(typo.keyword, typo.typedText) + ' ' + pickRandom(conversation[topic].replies)
    moodChange = conversation[topic].mood - TYPO_PENALTY
  } else {
    // 6. Normal answer, one of the topic's replies picked at random
    reply = pickRandom(conversation[topic].replies)
    moodChange = conversation[topic].mood
  }

  setLastTopic(topic)

  // Every answer makes Jobs a bit happier or angrier
  const mood = changeMood(moodChange)

  // Adds the current mood to the end of the reply text so it shows in the chat,
  // e.g. "The iPhone changed everything... (Mood: 60/100)".
  // The number is also sent on its own in "mood".
  //
  // To go back to the reply without the mood in the text:
  //   1. Delete the replyWithMood line below.
  //   2. Change the res.json line to: res.json({ reply: reply, mood: mood })
  //   3. In test-api.js make withMood() return just `text`.
  const replyWithMood = reply + ' (Mood: ' + mood + '/100)'

  res.json({ reply: replyWithMood, mood: mood })
})

module.exports = router
