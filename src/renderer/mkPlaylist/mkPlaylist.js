const cancelButton = document.getElementById('cancel')
const ipcRenderer = window.api.ipcRenderer
const urlTable = document.getElementById('urls')
const url = window.api.url // <=require('url')
const domParser = new DOMParser()
const diffArrays = window.api.getDiffFromArrays
const getHtmlOnYouTube = window.api.getHtmlOnYouTube

function getListOfIDandTitleFromStore(callback) {
  (async () => {
    const list = await new Promise((resolve, reject) => {
      ipcRenderer.getVideoIDandTitle('')
      ipcRenderer.once('replyUrlList', (event, args) => {
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
  getListOfIDandTitleFromStore((list) => {
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
      if (idListArray[index] === null) {
        return
      }
      element.childNodes[0].childNodes[1].value = `https://www.youtube.com/watch?v=${idListArray[index]}`
    })
  })
}

cancelButton.addEventListener('click', (event) => {
  ipcRenderer.closeMkplay()
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

const submit = document.getElementById('submit')

submit.addEventListener('click', () => {
  const newIDList = parseUrls(grtUrlByTable())
  getListOfIDandTitleFromStore(list => {
    if (newIDList.length === 0) {
      getTitleOnYoutube(list.IDlist[0], title => {
        ipcRenderer.storeTitleList([title])
      })
      ipcRenderer.closeMkplay()
      return
    }
    ipcRenderer.getTitleAndStore(newIDList)
    submitIDs(newIDList)
    ipcRenderer.closeMkplay()
  })
})

function submitIDs(newIDList) {
  ipcRenderer.submitIdListToPlayer(newIDList)
}


const addUrlButton = document.getElementById('addIco')

addUrlButton.addEventListener('click', () => {
  const table = addURLinputRow()
  if (table.childNodes.length <= 5) {
    return
  }
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
    if (event.target.parentNode.parentNode.parentNode.childNodes.length === 2) {
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
