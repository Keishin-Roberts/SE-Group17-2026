// Runs every API test against the running backend.
// Start the server first (npm start), then run: node test-api.js

const conversation = require('./data/conversation.json')
const ideas = require('./data/ideas.json')

const API = 'http://localhost:3000/api'
const DEFAULT_REPLY = "That's not what we're here to talk about. Ask me something worth my time."
const OFF_TOPIC_MOOD = 45 // 50 - 5
const TYPO_PENALTY = 5
const REPEAT_PENALTY = 5

// Mood changes are read from the data files, so changing a number there does not break the tests
const IPHONE_MOOD = conversation.iphone.mood
const APP_IDEA_MOOD = ideas['idea app'].mood

let passed = 0
let failed = 0

/**
 * Checks that the reply is one of the topic's replies with the mood added.
 * The server picks a reply at random, so any of them is fine.
 */
function isTopicReply(reply, topic, mood) {
  return conversation[topic].replies.some(text => reply === withMood(text, mood))
}

/**
 * Same as isTopicReply, but only checks the end of the reply
 * (used when a typo complaint comes first).
 */
function endsWithTopicReply(reply, topic, mood) {
  return conversation[topic].replies.some(text => reply.endsWith(withMood(text, mood)))
}

/**
 * The server adds the mood to the end of every reply.
 * withMood('Hello', 52) -> 'Hello (Mood: 52/100)'
 */
function withMood(text, mood) {
  return text + ' (Mood: ' + mood + '/100)'
}

/**
 * Prints PASS or FAIL for one check.
 */
function check(name, condition, details) {
  if (condition) {
    passed++
    console.log('PASS ', name)
  } else {
    failed++
    console.log('FAIL ', name, '->', details)
  }
}

/**
 * Sends a message to POST /api/chat and returns { reply, mood }.
 */
async function chat(message) {
  const response = await fetch(API + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message })
  })
  return response.json()
}

/**
 * Sets the mood back to 50 so every test starts the same way.
 */
async function resetMood() {
  const response = await fetch(API + '/mood/reset', { method: 'POST' })
  return response.json()
}

async function testRoutes() {
  console.log('\n--- Routes ---')

  const health = await (await fetch(API + '/health')).json()
  check('GET /api/health returns ok', health.status === 'ok', health)

  const reset = await resetMood()
  check('POST /api/mood/reset returns 50', reset.mood === 50, reset)

  await chat('iphone')
  const mood = await (await fetch(API + '/mood')).json()
  check('GET /api/mood shows the new mood', mood.mood === 50 + IPHONE_MOOD, mood)
}

async function testEveryKeyword() {
  console.log('\n--- Every keyword in conversation.json ---')

  for (const topic in conversation) {
    for (const keyword of conversation[topic].keywords) {
      await resetMood()
      const result = await chat('tell me about ' + keyword.toUpperCase())
      const expectedMood = 50 + conversation[topic].mood

      check(
        `"${keyword}" gives a ${topic} reply and mood ${expectedMood}`,
        isTopicReply(result.reply, topic, expectedMood) && result.mood === expectedMood,
        result
      )
    }
  }
}

async function testWholeWords() {
  console.log('\n--- Keywords only match whole words ---')

  const cases = [
    ['hi steve', 'greeting'],
    ['tell me about iphones', 'iphone'],
    ['thanks a lot', 'thanks'],
    ['this is it', null],
    ['which one', null],
    ['I love my machine', null]
  ]

  for (const [message, topic] of cases) {
    await resetMood()
    const result = await chat(message)
    const ok = topic === null
      ? result.reply === withMood(DEFAULT_REPLY, OFF_TOPIC_MOOD)
      : isTopicReply(result.reply, topic, 50 + conversation[topic].mood)

    check(`"${message}" -> ${topic || 'default reply'}`, ok, result)
  }
}

function testDataFile() {
  console.log('\n--- conversation.json is valid ---')

  // A keyword in two topics would make one of them unreachable
  const owner = {}
  const duplicates = []
  for (const topic in conversation) {
    for (const keyword of conversation[topic].keywords) {
      if (owner[keyword]) duplicates.push(`"${keyword}" in "${owner[keyword]}" and "${topic}"`)
      owner[keyword] = topic
    }
  }
  check('every keyword belongs to only one topic', duplicates.length === 0, duplicates)

  const badTopics = Object.keys(conversation).filter(topic =>
    conversation[topic].replies.length === 0 || typeof conversation[topic].mood !== 'number')
  check('every topic has replies and a mood number', badTopics.length === 0, badTopics)
}

