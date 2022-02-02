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
      submitIdListToPlayer: (list) => {
        ipcRenderer.send('submitIdListToPlayer', list);
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
      openMkPlaylistWindow: (data) => {
        ipcRenderer.send('openMkPlaylistWindow', data)
      },
      sendErrorOfPlaying: (data) => {
        ipcRenderer.send('playingError', data);
      },
      storeTitleList: (data) => {
        ipcRenderer.send('storeTitleList', data)
      },
      applyIDToConfig: (id) => {
        ipcRenderer.send('applyIDToConfig', id)
      },
      getVideoIDandTitle: () => {
        ipcRenderer.send('getVideoIDandTitle')
      },
      jumpVideo: (index) => {
        ipcRenderer.send('jumpVideo', index)
      }
    },
    url: url,
    getTitleOnYoutube: (ID, callback) => {
      getTitleOnYouTube(ID, callback)
    }
  }
)
