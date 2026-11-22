const express = require('express')

const router = express.Router()

const conversation = require('../data/conversation.json')

// POST /api/chat
router.post('/', (req, res) => {
  let responseMessage = null
  const userMessage = req.body.message
  for (const key in conversation) {
    if (userMessage.toLowerCase().includes(key)) {
      responseMessage = conversation[key]}
    }
  if (responseMessage) {
    res.json({ reply: responseMessage })
  } else {
    res.json({ reply: "I think that's a little out of scope for today's conversation."})
  }
})

module.exports = router
