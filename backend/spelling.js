// Helpers for understanding words that the user typed with a mistake.

/**
 * Levenshtein distance: the smallest number of letters you need to
 * change, add or remove to turn one word into the other.
 * Swapping two letters next to each other also counts as one mistake.
 * levenshtein('pixar', 'pixer')   -> 1
 * levenshtein('iphone', 'iphnoe') -> 1
 */
function levenshtein(firstWord, secondWord) {
  // previousRow[index] = distance between the letters of firstWord checked so far
  // and the first `index` letters of secondWord
  let rowBeforePrevious = []
  let previousRow = []
  for (let index = 0; index <= secondWord.length; index++) {
    previousRow.push(index)
  }

  for (let firstIndex = 1; firstIndex <= firstWord.length; firstIndex++) {
    const currentRow = [firstIndex]

    for (let secondIndex = 1; secondIndex <= secondWord.length; secondIndex++) {
      const sameLetter = firstWord[firstIndex - 1] === secondWord[secondIndex - 1]
      const replaceCost = sameLetter ? 0 : 1

      let distance = Math.min(
        previousRow[secondIndex] + 1,                 // remove a letter
        currentRow[secondIndex - 1] + 1,              // add a letter
        previousRow[secondIndex - 1] + replaceCost    // change a letter
      )

      // "on" typed as "no" is one swap, not two changes
      const swappedLetters = firstIndex > 1 && secondIndex > 1 &&
        firstWord[firstIndex - 1] === secondWord[secondIndex - 2] &&
        firstWord[firstIndex - 2] === secondWord[secondIndex - 1]
      if (swappedLetters) {
        distance = Math.min(distance, rowBeforePrevious[secondIndex - 2] + 1)
      }

      currentRow.push(distance)
    }

    rowBeforePrevious = previousRow
    previousRow = currentRow
  }

  return previousRow[secondWord.length]
}

// Real English words that look like a keyword with a typo,
// e.g. "apply" is close to "apple", so they are never treated as mistakes
const realWords = new Set([
  'hell', 'cello',
  'apply', 'ample',
  'garbage',
  'deign', 'resign',
  'fire', 'fires', 'fixed', 'fried', 'hired', 'tired', 'wired',
  'pod', 'pods', 'pad', 'pads',
  'phone', 'phones',
  'adroit',
  'healthy', 'hearth', 'heath', 'wealth',
  'than', 'think', 'tank', 'shank'
])

/**
 * How many mistakes we forgive: none for very short words,
 * one for normal words and two for long words.
 */
function allowedMistakes(keyword) {
  if (keyword.length >= 7) return 2
  if (keyword.length >= 4) return 1
  return 0
}

/**
 * Looks for a keyword that the user typed with a small mistake.
 * Returns { keyword, typedText, distance } or null if nothing is close enough.
 * Example: findClosestKeyword('tell me about the iphnoe', ['iphone']) ->
 *          { keyword: 'iphone', typedText: 'iphnoe', distance: 2 }
 */
function findClosestKeyword(message, keywords) {
  const words = message.split(/[^a-z0-9]+/).filter(word => word !== '')
  let closest = null

  for (const keyword of keywords) {
    // "bill gates" has two words, so compare it with every pair of words
    const keywordLength = keyword.split(' ').length

    for (let start = 0; start + keywordLength <= words.length; start++) {
      const typedText = words.slice(start, start + keywordLength).join(' ')

      // A correctly spelled real word is not a typo
      if (realWords.has(typedText)) continue

      const distance = levenshtein(typedText, keyword)

      const isTypo = distance > 0 && distance <= allowedMistakes(keyword)
      if (isTypo && (closest === null || distance < closest.distance)) {
        closest = { keyword, typedText, distance }
      }
    }
  }

  return closest
}

module.exports = { levenshtein, findClosestKeyword }
