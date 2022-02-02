const getTitleOnYoutube = window.api.getTitleOnYoutube
const getTitleAndIDfromConfig = window.api.ipcRenderer.getVideoIDandTitle
const ipcRenderer = window.api.ipcRenderer
const url = window.api.url

function htmlspecialchars(str) {
  return (str + '').replace(/&amp;/g, "&")
    .replace(/&quot;/g, '\"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

class Setting {
  constructor(tableID) {
    this.__table = document.getElementById(tableID)
    this.__rows = this.__table.rows
  }
  RemoveURLField(index) {
    const table = this.__table.rows
    if (table[index] === undefined) return
    table.removeChild(table[index])
  }
  AddRow() {
    const parent = this
    const table = this.__table
    const tr = document.createElement('tr')
    tr.className = 'URLfield-row'
    const td = document.createElement('td')
    td.className = "URLField-td"
    tr.appendChild(td)
    table.appendChild(tr)
    const index = table.rows.length - 1
    const implUI = {
      SetURLField(initialURL = "") {
        const input = document.createElement('input')
        input.type = "text"
        input.value = initialURL
        input.className = "URLField"
        input.placeholder = "YouTube URL"
        td.appendChild(input)
        tr.YoutubeRadio = {
          url: initialURL,
          getURLfromInput: () => {
            return input.value
          }
        }
        return implUI
      },
      SetTitleDisplay(initialTitle = "Loading") {
        const input = document.createElement('input')
        input.value = initialTitle
        input.className = "title"
        input.style.display = "flex"
        td.appendChild(input)
        return implUI
      },
      SetRemoveButton() {
        const button = document.createElement('i')
        button.className = 'fas fa-times removeId'
        td.appendChild(button)
        button.addEventListener('click', e => {
          if (table.rows.length === 1) {
            table.removeChild(tr)
            parent
              .AddRow()
              .SetRemoveButton()
              .SetURLField()
            return
          }
          table.removeChild(tr)
        })
        return implUI
      },
      SetJumpButton() {
        const button = document.createElement('i')
        button.className = 'fas fa-play jumpButton'
        td.appendChild(button)
        button.addEventListener('click', () => {
          ipcRenderer.jumpVideo(index)
          ipcRenderer.closeMkplay()
        })
        return implUI
      }
    }
    return implUI
  }
  GetTitleLIstFromConfig() {
    return new Promise((resolve, reject) => {
      getTitleAndIDfromConfig('')
      ipcRenderer.once('replyUrlList', (event, args) => {
        resolve(args.titleList)
      })
    })
  }
  GetIDListFromConfig() {
    return new Promise((resolve, reject) => {
      getTitleAndIDfromConfig('')
      ipcRenderer.once('replyUrlList', (event, args) => {
        resolve(args.IDlist)
      })
    })
  }
  parseURLlist(list) {
    const parsedList = list.filter(i => {
      const u = url.parse(i, true)
      return u.hostname === 'www.youtube.com' && u.query.v.length === 11 && i !== ""
    }).map((i) => {
      const u = url.parse(i, true)
      return u.query.v
    })
    return parsedList
  }
  ApplyToPlayer() {
    const inputedURLlist = []
    Array.from(this.__rows).forEach(e => {
      inputedURLlist.push(e.YoutubeRadio.getURLfromInput())
    })
    const IDlist = this.parseURLlist(inputedURLlist)
    ipcRenderer.submitIdListToPlayer(IDlist)
    this.__IDList = IDlist
  }
  ApplyToConfig() {
    ipcRenderer.applyToConfig(this.__IDList)
  }
  __table;
  __rows;
  __IDList;
};

const setting = new Setting('urls')



window.onload = () => {
  let IDlist;
  let titleList;
  (async () => {
    IDlist = await setting.GetIDListFromConfig()
    titleList = await setting.GetTitleLIstFromConfig()
  })().then(() => {
    console.log(IDlist)
    console.log(titleList)
    IDlist.list.forEach((e, index) => {
      console.log(e)
      setting
        .AddRow()
        .SetRemoveButton()
        .SetURLField(`youtube.com/watch?v=${e}`)
        .SetTitleDisplay(titleList.list[index])
        .SetJumpButton()
    })
  })
}

document.getElementById('addUrlButton').addEventListener('click', e => {
  setting
    .AddRow()
    .SetRemoveButton()
    .SetURLField()
})

document.getElementById('cancel').addEventListener('click', () => {
  window.api.ipcRenderer.closeMkplay()
})

document.getElementById('submit').addEventListener('click', () => {
  setting.ApplyToPlayer()
  setting.ApplyToConfig()
  window.api.ipcRenderer.closeMkplay()
})
