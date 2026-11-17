const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' })
})

app.use('/api', require('./routes'))

app.listen(3000, '127.0.0.1', () => {
  console.log('Server running on http://localhost:3000')
})
