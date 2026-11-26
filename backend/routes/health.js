const express = require('express')

const router = express.Router()

/**
 * GET /api/health
 * Lets the frontend check that the API is working.
 * Response: { status: "ok" }
 */
router.get('/', (req, res) => {
  res.json({ status: 'ok' })
})

module.exports = router
