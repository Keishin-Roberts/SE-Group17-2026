const express = require('express')
const cors = require('cors')

const app = express()

// Allow requests from the frontend, which runs on another port
app.use(cors())

// Turn JSON request bodies into req.body objects
app.use(express.json())

// GET / - quick check that the server is up
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

// All API routes start with /api, see routes/index.js
app.use('/api', require('./routes'))

app.listen(3000, '127.0.0.1', () => {
  console.log('Server running on http://localhost:3000')
})
