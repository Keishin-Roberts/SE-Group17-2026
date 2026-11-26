const express = require('express')
const { getMood, resetMood } = require('../mood')

const router = express.Router()

/**
 * GET /api/mood
 * Returns Jobs' current mood.
 * Response: { mood: 50 }
 */
router.get('/', (req, res) => {
  res.json({ mood: getMood() })
})

/**
 * POST /api/mood/reset
 * Sets the mood back to the default (50), e.g. for a "new chat" button.
 * Response: { mood: 50 }
 */
router.post('/reset', (req, res) => {
  res.json({ mood: resetMood() })
})

module.exports = router
