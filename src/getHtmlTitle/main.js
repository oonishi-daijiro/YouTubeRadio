const diff = require('diff');

export function getLeastTitleList(newIDlist, currentIDlist, currentTitleList) {
  const difference = diff.diffArrays(newIDlist, currentIDlist)
  const titleList = parseTitleList(difference, currentTitleList)
  return titleList
}

function getTitleOnYoutube(youtubeVideoID, callback) {
  (async () => {
    try {
      const responseText = await getHtmlOnYouTube(youtubeVideoID)
      return responseText
    } catch (error) {
      console.log(error);
    }
  })().then(responseText => {
    const titleParser = new RegExp('(?<=<title.*>).*(?=</title>)')
    const rawTitle = Array.from(titleParser.exec(responseText)[0])
    const title = rawTitle.splice(0, rawTitle.length - 10).join('')
    callback(title)
  }).catch(error => {
    console.error(error)
  })
}

async function parseTitleList(diffData, currentTitileList) {
  const titles = currentTitileList.filter(() => true)
  const getYTtitleAsync = (ID) => {
    return new Promise((resolve, reject) => {
      getTitleOnYoutube(ID, (title) => {
        resolve(title)
      })
    })
  }
  let index = 0
  for (e of diffData) {
    if (e.added) {
      for (s of e.value) {
        const title = await getYTtitleAsync(s)
        titles.splice(index, 0, title)
        index++
      }
    } else if (e.removed) {
      e.value.forEach(s => {
        titles.splice(index, 1)
      })
    } else {
      e.value.forEach(s => {
        index++
      })
    }
  }
  return titles
}

function getHtmlOnYouTube(ID) {
  return new Promise((resolve, reject) => {
    const https = require('https')
    https.get(`https://www.youtube.com/watch?v=${ID}`, response => {
      let data = ''
      response.on('data', chunk => {
        data += chunk
      })
      response.on('end', () => {
        resolve(data)
      })
      response.on('error', error => {
        console.log(error);
        reject(error)
      })
    })
  })
}
