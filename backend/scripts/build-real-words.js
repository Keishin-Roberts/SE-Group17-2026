// Builds data/realWords.json: real English words that look like a keyword with a typo
// (e.g. "apply" next to "apple"), so the chat never complains about them.
// Run it again after adding keywords to conversation.json:
//   node scripts/build-real-words.js
// It downloads the public domain word list from github.com/dwyl/english-words
// (about 370,000 words, 4 MB). The chat itself never goes online, only this script.

const fs = require('fs')
const path = require('path')
const { levenshtein, allowedMistakes } = require('../spelling')
const conversation = require('../data/conversation.json')

const WORD_LIST_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt'
const OUTPUT = path.join(__dirname, '..', 'data', 'realWords.json')

/**
 * Downloads the word list and returns its text.
 */
async function downloadWordList() {
  console.log('Downloading word list from ' + WORD_LIST_URL)
  const response = await fetch(WORD_LIST_URL)
  if (!response.ok) throw new Error('Download failed with status ' + response.status)
  return response.text()
}

async function main() {
  let text
  try {
    text = await downloadWordList()
  } catch (error) {
    console.log('Could not download the word list. Check your internet connection.')
    console.log(error.message)
    process.exit(1)
  }

  // Only single words are checked, phrases like "bill gates" are compared word by word anyway
  const keywords = new Set()
  for (const topic in conversation) {
    for (const keyword of conversation[topic].keywords) {
      if (!keyword.includes(' ')) keywords.add(keyword)
    }
  }

  // Group words by length, so each keyword is only compared with words of similar length
  const wordsByLength = {}
  for (const line of text.split('\n')) {
    const word = line.trim().toLowerCase()
    if (!/^[a-z]+$/.test(word)) continue
    if (!wordsByLength[word.length]) wordsByLength[word.length] = new Set()
    wordsByLength[word.length].add(word)
  }

  const found = new Set()
  for (const keyword of keywords) {
    const allowed = allowedMistakes(keyword)
    if (allowed === 0) continue

    for (let length = keyword.length - allowed; length <= keyword.length + allowed; length++) {
      for (const word of wordsByLength[length] || []) {
        // Keywords themselves and their plurals are matched exactly, not as typos
        if (keywords.has(word) || word === keyword + 's') continue
        if (levenshtein(word, keyword) <= allowed) found.add(word)
      }
    }
  }

  const sorted = [...found].sort()
  fs.writeFileSync(OUTPUT, JSON.stringify(sorted).replace(/","/g, '",\n"') + '\n')
  console.log(`Saved ${sorted.length} real words to data/realWords.json`)
}

main()
