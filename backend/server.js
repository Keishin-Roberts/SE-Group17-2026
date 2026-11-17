const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

// All API endpoints live under /api/<function>
const api = express.Router()

api.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

api.post('/chat', (req, res) => {
  const userMessage = req.body.message

  res.json({ reply: 'You said: ' + userMessage })
})

app.use('/api', api)

app.listen(3000, '127.0.0.1', () => {
  console.log('Server running on http://localhost:3000')
})