async function testMostSpecificKeyword() {
  console.log('\n--- The longest matching keyword wins ---')

  const cases = [
    ['tell me about the apple lisa', 'lisa computer'],
    ['what about your father', 'paul jobs'],
    ['do you like apple tv', 'apple tv'],
    ['tell me about the genius bar', 'apple store'],
    ['mac os x please', 'mac os x']
  ]

  for (const [message, topic] of cases) {
    await resetMood()
    const result = await chat(message)
    check(`"${message}" -> ${topic}`, isTopicReply(result.reply, topic, 50 + conversation[topic].mood), result)
  }
}

/**
 * Checks that the reply is one of the ideas of the area, with the mood added.
 */
function isIdeaOfArea(reply, area, mood) {
  return ideas[area].replies.some(text => reply === withMood(text, mood))
}

/**
 * Returns the area of an idea reply (the mood part is removed first), or null.
 */
function areaOfIdeaReply(reply) {
  const text = reply.replace(/ \(Mood: \d+\/100\)$/, '')
  for (const area in ideas) {
    if (ideas[area].replies.includes(text)) return area
  }
  return null
}

function testIdeasFile() {
  console.log('\n--- ideas.json is valid ---')

  const owner = {}
  const duplicates = []
  const seen = new Set()
  const repeated = []
  let total = 0
  for (const area in ideas) {
    for (const keyword of ideas[area].keywords) {
      if (owner[keyword]) duplicates.push(`"${keyword}" in "${owner[keyword]}" and "${area}"`)
      owner[keyword] = area
    }
    for (const text of ideas[area].replies) {
      if (seen.has(text)) repeated.push(text)
      seen.add(text)
      total++
    }
  }
  check('every idea keyword belongs to only one area', duplicates.length === 0, duplicates)
  check('no idea is written twice', repeated.length === 0, repeated)
  check('there are at least 1000 ideas', total >= 1000, total)

  const thin = Object.keys(ideas).filter(area => ideas[area].replies.length < 20)
  check('every area has at least 20 ideas', thin.length === 0, thin)
}

async function testIdeas() {
  console.log('\n--- Ideas: asking for an idea ---')

  // Every keyword of every area gives an idea of that area
  for (const area in ideas) {
    for (const keyword of ideas[area].keywords) {
      await resetMood()
      const result = await chat('give me an idea for ' + keyword.toUpperCase())
      check(
        `"idea for ${keyword}" gives an ${area} idea`,
        isIdeaOfArea(result.reply, area, 50 + ideas[area].mood) && result.mood === 50 + ideas[area].mood,
        result
      )
    }
  }

  // Different ways to ask
  for (const message of ['give me an idea', 'any ideas?', 'inspire me', 'I need some ideas please', 'brainstorm with me', 'what should I build']) {
    await resetMood()
    const result = await chat(message)
    check(`"${message}" gives an idea from any area`, areaOfIdeaReply(result.reply) !== null, result)
  }

  // Asking again and again gives new ideas, never a repeat complaint or a penalty
  await resetMood()
  let previous = ''
  let sameTwice = 0
  let lowered = 0
  let lastMood = 50
  const distinct = new Set()
  for (let count = 0; count < 25; count++) {
    const result = await chat('give me an idea for music')
    if (result.reply === previous) sameTwice++
    if (result.mood < lastMood) lowered++
    previous = result.reply
    lastMood = result.mood
    distinct.add(result.reply)
  }
  check('the same idea never comes twice in a row', sameTwice === 0, sameTwice)
  check('asking for ideas again never lowers the mood', lowered === 0, lowered)
  check('25 music ideas in a row are all different', distinct.size === 25, distinct.size)

  // Without an area, ideas come from many areas
  await resetMood()
  const areas = new Set()
  for (let count = 0; count < 40; count++) {
    areas.add(areaOfIdeaReply((await chat('give me an idea')).reply))
  }
  check('40 general ideas come from at least 10 areas', areas.size >= 10, [...areas])

  // The longest area keyword wins
  await resetMood()
  const result = await chat('idea for a mobile app')
  check('"idea for a mobile app" gives an app idea', isIdeaOfArea(result.reply, 'idea app', 50 + APP_IDEA_MOOD), result)

  // Sharing your own idea is not asking for one
  for (const message of ['I have an idea', 'what do you think of my idea', 'my startup idea is a bike shop']) {
    await resetMood()
    const reply = (await chat(message)).reply
    check(`"${message}" is feedback, not a new idea`, areaOfIdeaReply(reply) === null && !reply.startsWith("That's not what"), reply)
  }

  // Normal questions are not taken for idea requests
  await resetMood()
  const advice = await chat('what should I do')
  check('"what should I do" is still the advice topic', isTopicReply(advice.reply, 'advice', 50 + conversation.advice.mood), advice)

  // After an idea, the next normal topic is not a repeat
  await resetMood()
  await chat('iphone')
  await chat('give me an idea')
  const after = await chat('iphone')
  check('iPhone, idea, iPhone again is not a repeat', isTopicReply(after.reply, 'iphone', after.mood), after)
}

