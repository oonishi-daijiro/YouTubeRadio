const electron = require('electron')
const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Notification = electron.Notification
const electronStore = require('electron-store')
const https = require('https')
const store = new electronStore({
  cwd: app.getPath('userData')
})
let main_window = null
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
  main_window = new BrowserWindow({
    frame: false,
    width: 292,
    height: 240,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + "\\preload.js",
    },
    maximizable: false,
    resizable: false,
    useContentSize: true
  })
  main_window.setIcon(__dirname + "/src/icon/icon.ico")
  const contents = main_window.webContents
  contents.on('media-paused', (e, a) => {
    contents.send('pause', e)
  })
  contents.on('media-started-playing', (event, args) => {
    contents.send('playing', event)
  })
  main_window.openDevTools()
  main_window.loadFile('./src/renderer/main/renderer.html')
  main_window.on('close', () => {
    electron.app.quit()
    main_window = null
    mkPlaylistWindow = null
  })
}) // app on

// ipcMain process
ipcMain.on('close', (event, args) => {
  electron.app.quit()
})

ipcMain.on('minimize', (event, args) => {
  main_window.minimize()
})

ipcMain.on('openMkPlaylistWindow', (event, args) => {
  if (!mkPlaylistWindow) {
    mkPlaylistWindow = new BrowserWindow({
      width: 500,
      height: 366,
      parent: main_window,
      modal: true,
      frame: false,
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
  } else {
    mkPlaylistWindow.show()
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
  main_window.send('applyNewPlaylist', args)
  mkPlaylistWindow.close()
})

ipcMain.on('getVideoIDandTitle', (event, args) => {
  const replyList = store.get('urlList', {
    list: []
  })
  event.sender.send('replyUrlList', replyList)
})

ipcMain.on('storeIdList', (event, args) => {
  store.set('urlList', {
    list: args
  })
})
