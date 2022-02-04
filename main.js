const electron = require('electron')
const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Notification = electron.Notification
const electronStore = require('electron-store')
const store = new electronStore({
  cwd: app.getPath('userData')
})
let mainWindow = null
let mkPlaylistWindow = null
const getLeastTitleList = require('./src/getHtmlTitle/main.js');
app.disableHardwareAcceleration()

app.on('ready', () => {
  if (!store.get('urlList')) {
    store.set('urlList', {
      list: []
    })
  }
  if (!store.get('videoTitleList')) {
    store.set('videoTitleList', {
      list: []
    })
  }
  mainWindow = new BrowserWindow({
    frame: false,
    width: 292,
    height: 240,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + "\\preload.js",
    },
    fullscreenable: false,
    maximizable: false,
    resizable: false,
    useContentSize: true
  })
  // mainWindow.openDevTools()
  mainWindow.setIcon(__dirname + "/src/icon/icon.ico")
  const contents = mainWindow.webContents
  contents.on('media-paused', (e, a) => {
    contents.send('pause')
  })
  contents.on('media-started-playing', (event, args) => {
    contents.send('playing')
  })
  mainWindow.loadFile('./src/renderer/main/renderer.html')
  ipcMain.on('close', () => {
    app.exit()
  })

  ipcMain.on('minimize', () => {
    mainWindow.minimize()
  })
}) // app on


ipcMain.on('openMkPlaylistWindow', (event, args) => {
  if (!mkPlaylistWindow) {
    mkPlaylistWindow = new BrowserWindow({
      width: 500,
      height: 366,
      parent: mainWindow,
      modal: true,
      frame: false,
      fullscreenable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: __dirname + "/preload.js"
      },
      maximizable: false,
      resizable: false,
      useContentSize: true
    })
    // mkPlaylistWindow.openDevTools()
    mkPlaylistWindow.setMenu(null)
    mkPlaylistWindow.loadFile('./src/renderer/mkPlaylist/index.html')
    mkPlaylistWindow.on('close', () => {
      mkPlaylistWindow = null
    })
  }
})

ipcMain.on('closeMkplay', (event, args) => {
  mkPlaylistWindow.close()
})

ipcMain.on('playingError', (event, args) => {
  const message = new Notification({
    title: "問題が発生しました",
    body: `${args.errorBody}\nERRORCODE:${args.data}`,
    icon: __dirname + '/src/icon/icon.ico'
  })
  message.on('click', () => {
    if (!args.videoUrl) return
    electron.shell.openExternal(args.videoUrl)
  })
  message.show()
  setTimeout(() => {
    message.close()
  }, 6000);
})

ipcMain.on('submitIdListToPlayer', (event, args) => { // should receive from make playlist window
  mainWindow.send('applyNewPlaylist', args)
})

ipcMain.on('jumpVideo', (evemt, index) => {
  mainWindow.send('jumpVideo', index)
})

ipcMain.on('getVideoIDandTitle', (evemt, arg) => {
  const currentIDlist = store.get('urlList', {
    list: []
  })
  const currentTitleList = store.get('videoTitleList', {
    list: []
  })
  evemt.sender.send('replyUrlList', {
    titleList: currentTitleList,
    IDlist: currentIDlist
  })
})

ipcMain.on('applyIDToConfig', (event, leastIDlist) => {
  const currentIDlist = store.get('urlList', {
    list: []
  })
  const currentTitleList = store.get('videoTitleList', {
    list: []
  })
  store.set('urlList', {
    list: leastIDlist
  })
  const leastTitleList = getLeastTitleList(leastIDlist, currentIDlist.list, currentTitleList.list)
  leastTitleList.then(titleList => {
    store.set('videoTitleList', {
      list: titleList
    })
  })
})
