const express = require('express')

const router = express.Router()

// Each file in this folder is one API function: /api/<name>
router.use('/health', require('./health'))
router.use('/chat', require('./chat'))

module.exports = router
