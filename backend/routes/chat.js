const express = require('express')

const router = express.Router()

// Load the conversation data from the JSON file
const conversation = require('../data/conversation.json')

// POST /api/chat
router.post('/', (req, res) => {
  let responseMessage = null
  const userMessage = req.body.message

  // Check if the user's message contains any messages with responses in the conversation data
  for (const key in conversation) {
    if (userMessage.toLowerCase().includes(key)) {
      //sets the response to the relevant response for the input message
      responseMessage = conversation[key]}
    }

  // sends the response back or default message if user input has no response in the conversation data
  if (responseMessage) {
    res.json({ reply: responseMessage })
  } else {
    res.json({ reply: "I think that's a little out of scope for today's conversation."})
  }
})

module.exports = router
