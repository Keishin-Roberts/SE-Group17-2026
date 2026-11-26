const express = require('express')
const { changeMood, getLastTopic, setLastTopic, drawIdea } = require('../mood')
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

// Ideas: { "idea topic": { "keywords": [...], "replies": [ideas], "mood": number } }
const ideas = require('../data/ideas.json')

// Every idea area keyword and its area, e.g. { "music": "idea music" }
const areaOfKeyword = {}
for (const area in ideas) {
  for (const keyword of ideas[area].keywords) {
    areaOfKeyword[keyword] = area
  }
}

// Every idea of every area in one list, used when the user does not name an area
const allIdeas = []
for (const area in ideas) {
  for (const text of ideas[area].replies) {
    allIdeas.push({ text: text, mood: ideas[area].mood })
  }
}

// Words that mean the user wants an idea, e.g. "give me an idea for a music app"
const IDEA_REQUEST = /\b(ideas?|inspire me|brainstorm|suggest(ion)?s?|what should i (build|make|create|design|start))\b/

// The topic for users who share their own idea, it must not start idea mode
const IDEA_FEEDBACK_TOPIC = 'idea feedback'

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
 * Gives an idea for the area named in the message (the longest area keyword wins),
 * or from all areas if none is named. Ideas come from a shuffled deck, so the same
 * idea is not given again until all the others have been given. Returns { text, mood }.
 */
function pickIdea(message) {
  let area = null
  let matchedKeyword = ''
  for (const keyword in areaOfKeyword) {
    if (keyword.length > matchedKeyword.length && containsKeyword(message, keyword)) {
      area = areaOfKeyword[keyword]
      matchedKeyword = keyword
    }
  }

  if (area === null) {
    return drawIdea('all', allIdeas)
  }

  const areaIdeas = ideas[area].replies.map(text => ({ text: text, mood: ideas[area].mood }))
  return drawIdea(area, areaIdeas)
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

  // 2. The user asks for an idea, e.g. "idea for a music app" or just "give me an idea"
  const isIdeaRequest = IDEA_REQUEST.test(userMessage) && topic !== IDEA_FEEDBACK_TOPIC

  // 3. No exact match, so check for a keyword with a small typo
  let typo = null
  if (topic === null && !isIdeaRequest) {
    typo = findClosestKeyword(userMessage, Object.keys(topicOfKeyword))
    if (typo) {
      topic = topicOfKeyword[typo.keyword]
    }
  }

  let reply
  let moodChange

  if (isIdeaRequest) {
    // Ideas never count as a repeat, every answer is a different idea
    const idea = pickIdea(userMessage)
    reply = idea.text
    moodChange = idea.mood
    topic = null
  } else if (topic === null) {
    // Nothing matched at all
    reply = defaultResponse.reply
    moodChange = defaultResponse.mood
  } else if (topic === getLastTopic()) {
    // Same topic as last time, so no answer and no bonus, only a penalty
    reply = pickRandom(repeatComplaints)
    moodChange = -REPEAT_PENALTY
  } else if (typo) {
    // Jobs still answers, but complains first and gets annoyed
    reply = makeComplaint(typo.keyword, typo.typedText) + ' ' + pickRandom(conversation[topic].replies)
    moodChange = conversation[topic].mood - TYPO_PENALTY
  } else {
    // Normal answer, one of the topic's replies picked at random
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
