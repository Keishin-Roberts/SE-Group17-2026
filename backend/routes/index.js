const express = require('express')

const router = express.Router()

// Every route here is available under /api, for example /api/chat
router.use('/health', require('./health')) // GET  /api/health
router.use('/chat', require('./chat'))     // POST /api/chat
router.use('/mood', require('./mood'))     // GET  /api/mood, POST /api/mood/reset

module.exports = router
