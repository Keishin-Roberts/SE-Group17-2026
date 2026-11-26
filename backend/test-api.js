// Runs every API test against the running backend.
// Start the server first (npm start), then run: node test-api.js

const conversation = require('./data/conversation.json')

const API = 'http://localhost:3000/api'
const DEFAULT_REPLY = "That's not what we're here to talk about. Ask me something worth my time."
const OFF_TOPIC_MOOD = 45 // 50 - 5
const TYPO_PENALTY = 5
const REPEAT_PENALTY = 5

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
  check('GET /api/mood shows the new mood', mood.mood === 60, mood)
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
    'asking about the iPhone twice gives no answer and mood 55',
    !endsWithTopicReply(result.reply, 'iphone', result.mood) && result.mood === 50 + 10 - REPEAT_PENALTY,
    result
  )

  await resetMood()
  await chat('iphone')
  result = await chat('iphnoe')
  check('a typo of the same topic is still a repeat', result.mood === 50 + 10 - REPEAT_PENALTY, result)

  await resetMood()
  await chat('iphone')
  await chat('what is the weather')
  result = await chat('iphone')
  check(
    'iPhone, then something else, then iPhone again is not a repeat',
    isTopicReply(result.reply, 'iphone', 50 + 10 - 5 + 10),
    result
  )

  await chat('iphone')
  await resetMood()
  result = await chat('iphone')
  check('reset starts a new chat, so the same topic is not a repeat', result.mood === 60, result)
}

async function testMoodLimits() {
  console.log('\n--- Mood stays between 0 and 100 ---')

  await resetMood()
  let result
  for (let count = 0; count < 10; count++) {
    result = await chat('android')
  }
  check('many "android" messages stop at 0', result.mood === 0, result)

  // Different topics each time, otherwise the repeat penalty kicks in
  await resetMood()
  for (let count = 0; count < 10; count++) {
    result = await chat(count % 2 === 0 ? 'iphone' : 'pixar')
  }
  check('many good topics stop at 100', result.mood === 100, result)
}

async function main() {
  try {
    testDataFile()
    await testRoutes()
    await testEveryKeyword()
    await testWholeWords()
    await testMostSpecificKeyword()
    await testReplyVariants()
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
