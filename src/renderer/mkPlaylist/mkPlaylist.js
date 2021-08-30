const cancelButton = document.getElementById('cancel')
const ipcRenderer = window.api.ipcRenderer
const urlTable = document.getElementById('urls')
const url = window.api.url // <=require('url')
const domParser = new DOMParser()

function getIDlistAndTitleList(callback) {
  (async () => {
    const list = await new Promise((resolve, reject) => {
      ipcRenderer.getVideoIDandTitle('')
      ipcRenderer.on('replyUrlList', (event, args) => {
        resolve(args)
      })
    })
    return list
  })().then((replyData) => {
    callback(replyData)
  })
}

window.onload = () => { // when this window has opened, get data from config.json
  const tableDOM = document.getElementById('urls')
  getIDlistAndTitleList((list) => {
    const idListArray = Array.from(list.IDlist)
    if (idListArray.length === 0) {
      addURLinputRow()
      return
    }
    idListArray.forEach(element => {
      addURLinputRow()
    })
    const rows = Array.from(tableDOM.rows)
    rows.forEach((element, index) => {
      getTitleOnYoutube(idListArray[index], (titleText) => {
        // element.childNodes[0].childNodes[1].value = titleText;
        console.log(titleText);
      })
      if (idListArray[index] === null) {
        return
      }
      element.childNodes[0].childNodes[1].value = `https://www.youtube.com/watch?v=${idListArray[index]}`
    })
  })
}



cancelButton.addEventListener('click', (event) => {
  ipcRenderer.closeMkplay('canceled')
  const tableContent = document.getElementById('tableContents').rows
  Array.from(tableContent).forEach(element => {
    if (tableContent.length === 1) { // dom tbody element
      return
    }
    if (element.childNodes[0].childNodes[1].value === '') {
      element.remove()
    }
  })
})

const submit = document.getElementById('submit')

function parseUrls(urlList) {
  const parsedList = urlList.filter(i => {
    const u = url.parse(i, true)
    return u.hostname === 'www.youtube.com' && u.query.v.length === 11 && i !== ""
  }).map((i) => {
    const u = url.parse(i, true)
    return u.query.v
  })
  return parsedList
}

submit.addEventListener('click', () => {
  const newIDList = parseUrls(grtUrlByTable())
  newIDList.forEach(element => {
    getTitleOnYoutube(element, (titleText) => {
      console.log(titleText);
    })
  });
  ipcRenderer.storeIdList(newIDList)
  ipcRenderer.submitIdListToPlayer(newIDList) //send list of ID to main process
})

const addUrlButton = document.getElementById('addIco')

addUrlButton.addEventListener('click', () => {
  const table = addURLinputRow()
  const leastRowPosition = table.childNodes[table.childNodes.length - 1].offsetTop
  document.getElementById('scroller').scrollTo(0, leastRowPosition)
})

function addURLinputRow() {
  const tableContent = document.getElementById('tableContents')
  const tr = document.createElement('tr')
  const td = document.createElement('td')
  const textArea = document.createElement('input')
  const i = document.createElement('i')
  i.className = 'fas fa-times removeId'
  i.addEventListener('click', (event) => {
    if (event.target.parentNode.parentNode.parentNode.childNodes.length === 2) { // dom tbody element
      event.target.parentNode.childNodes[1].value = ''
      return
    }
    event.target.parentNode.parentNode.remove()
  })
  td.appendChild(i)
  textArea.className = 'urlArea'
  textArea.placeholder = 'YouTube URL here'
  tr.addEventListener('click', e => {
    const trList = Array.from(tableContent.childNodes)
    const index = trList.indexOf(tr)
    console.log(index);
  })
  tableContent
    .appendChild(tr)
    .appendChild(td)
    .appendChild(textArea)
  return tableContent
}

function grtUrlByTable() {
  const urlList = []
  const tableContent = document.getElementById('urls')
  const rows = Array.from(tableContent.rows)
  rows.forEach(element => {
    urlList.push(element.childNodes[0].childNodes[1].value)
  })
  return urlList
}

function getTitleOnYoutube(youtubeVideoID, callback) {
  (async () => {
    const response = await fetch(`https://www.youtube.com/watch?v=${youtubeVideoID}`)
    if (response.ok) {
      const responseBody = response.text()
      return responseBody
    } else {
      throw new Error(response.statusText)
    }
  })().then(responseText => {
    const dom = domParser.parseFromString(responseText, 'text/html')
    const titleText = Array.from(dom.title).splice(0, dom.title.length - 10).join('')
    callback(titleText)
  }).catch(error => {
    console.log(error);
  })
}