async function testReplyVariants() {
  console.log('\n--- Topics with several replies use more than one ---')

  const seen = new Set()
  for (let count = 0; count < 20; count++) {
    await resetMood()
    const result = await chat('iphone')
    seen.add(result.reply)
  }
  check('20 iPhone questions give at least 2 different replies', seen.size >= 2, [...seen])
}

async function testTypos() {
  console.log('\n--- Typos: Jobs complains but still answers ---')

  // [message, topic, correct keyword, what the user typed]
  const typos = [
    ['tell me about the iphnoe', 'iphone', 'iphone', 'iphnoe'],
    ['what about pixer', 'pixar', 'pixar', 'pixer'],
    ['hellp', 'greeting', 'hello', 'hellp'],
    ['howdi', 'greeting', 'howdy', 'howdi'],
    ['ipud', 'ipod', 'ipod', 'ipud'],
    ['do you like bil gates', 'bill gates', 'bill gates', 'bil gates'],
    ['macintosch', 'macintosh', 'macintosh', 'macintosch'],
    ['tell me about windos', 'microsoft', 'windows', 'windos']
  ]

  for (const [message, topic, keyword, typed] of typos) {
    await resetMood()
    const result = await chat(message)
    const expectedMood = 50 + conversation[topic].mood - TYPO_PENALTY

    check(
      `"${message}" is understood as "${keyword}"`,
      result.reply.startsWith(`It's "${keyword}", not "${typed}".`) &&
        endsWithTopicReply(result.reply, topic, expectedMood) &&
        result.mood === expectedMood,
      result
    )
  }
}

async function testNoMatch() {
  console.log('\n--- Real words and off-topic messages: default reply ---')

  const messages = [
    'I want to apply',
    'do you have a phone',
    'I am tired',
    'I think so',
    'that is garbage',
    'what is the weather',
    'put it on the table',
    'open the window',
    'cancel that',
    ''
  ]

  for (const message of messages) {
    await resetMood()
    const result = await chat(message)

    check(
      `"${message}" gets the default reply and mood ${OFF_TOPIC_MOOD}`,
      result.reply === withMood(DEFAULT_REPLY, OFF_TOPIC_MOOD) && result.mood === OFF_TOPIC_MOOD,
      result
    )
  }

  await resetMood()
  const response = await fetch(API + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  })
  const result = await response.json()
  check('request without "message" does not crash', response.status === 200 && result.reply === withMood(DEFAULT_REPLY, OFF_TOPIC_MOOD), result)
}

async function testRepeats() {
  console.log('\n--- Same topic twice in a row: complaint and penalty ---')

  await resetMood()
  await chat('iphone')
  let result = await chat('tell me about the iphone again')
  check(
    `asking about the iPhone twice gives no answer and mood ${50 + IPHONE_MOOD - REPEAT_PENALTY}`,
    !endsWithTopicReply(result.reply, 'iphone', result.mood) && result.mood === 50 + IPHONE_MOOD - REPEAT_PENALTY,
    result
  )

  await resetMood()
  await chat('iphone')
  result = await chat('iphnoe')
  check('a typo of the same topic is still a repeat', result.mood === 50 + IPHONE_MOOD - REPEAT_PENALTY, result)

  await resetMood()
  await chat('iphone')
  await chat('what is the weather')
  result = await chat('iphone')
  check(
    'iPhone, then something else, then iPhone again is not a repeat',
    isTopicReply(result.reply, 'iphone', 50 + IPHONE_MOOD + (OFF_TOPIC_MOOD - 50) + IPHONE_MOOD),
    result
  )

  await chat('iphone')
  await resetMood()
  result = await chat('iphone')
  check('reset starts a new chat, so the same topic is not a repeat', result.mood === 50 + IPHONE_MOOD, result)
}

async function testMoodLimits() {
  console.log('\n--- Mood stays between 0 and 100 ---')

  await resetMood()
  let result
  for (let count = 0; count < 20; count++) {
    result = await chat('android')
  }
  check('many "android" messages stop at 0', result.mood === 0, result)

  // Different topics each time, otherwise the repeat penalty kicks in
  await resetMood()
  for (let count = 0; count < 40; count++) {
    result = await chat(count % 2 === 0 ? 'iphone' : 'pixar')
  }
  check('many good topics stop at 100', result.mood === 100, result)
}

async function main() {
  try {
    testDataFile()
    testIdeasFile()
    await testRoutes()
    await testEveryKeyword()
    await testWholeWords()
    await testMostSpecificKeyword()
    await testReplyVariants()
    await testIdeas()
    await testTypos()
    await testNoMatch()
    await testRepeats()
    await testMoodLimits()
  } catch (error) {
    console.log('\nCould not reach the backend. Is it running on port 3000? (npm start)')
    console.log(error.message)
    process.exit(1)
  }

  // Leave the server in a clean state
  await resetMood()

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}

main()
