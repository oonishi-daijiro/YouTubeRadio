const ipcRenderer = require('electron').ipcRenderer
const contextBridge = require('electron').contextBridge
const url = require('url')
const getTitleOnYouTube = require('./src/getHtmlTitle/main').getTitleOnYoutube

contextBridge.exposeInMainWorld(
  "api", {
    ipcRenderer: {
      on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
      },
      once: (channel, func) => {
        ipcRenderer.once(channel, (event, ...args) => func(event, ...args));
      },
      send: (channel, data) => {
        ipcRenderer.send(channel, data);
      },
      storeIdList: (data) => {
        ipcRenderer.send('storeIdList', data);
      },
      submitIdListToPlayer: (data) => {
        ipcRenderer.send('submitIdListToPlayer', data);
      },
      getVideoIDandTitle: (data) => {
        ipcRenderer.send('getVideoIDandTitle', data)
      },
      closeMkplay: () => {
        ipcRenderer.send('closeMkplay');
      },
      closeWindow: () => {
        ipcRenderer.send('close')
      },
      minimizeWindow: (data) => {
        ipcRenderer.send('minimize', data)
      },
      requestYTvideoHtml: (id) => {
        ipcRenderer.send('requestYTvideoHtml', id)
      },
      openMkPlaylistWindow: (data) => {
        ipcRenderer.send('openMkPlaylistWindow', data)
      },
      sendErrorOfPlaying: (data) => {
        ipcRenderer.send('playingError', data);
      },
      storeTitleList: (data) => {
        ipcRenderer.send('storeTitleList', data)
      },
      getTitleAndStore: (data) => {
        ipcRenderer.send('getTitleAndStore', data)
      }
    },
    url: url,
    getTitleOnYoutube: (ID, callback) => {
      getTitleOnYouTube(ID, callback)
    }
  }
)
