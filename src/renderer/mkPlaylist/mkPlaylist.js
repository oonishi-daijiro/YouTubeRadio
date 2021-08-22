const close = document.getElementById('cancel')
const ipcRenderer = window.api.ipcRenderer
const urlTable = document.getElementById('urls')
const url = window.api.url // <=require('url')

let firstId = '' // if value of first input text tag, value of first tag will be here
window.onload = () => { // when window has opened, get data from config.json
  const tableContent = document.getElementById('urls')
  ipcRenderer.send('getUrlSettings', '')
  ipcRenderer.on('replyUrlList', (event, args) => {
    if (!args.list.length) {
      addTableContent()
      return
    }
    args.list.forEach(element => {
      addTableContent()
    })
    let rows = Array.from(tableContent.rows)
    let i = 0
    rows.forEach(element => {
      element.childNodes[0].childNodes[1].value = 'https://www.youtube.com/watch?v=' + args.list[i]
      i++
    })
  })
}
close.addEventListener('click', (event) => {
  window.api.ipcRenderer.send('closeMkplay', 'canceled')
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
  let parsedList = []
  urlList.forEach(element => {
    let parsedUrl = url.parse(element, true)
    if (parsedUrl.hostname === 'www.youtube.com' && parsedUrl.query.v) {
      parsedList[parsedList.length] = parsedUrl.query.v
    }
  })
  return parsedList
}
submit.addEventListener('click', () => {
  let IdPlaylist = parseUrls(grtUrlByTable())
  if (!IdPlaylist.length && firstId.length) {
    IdPlaylist[0] = firstId
  }
  ipcRenderer.setParsedUrl('setParsedIdlist', IdPlaylist)
  ipcRenderer.send('submitUrlList', IdPlaylist) //send id list to main process
  const tableContent = document.getElementById('tableContents').rows
  Array.from(tableContent).forEach(element => {
    if (element.firstChild.childNodes[1].value === '') {
      element.remove()
    }
  })
})

const addUrlButton = document.getElementById('addIco')

addUrlButton.addEventListener('click', () => {
  addTableContent()
})

function addTableContent() {
  const tableContent = document.getElementById('tableContents')
  let tr = document.createElement('tr')
  let td = document.createElement('td')
  let textArea = document.createElement('input')
  const i = document.createElement('i')
  i.className = 'fas fa-times removeId'
  i.addEventListener('click', (event) => {
    if (event.target.parentNode.parentNode.parentNode.childNodes.length - 1 === 1) { // dom tbody element
      firstId = url.parse(event.target.parentNode.childNodes[1].value, true).query.v
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
  let urlList = []
  const tableContent = document.getElementById('urls')
  let rows = Array.from(tableContent.rows)
  rows.forEach(element => {
    if (element.childNodes[0].childNodes[1].value === '') {
      return
    }
    urlList[urlList.length] = element.childNodes[0].childNodes[1].value
  })
  return urlList
}
