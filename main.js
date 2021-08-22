const electron = require('electron')
const ipcMain = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Notification = electron.Notification
const electronStore = require('electron-store')
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
  }
  main_window = new BrowserWindow({
    frame: false,
    width: 292,
    height: 240,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + "/preload.js",
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
  // main_window.openDevTools()
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

ipcMain.on('newWindow', (event, args) => {
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
    title: "再生できません",
    body: "動画の所有者が、埋め込み動画プレーヤーでの再生を許可していません。。クリックで確認してください",
    icon: __dirname + '/src/icon/icon.ico'
  })
  message.on('click', () => {
    electron.shell.openExternal(args.videoUrl)
  })
  message.show()
  event.sender.send('messageShowed', 'showed')
  setTimeout(() => {
    message.close()
  }, 6000);
})

ipcMain.on('submitUrlList', (event, args) => {
  main_window.send('urlList', args)
  mkPlaylistWindow.close()
})

ipcMain.on('getUrlSettings', (event, args) => {
  const replyList = store.get('urlList', {
    list: []
  })
  replyList.list.forEach((element, index) => {
    if (!(element.length === 11)) {
      replyList.list.splice(index, 1)
    }
  });
  store.set('urlList', replyList)
  event.sender.send('replyUrlList', replyList)
})

ipcMain.on('setParsedIdlist', (event, args) => {
  store.set('urlList', {
    list: args
  })
})
