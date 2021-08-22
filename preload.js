const ipcRenderer = require('electron').ipcRenderer
const contextBridge = require('electron').contextBridge
const url = require('url')
contextBridge.exposeInMainWorld(
  "api", {
    ipcRenderer: {
      send: (channel, data) => {
        ipcRenderer.send(channel, data)
      },
      on: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
      }
    },
    url: url
  }
)
