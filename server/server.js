const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())

app.get('/time', (req, res) => {
  const time = new Date().toLocaleTimeString()

  res.json({ time: time })
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})