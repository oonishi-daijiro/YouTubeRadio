const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
document.getElementById('pause').className = 'fas fa-play'
const ipcRenderer = window.api.ipcRenderer
let player; //youtube iframe api instance will be here

function onYouTubeIframeAPIReady() { // when youtube iframe api get ready, this function will call
  player = new YT.Player('player', {
    height: '300',
    width: '288',
    events: {
      'onReady': YTonPlayerReady,
      'onStateChange': YTonStateChange,
      'onError': YTonPlayerError
    }
  });
}

function getListOfIDandTitleFromStore(callback) {
  (async () => {
    const idList = await new Promise((resolve, reject) => {
      ipcRenderer.getVideoIDandTitle('')
      ipcRenderer.once('replyUrlList', (event, args) => {
        resolve(args);
      })
    })
    return idList
  })().then((replyData) => {
    callback(replyData)
  })
}

function YTonPlayerReady(event) {
  getListOfIDandTitleFromStore((list) => {
    const idListArray = Array.from(list.IDlist)
    if (idListArray.length === 0) return
    player.loadPlaylist({
      listType: "playlist",
      playlist: idListArray
    })
    player.setVolume(50)
    player.setLoop(true)
  })
}

function removeInvalidIDandStoreAndApplyNewPlaylist() {
  const currentList = player.getPlaylist()
  const currentIndex = player.getPlaylistIndex()
  if (currentIndex > currentList.length - 1) {
    currentIndex = 0
  }
  currentList.splice(currentIndex, 1)
  player.loadPlaylist({
    listType: "playlist",
    playlist: currentList,
    index: currentIndex
  })
  player.setLoop(true)
  player.setVolume(50)
  if (currentList === undefined) currentList = []
  ipcRenderer.storeIdList(currentList)
  getListOfIDandTitleFromStore(list => {
    const currentTitleList = Array.from(list.titleList)
    currentTitleList.splice(currentIndex, 1)
    ipcRenderer.storeTitleList(currentTitleList)
  })
}




function YTonPlayerError(event) {
  if (event.data === 150) {
    ipcRenderer.sendErrorOfPlaying({
      data: event.data,
      videoUrl: player.getVideoUrl(),
      errorBody: "動画の所有者が、埋め込み動画プレーヤーでの再生を許可していないため再生できません\nクリックで確認"
    })
    removeInvalidIDandStoreAndApplyNewPlaylist()
  }
}

//if the current index is 0 and applies a new playlist that has unallowed video play on iframe at first index, the youtube iframe API shows an error and can not use any of it. the way to fix them is to remove the invalid IDs and apply again.

ipcRenderer.on('applyNewPlaylist', (event, args) => {
  const videoIdList = args.filter(() => true)
  const currentVideoIDList = player.getPlaylist()
  if (currentVideoIDList === null) { // when the player didn't set the playlist
    player.loadPlaylist({
      listType: "playlist",
      playlist: videoIdList
    })
    return
  } else if (videoIdList.length === 0) { // when applyed the playlist that has no value []
    player.loadPlaylist({
      listType: "playlist",
      playlist: []
    })
    ipcRenderer.storeIdList([])
    return
  }
  let currentIndex = player.getPlaylistIndex()
  const currentID = currentVideoIDList[currentIndex]
  let currentTime = player.getCurrentTime()

  if (currentID !== videoIdList[currentIndex]) {
    currentTime = 0
  }

  soundBars.forEach(element => {
    element.style.animationPlayState = 'running'
  })

  player.loadPlaylist({
    listType: "playlist",
    playlist: videoIdList,
    index: currentIndex,
    startSeconds: currentTime,
  })
  player.setLoop(true)
  player.seekTo(currentTime, true)
  player.setVolume(50)
})

function YTonStateChange(event) {}

const soundBars = []
const bars = document.getElementsByClassName('bars')
Array.from(bars).forEach((e) => {
  soundBars.push(e)
})

const getUrl = document.getElementById('getUrl')
getUrl.addEventListener('click', () => {
  ipcRenderer.openMkPlaylistWindow()
})

const pauseButton = document.getElementById('pause')

pauseButton.addEventListener('click', () => {
  pauseButton.className === "fas fa-pause" ? (() => {
    player.pauseVideo()
    pauseButton.className = "fas fa-play"
    soundBars.forEach(element => {
      element.style.animationPlayState = 'paused'
    });
  })() : (() => {
    player.playVideo()
    pauseButton.className = "fas fa-pause"
    soundBars.forEach(element => {
      element.style.animationPlayState = 'running'
    });
  })()
}, false)

const previousVideo = document.getElementById('previousVideo')

previousVideo.addEventListener('click', () => {
  if (!player.getPlaylist().length) {
    return
  }
  player.previousVideo()
})

const nextVideo = document.getElementById('nextVideo')

nextVideo.addEventListener('click', () => {
  if (!player.getPlaylist().length) {
    return
  }
  player.nextVideo()
}, false)

const volume = document.getElementById('volume')

volume.addEventListener('click', () => {
  volume.style.display = 'none'
  canvas.style.display = 'block'
  let volume_num = 50 - player.getVolume() / 2
  field.fillStyle = '#444444';
  field.fillRect(0, volume_num, canvas.width, canvas.height);
}, false)

const canvas = document.getElementById('canvas')
const field = canvas.getContext('2d')

function setVolumeFromOfsetY(y) {
  field.fillStyle = '#444444';
  field.clearRect(0, 0, canvas.width, y + 50);
  field.fillRect(0, y, canvas.width, canvas.height);
  player.setVolume(100 - y * 2)
  y >= 50 ? (() => {
    volume.className = 'fas fa-volume-mute'
  })() : (() => {
    volume.className = 'fas fa-volume-up'
  })()
}

canvas.addEventListener('click', (event) => {
  if (event.which === 1) {
    setVolumeFromOfsetY(event.offsetY)
  }
}, false);

canvas.addEventListener('mousemove', (event) => {
  if (event.which === 1) {
    setVolumeFromOfsetY(event.offsetY)
  }
}, false);

canvas.addEventListener('mouseup', () => {
  setTimeout(() => {
    canvas.style.display = 'none'
    volume.style.display = 'block'
  }, 500);
}, false)

canvas.addEventListener('mouseout', () => {
  setTimeout(() => {
    canvas.style.display = 'none'
    volume.style.display = 'block'
  }, 500);
}, false)



// renderer event process

ipcRenderer.on('pause', (e) => {
  pauseButton.className = "fas fa-play"
  soundBars.forEach(element => {
    element.style.animationPlayState = "paused"
  });
})

ipcRenderer.on('playing', (e) => {
  pauseButton.className = "fas fa-pause"
  soundBars.forEach(element => {
    element.style.animationPlayState = 'running'
  });
})

const close = document.getElementById('close_button')

close.addEventListener('click', () => {
  ipcRenderer.closeWindow()
}, false)

const minimize = document.getElementById('minimize')

minimize.addEventListener('click', () => {
  ipcRenderer.minimizeWindow()
}, false)
