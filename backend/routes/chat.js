const express = require('express')
const { changeMood } = require('../mood')

const router = express.Router()

// Keywords and their answers: { "keyword": { "reply": "...", "mood": number } }
const conversation = require('../data/conversation.json')

// Used when the message has no known keyword
const defaultResponse = { reply: "I think that's a little out of scope for today's conversation.", mood: -2 }

/**
 * POST /api/chat
 * Body: { message: "Tell me about the iPhone" }
 * Response: { reply: "The iPhone changed everything...", mood: 60 }
 */
router.post('/', (req, res) => {
  // Lower case so "iPhone" and "iphone" both match
  const userMessage = (req.body.message || '').toLowerCase()

  // Find a keyword inside the message, the last match in the file wins
  let response = defaultResponse
  for (const keyword in conversation) {
    if (userMessage.includes(keyword)) {
      response = conversation[keyword]
    }
  }

  // Every answer makes Jobs a bit happier or angrier
  const mood = changeMood(response.mood)

  res.json({ reply: response.reply, mood: mood })
})

module.exports = router
