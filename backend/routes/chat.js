const express = require('express')

const router = express.Router()

// POST /api/chat
router.post('/', (req, res) => {
  const userMessage = req.body.message

  res.json({ reply: 'You said: ' + userMessage })
})

module.exports = router
