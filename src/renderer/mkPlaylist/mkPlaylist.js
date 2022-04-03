const ipcRenderer = window.api.ipcRenderer
const url = window.api.url
const config = {
  set: (idList) => {
    ipcRenderer.storeIdList(idList)
  },
  get: async () => {
    return await new Promise((resolve, reject) => {
      window.api.ipcRenderer.getVideoIDandTitle()
      ipcRenderer.once('replyUrlList', (event, args) => {
        resolve({
          IDlist: args.IDlist.list,
          TitleList: args.titleList.list
        })
      })
    })
  }
}

function htmlspecialchars(str) {
  return (str + '').replace(/&amp;/g, "&")
    .replace(/&quot;/g, '\"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

class urlField {
  constructor() {
    this.table = document.getElementById(urlField.tableID)
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    const field = urlField.Field
    const removeButton = urlField.RemoveButton
    tr.className = 'URLfield-row'
    td.className = "URLField-td"
    this.tr = tr
    this.td = td
    this.field = field
    this.removeButton = removeButton
    td.appendChild(removeButton)
    td.appendChild(field)
    tr.appendChild(td)
    this.table.appendChild(tr)
    removeButton.addEventListener('click', () => {
      this.remove()
    })
    urlField.fields.push(this)
  }
  getURL = () => {
    const url = this.field.value
    return url
  }
  setURL = (url) => {
    this.field.value = url
  }
  get index() {
    return urlField.fields.indexOf(this)
  }
  remove = () => {
    this.tr.remove()
    const index = this.index
    urlField.fields.splice(index, 1)
    if (urlField.fields.length === 0) {
      new urlField()
    }
  }
  static fields = []
  static tableID = 'urls'
  static get Field() {
    const input = document.createElement('input')
    input.type = "text"
    input.className = "URLField"
    input.placeholder = "YouTube URL"
    input.spellcheck = false
    return input
  }
  static get TitleDisplay() {
    const input = document.createElement('input')
    input.className = "title"
    input.spellcheck = false
    return input
  }
  static get JumpButton() {
    const button = document.createElement('i')
    button.className = 'fas fa-play jumpButton'
    return button
  }
  static get RemoveButton() {
    const button = document.createElement('i')
    button.className = 'fas fa-times removeId'
    return button
  }
}

class titleDisplayAndURLField extends urlField {
  constructor(initialize = {
    id: "",
    title: ""
  }) {
    super()
    this.field.style.display = 'none'
    this.field.value = `https://www.youtube.com/watch?v=${initialize.id}`
    const jumpButton = urlField.JumpButton
    const titleDisplay = urlField.TitleDisplay
    titleDisplay.value = htmlspecialchars(initialize.title)
    titleDisplay.addEventListener('focus', (event) => {
      event.stopPropagation()
      titleDisplay.style.display = 'none'
      this.field.style.display = 'flex'
      this.field.focus()
    })
    this.field.addEventListener('focusout', (event) => {
      event.stopPropagation()
      titleDisplay.style.display = 'flex'
      this.field.style.display = 'none'
    })
    jumpButton.addEventListener('click', () => {
      console.log(this.index)
      jumpToThisIndex(this.index)
      closeWindow()
    })
    this.td.appendChild(titleDisplay)
    this.td.appendChild(jumpButton)
  }
}

window.onload = () => {
  config.get().then((data) => {
    if (data.IDlist.length === 0) {
      new urlField()
      return
    }
    data.IDlist.forEach((id, index) => {
      let title = data.TitleList[index]
      if (data.TitleList[index] === undefined) {
        title = 'Loading.....'
      }
      new titleDisplayAndURLField({
        id: id,
        title: title
      })
    })
  })
}

function parseURLtoID() {
  this.forEach((i, index) => {
    const u = url.parse(i, true)
    this[index] = u.query.v === undefined ? "" : u.query.v
  })
}

function getURLlist() {
  const list = []
  urlField.fields.forEach(field => {
    const url = field.getURL()
    list.push(url)
  })
  return list
}

function removeInvalidURL(list) {
  const newURLList = []
  list.forEach((i, index) => {
    const u = url.parse(i, true)
    if (u.hostname === 'www.youtube.com' && u.query.v.length === 11 && i !== "") { // the condition of valid url
      newURLList.push(i)
    }
  })
  return newURLList
}

function applyIDToConfig() {
  ipcRenderer.applyIDToConfig(this)
}

function applyToPlayer() {
  ipcRenderer.submitIdListToPlayer(this)
}

function closeWindow() {
  ipcRenderer.closeMkplay()
}

document.getElementById('addUrlButton').addEventListener('click', () => {
  const r = new urlField()
  document.getElementById('scroller').scrollTo(0, r.tr.offsetTop)
})

function jumpToThisIndex(index = 0) {
  ipcRenderer.jumpVideo(index)
}

function submit() {
  const list = getURLlist()
  const validURLlist = removeInvalidURL(list)
  parseURLtoID.apply(validURLlist)
  applyToPlayer.apply(validURLlist)
  applyIDToConfig.apply(validURLlist)
}

document.getElementById('submit').addEventListener('click', () => {
  submit()
  closeWindow()
})

document.getElementById('cancel').addEventListener('click', () => {
  closeWindow()
})
