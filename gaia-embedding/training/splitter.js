const fs = require('fs')
const path = require('path')

// Function to split JSON data into two chunks without breaking objects
function splitJSONFile(filePath) {
  fs.readFile('packages/gaia-embedding/chunk_1.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err)
      return
    }

    try {
      const jsonData = JSON.parse(data)
      const halfIndex = Math.ceil(jsonData.length / 2)

      const firstChunk = jsonData.slice(0, halfIndex)
      const secondChunk = jsonData.slice(halfIndex)

      const chunks = [firstChunk, secondChunk]

      chunks.forEach((chunk, index) => {
        const chunkPath = path.join(
          path.dirname(filePath),
          `halfchunk_${index + 1}.json`
        )
        fs.writeFile(
          chunkPath,
          JSON.stringify(chunk, null, 2),
          'utf8',
          err => {
            if (err) {
              console.error(`Error writing ${chunkPath}:`, err)
            } else {
              console.log(`Chunk saved to ${chunkPath}`)
            }
          }
        )
      })
    } catch (parseErr) {
      console.error('Error parsing JSON data:', parseErr)
    }
  })
}

// Example usage
splitJSONFile('packages/gaia-embedding/vulnerability.json')
