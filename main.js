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

app.on('ready', () => {
  if (!store.get('urlList')) {
    store.set('urlList', {
      list: []
    })
  } else if (!store.get('videoTitleList')) {
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
  mainWindow.setIcon(__dirname + "/src/icon/icon.ico")
  const contents = mainWindow.webContents
  contents.on('media-paused', (e, a) => {
    contents.send('pause')
  })
  contents.on('media-started-playing', (event, args) => {
    contents.send('playing')
  })
  mainWindow.openDevTools()
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
    mkPlaylistWindow.setMenu(null)
    mkPlaylistWindow.openDevTools()
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
  mkPlaylistWindow.close()
})

ipcMain.on('getVideoIDandTitle', (event, args) => {
  const IDlist = store.get('urlList', {
    list: []
  })
  const titleList = store.get('titleList', {
    list: []
  })
  event.sender.send('replyUrlList', {
    IDlist: IDlist.list,
    titleList: titleList.list
  })
})

ipcMain.on('storeIdList', (event, args) => {
  store.set('urlList', {
    list: args
  })
})
