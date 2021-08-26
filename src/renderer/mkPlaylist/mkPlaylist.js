const cancelButton = document.getElementById('cancel')
const ipcRenderer = window.api.ipcRenderer
const urlTable = document.getElementById('urls')
const url = window.api.url // <=require('url')
const domParser = new DOMParser()

function getIdlistFromStore(callback) {
  (async () => {
    const idList = await new Promise((resolve, reject) => {
      ipcRenderer.getVideoIDandTitle('')
      ipcRenderer.on('replyUrlList', (event, args) => {
        resolve(args.list)
      })
    })
    return idList
  })().then((replyData) => {
    callback(replyData)
  })
}

window.onload = () => { // when this window has opened, get data from config.json
  const tableDOM = document.getElementById('urls')
  getIdlistFromStore((list) => {
    if (list.length === 0) { // if the length of list is 0
      addURLinputRow()
      return
    }
    list.forEach(element => {
      addURLinputRow()
    })
    const rows = Array.from(tableDOM.rows)
    rows.forEach((element, index) => {
      if (list[index] === null) {
        return
      }
      element.childNodes[0].childNodes[1].value = 'https://www.youtube.com/watch?v=' + list[index]
    })
  })
}



cancelButton.addEventListener('click', (event) => {
  window.api.ipcRenderer.closeMkplay('canceled')
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
  const idList = parseUrls(grtUrlByTable())
  ipcRenderer.storeIdList(idList)
  ipcRenderer.submitIdListToPlayer(idList) //send list of ID to main process
})

const addUrlButton = document.getElementById('addIco')

addUrlButton.addEventListener('click', () => {
  addURLinputRow()
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
  tableContent
    .appendChild(tr)
    .appendChild(td)
    .appendChild(textArea)
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

function getHtmlTieleOfYotubeFromHtml(idList) {
  const titleList = []
  idList.forEach((content) => {
    ipcRenderer.requestYTvideoHtml(content)
  })
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
    callback(responseText)
  }).catch(error => {
    console.log(error);
  })
}

getTitleOnYoutube('adGhT_-JbZI', (resp) => {
  const dom = domParser.parseFromString(resp, 'text/html')
  const titleText = Array.from(dom.title).splice(0, dom.title.length - 10).join('')
  console.log(titleText);
})
